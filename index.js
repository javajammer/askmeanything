export default {
    async fetch(request, env) {
        try {
            let body;
            try {
                // Coba parsing sebagai JSON terlebih dahulu (optimasi jika JSON umum)
                body = await request.json();
            } catch (jsonError) {
                // Jika gagal, coba parsing sebagai form-data
                body = await request.formData();
            }

            const text = body.text || body.get("text") || "";
            const userName = body.user_name || body.get("user_name") || "User";
            const channelId = body.channel_id || body.get("channel_id") || "";

            const aiResponse = await analyzeQuestionWithAI(text, env);

            const responseMessage = `
                @${userName} bertanya: "${text}"
                Jawaban: ${aiResponse}
            `;

            return new Response(JSON.stringify({
                response_type: "in_channel",
                text: responseMessage
            }), {
                headers: { "Content-Type": "application/json" }
            });

        } catch (error) {
            console.error("Error processing webhook:", error);
            // Log error yang lebih detail (contoh)
            console.error(error.stack);
            return new Response(JSON.stringify({
                response_type: "ephemeral",
                text: "Terjadi kesalahan saat memproses pertanyaan."
            }), {
                headers: { "Content-Type": "application/json" }
            });
        }
    }
};

async function analyzeQuestionWithAI(question, env) {
    try {
        const chatInput = {
            messages: [
                { role: 'system', content: 'Kamu adalah ahli di semua bidang. Jawab pertanyaan singkat padat namun jelas, kecuali diminta menjelaskan lebih detail.' },
                { role: 'user', content: question }
            ]
        };

        const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fp8', chatInput);

        const output = response.response || "Maaf, saya tidak bisa menjawab pertanyaan ini.";
        console.log("Raw AI Response:", output);

        const parsedOutput = parseAnalysisOutput(output);

        return parsedOutput.fullResponse;
    } catch (error) {
        console.error("Error analyzing question with AI:", error);
        return "Terjadi kesalahan saat memproses pertanyaan.";
    }
}

const parseAnalysisOutput = (output) => {
    const lines = output.split("\n").map(line => line.trim());
    return {
        fullResponse: lines.join(" ")
    };
};
