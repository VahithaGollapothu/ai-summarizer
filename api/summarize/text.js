import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const { text, length = 'Medium', style = 'Paragraph', eli5 = false } = req.body;

        if (!text) {
            return res.status(400).json({
                error: "Text is required"
            });
        }

        let prompt = `Summarize the following text.\nLength: ${length}\nStyle: ${style}\n`;
        if (eli5) {
            prompt += "Explain it like I'm 5 years old (ELI5).\n";
        }
        prompt += `\nText:\n${text}`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a highly capable AI assistant that summarizes text accurately. Return the output as a plain string.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "llama-3.1-8b-instant",
        });

        const summary =
            chatCompletion.choices[0]?.message?.content || "No summary generated";

        return res.status(200).json({
            summary,
            originalLength: text.split(' ').length,
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: error.message,
        });

    }
}