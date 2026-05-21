import { YoutubeTranscript } from "youtube-transcript";
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function generateYoutubeStructuredData(text) {

    const prompt = `
Summarize this YouTube transcript.

Return ONLY valid JSON with these 4 keys:
- shortSummary
- detailedSummary
- keyTakeaways (array of strings)
- timestamps (array of objects with time and description)

Transcript:
${text.substring(0, 10000)}
`;

    const chatCompletion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content:
                    "You are a helpful AI assistant. Respond ONLY with valid JSON.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" },
    });

    const rawContent =
        chatCompletion.choices[0]?.message?.content || "{}";

    return JSON.parse(rawContent);
}

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed",
        });
    }

    try {

        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                error: "YouTube URL is required",
            });
        }

        // Convert Shorts URL to normal URL
        let cleanUrl = url;

        if (url.includes("/shorts/")) {
            const id = url.split("/shorts/")[1].split("?")[0];
            cleanUrl = `https://www.youtube.com/watch?v=${id}`;
        }

        // Fetch transcript
        const transcript =
            await YoutubeTranscript.fetchTranscript(cleanUrl);

        if (!transcript || transcript.length === 0) {
            throw new Error("Transcript unavailable");
        }

        // Combine transcript text
        const text = transcript.map((t) => t.text).join(" ");

        // Generate AI summary
        const data =
            await generateYoutubeStructuredData(text);

        if (!data) {
            throw new Error(
                "Failed to generate YouTube summary data"
            );
        }

        return res.status(200).json({
            ...data,
            originalLength: text.split(" ").length,
        });

    } catch (err) {

        console.error("YouTube Error:", err);

        // Invalid URL
        if (
            err.message?.includes(
                "Impossible to retrieve Youtube video ID"
            )
        ) {
            return res.status(400).json({
                error:
                    "Invalid YouTube URL. Please provide a valid link.",
            });
        }

        // Transcript disabled/private/etc
        return res.status(200).json({
            shortSummary: "Transcript unavailable.",
            detailedSummary:
                "This video may have captions disabled, be private, age restricted, or unsupported.",
            keyTakeaways: [
                "Could not fetch transcript",
                "Try another YouTube video",
            ],
            timestamps: [],
            warning: err.message,
        });
    }
}