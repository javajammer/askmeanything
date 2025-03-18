// Precompute system message
const systemMessage = {
  role: 'system',
  content: 'Kamu adalah bot ahli di semua bidang buatan mas franky. Jawab pertanyaan singkat padat namun jelas, kecuali diminta menjelaskan lebih detail.'
};

export default {
  async fetch(request, env) {
    try {
      let body;
      const contentType = request.headers.get("Content-Type") || "";

      // Cek Content-Type dengan startsWith (lebih cepat)
      if (contentType.startsWith("application/json")) {
        body = await request.json();
      } else {
        body = await request.formData();
      }

      // Akses properti dengan destructuring
      const text = body.text || body.get("text") || "";
      const userName = body.user_name || body.get("user_name") || "User";

      // Validasi input
      if (!text) {
        throw new Error("Tidak ada pertanyaan yang disertakan.");
      }

      // Panggil AI
      const aiResponse = await analyzeQuestionWithAI(text, env);

      // Format respons dengan operasi string yang lebih efisien
      const responseMessage = 
        "@" + userName + " bertanya: \"" + text + "\"\nJawaban: " + aiResponse.trim();

      return new Response(JSON.stringify({
        response_type: "in_channel",
        text: responseMessage
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response(JSON.stringify({
        response_type: "ephemeral",
        text: "Terjadi kesalahan saat memproses pertanyaan."
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};

async function analyzeQuestionWithAI(question, env) {
  try {
    const chatInput = {
      messages: [
        systemMessage,
        { role: 'user', content: question }
      ]
    };

    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fp8', chatInput);
    const output = response.response || "Maaf, saya tidak bisa menjawab pertanyaan ini.";
    console.log("Raw AI Response:", output);
    return output.trim(); // Hapus whitespace berlebih
  } catch (error) {
    console.error("Error analyzing question with AI:", error);
    return "Terjadi kesalahan saat memproses pertanyaan.";
  }
}
