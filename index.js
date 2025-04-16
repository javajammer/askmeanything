const SYSTEM_MESSAGE = {
  role: 'system',
  content: 'Kamu adalah robot bernama Mas Rizal, dibuat oleh PT. Infokes Indonesia, Kamu ahli di semua bidang. Jawab pertanyaan dengan jawaban yang sebenarnya, singkat padat namun jelas, kecuali diminta menjelaskan lebih detail. Selalu perhatikan riwayat percakapan untuk memahami referensi seperti "itu", "di sana", atau "hal tersebut". Jika ada kata yang merujuk ke topik sebelumnya, hubungkan dengan jawaban terakhir yang relevan. Jika tidak yakin, jawab berdasarkan kemungkinan terbaik tanpa mengarang.'
};
const FOOTER = "\n\nAI dapat membuat kesalahan, pergunakan secara bertanggung jawab.";
const MAX_TOTAL = 10000;
const MAX_CHUNK = 3500;
const MAX_KEYWORDS = 50;
const STOPWORDS = new Set(['dan', 'atau', 'yang', 'di', 'ke', 'dari', 'untuk', 'adalah', 'itu', 'ini', 'apa', 'bagaimana', 'mengapa']);

export default {
  async fetch(request, env) {
    console.log("Received request at:", new Date().toISOString());

    const contentType = request.headers.get("Content-Type") || "";
    console.log("Content-Type:", contentType);

    let body;
    try {
      body = contentType.startsWith("application/json") ? await request.json() : await request.formData();
      console.log("Request body parsed:", body);
    } catch (e) {
      console.error("Error parsing request body:", e.message);
      return new Response('{"response_type":"ephemeral","text":"Error parsing request body."}', {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const text = body.text || body.get("text") || "";
    const userName = body.user_name || body.get("user_name") || "User";
    console.log("Extracted text:", text, "User:", userName);

    if (!text) {
      console.log("No text provided, returning error.");
      return new Response('{"response_type":"ephemeral","text":"Tidak ada pertanyaan."}', {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const conversationKey = `conversation:${userName}`;
    const keywordsKey = `keywords:${userName}`;
    let conversationHistory = [];
    let contextKeywords = new Set();

    console.log("Fetching conversation history from KV...");
    try {
      const historyRaw = await env.KV_STORAGE.get(conversationKey, { type: "text" });
      if (historyRaw) conversationHistory = JSON.parse(historyRaw);
      if (conversationHistory.length > 20) conversationHistory = conversationHistory.slice(-20);
      console.log("KV Retrieved History:", JSON.stringify(conversationHistory));
    } catch (e) {
      console.error("KV Get Error:", e.message);
    }

    console.log("Fetching keywords from KV...");
    try {
      const keywordsRaw = await env.KV_STORAGE.get(keywordsKey, { type: "text" });
      if (keywordsRaw) contextKeywords = new Set(keywordsRaw.split(',').map(keyword => keyword.trim()));
      console.log("Keywords fetched, count:", contextKeywords.size);
    } catch (e) {
      console.error("KV Get Keywords Error:", e.message);
    }

    let lastContext = '';
    if (conversationHistory.length > 0) {
      const lastAssistantMessage = conversationHistory
        .slice(-1)
        .find(msg => msg.role === 'assistant')?.content || '';
      const words = lastAssistantMessage.toLowerCase().split(/\s+/);
      for (const word of words) {
        if ((contextKeywords.has(word) || word.length > 3) && !STOPWORDS.has(word)) {
          lastContext = word.charAt(0).toUpperCase() + word.slice(1);
          break;
        }
      }
      console.log("Last context extracted:", lastContext);
    }

    let enhancedText = text;
    if (conversationHistory.length > 0 && /itu|di\s+sana|hal\s+tersebut/i.test(text)) {
      if (lastContext) {
        enhancedText = text.replace(/\bitu\b|\bdi\s+sana\b|\bhal\s+tersebut\b/gi, lastContext);
        console.log("Context Replacement:", { original: text, enhanced: enhancedText });
      } else {
        console.log("No matching context found for replacement.");
      }
    }

    if (conversationHistory.length === 0 && /itu|di\s+sana|hal\s+tersebut/i.test(text)) {
      console.log("No history, unclear reference, returning error.");
      return new Response('{"response_type":"ephemeral","text":"Maaf, maksud Anda apa? Saya belum punya konteks sebelumnya."}', {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const messages = [SYSTEM_MESSAGE, ...conversationHistory, { role: 'user', content: enhancedText }];
    console.log("Messages Sent to AI:", JSON.stringify(messages));

    let aiResponse;
    try {
      console.log("Calling AI.run...");
      const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fp8', { messages, max_tokens: 500 });
      aiResponse = (response.response || "Maaf, saya tidak bisa menjawab.").trim();
      console.log("AI Response:", aiResponse);
    } catch (e) {
      console.error("AI Run Error:", e.message);
      return new Response('{"response_type":"ephemeral","text":"Error saat memproses permintaan AI."}', {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log("Extracting new keywords from text and response...");
    try {
      const newWords = (text + ' ' + aiResponse).toLowerCase().split(/\s+/);
      for (const word of newWords) {
        if (word.length > 3 && !STOPWORDS.has(word)) {
          contextKeywords.add(word);
        }
      }

      const keywordsArray = Array.from(contextKeywords);
      if (keywordsArray.length > MAX_KEYWORDS) {
        contextKeywords = new Set(keywordsArray.slice(-MAX_KEYWORDS));
      }
      console.log("Updated keywords, count:", contextKeywords.size);

      await env.KV_STORAGE.put(keywordsKey, Array.from(contextKeywords).join(','), { expirationTtl: 86400 });
      console.log("Keywords saved to KV.");
    } catch (e) {
      console.error("Error updating keywords:", e.message);
    }

    conversationHistory.push({ role: 'user', content: text }, { role: 'assistant', content: aiResponse });
    try {
      await env.KV_STORAGE.put(conversationKey, JSON.stringify(conversationHistory), { expirationTtl: 86400 });
      console.log("KV Stored Successfully - History Length:", conversationHistory.length);
      console.log("Stored History Content:", JSON.stringify(conversationHistory));
    } catch (e) {
      console.error("KV Put Error:", e.message);
    }

    console.log("Formatting response...");
    const responseMessage = formatResponse(userName, text, aiResponse);
    console.log("Response formatted, length:", responseMessage.length);

    console.log("Returning final response...");
    return new Response(`{"response_type":"in_channel","text":${JSON.stringify(responseMessage)}}`, {
      headers: { "Content-Type": "application/json" }
    });
  }
};

function formatResponse(userName, text, aiResponse) {
  const headerBase = `@${userName} bertanya: "${text.length > 100 ? text.slice(0, 97) + "..." : text}"\n`;
  const chunkOverhead = headerBase.length + FOOTER.length + 10;

  if (aiResponse.length > MAX_TOTAL) {
    aiResponse = aiResponse.slice(0, MAX_TOTAL - 50) + "\n[Potong]";
  }

  if (aiResponse.length <= MAX_CHUNK - chunkOverhead) {
    return `${headerBase}\`\`\`\n${aiResponse}\n\`\`\`${FOOTER}`;
  }

  const chunks = [];
  const chunkSize = MAX_CHUNK - chunkOverhead - 20;
  for (let i = 0, len = aiResponse.length; i < len; i += chunkSize) {
    chunks.push(aiResponse.slice(i, i + chunkSize));
  }

  let result = Buffer.from('');
  for (let i = 0, len = chunks.length; i < len; i++) {
    if (i > 0) result = Buffer.concat([result, Buffer.from('\n\n')]);
    result = Buffer.concat([
      result,
      Buffer.from(`${headerBase}Bagian ${i + 1}:\n\`\`\`\n${chunks[i]}\n\`\`\`${FOOTER}`)
    ]);
  }
  return result.toString();
}
