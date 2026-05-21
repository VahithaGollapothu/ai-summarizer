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

        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                error: "Text is required"
            });
        }
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: `Summarize this text:\n\n${text}`,
                },
            ],
            model: "llama-3.1-8b-instant",
        });

        const summary =
            chatCompletion.choices[0]?.message?.content || "No summary generated";

        return res.status(200).json({
            summary,
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: error.message,
        });

    }
}