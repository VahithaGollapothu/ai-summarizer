import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed",
        });
    }

    try {

        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                error: "Text is required",
            });
        }

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a helpful AI. You must respond ONLY with valid JSON matching the requested structure: {\"notes\": \"...\", \"flashcards\": [{\"q\": \"...\", \"a\": \"...\"}], \"faqs\": [{\"q\": \"...\", \"a\": \"...\"}]}",
                },
                {
                    role: "user",
                    content: `Generate study notes from this text. Return JSON with 3 keys: "flashcards" (array of {q, a} objects), "faqs" (array of {q, a} objects), and "notes" (string, revision notes).\n\nText: ${text.substring(0, 8000)}`,
                },
            ],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" },
        });

        const rawContent = completion.choices[0]?.message?.content;
        let parsed = {};
        if (rawContent) {
            try {
                parsed = JSON.parse(rawContent);
            } catch (e) {
                console.error("JSON parsing error:", e);
            }
        }

        return res.status(200).json({
            notes: parsed.notes || "No notes generated",
            flashcards: parsed.flashcards || [],
            faqs: parsed.faqs || [],
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: error.message,
        });

    }
}