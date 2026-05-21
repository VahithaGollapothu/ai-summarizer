import { YoutubeTranscript } from "youtube-transcript";
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function generateYoutubeStructuredData(text) {

    const prompt = `
Summarize this YouTube transcript.

Return ONLY valid JSON in this format:

{
  "shortSummary": "...",
  "detailedSummary": "...",
  "keyTakeaways": ["...", "..."],
  "timestamps": [
    {
      "time": "0:00",
      "description": "..."
    }
  ]
}

Transcript:
${text.substring(0, 8000)}
`;

    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content:
                    "You are an AI assistant that ONLY returns valid JSON.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" },
    });

    const raw =
        completion.choices[0]?.message?.content || "{}";

    try {
        return JSON.parse(raw);
    } catch {
        return {
            shortSummary: "Summary generated",
            detailedSummary: raw,
            keyTakeaways: [],
            timestamps: [],
        };
    }
}

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed",
        });
    }

    try {

        console.log("BODY:", req.body);

        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                error: "YouTube URL is required",
            });
        }

        // Convert shorts URL
        let cleanUrl = url;

        if (url.includes("/shorts/")) {
            const id =
                url.split("/shorts/")[1].split("?")[0];

            cleanUrl =
                `https://www.youtube.com/watch?v=${id}`;
        }

        console.log("FETCHING TRANSCRIPT");

        const transcript =
            await YoutubeTranscript.fetchTranscript(
                cleanUrl
            );

        if (!transcript || transcript.length === 0) {
            throw new Error("Transcript unavailable");
        }

        const text = transcript
            .map((t) => t.text)
            .join(" ");

        console.log("GENERATING SUMMARY");

        const data =
            await generateYoutubeStructuredData(text);

        return res.status(200).json({
            ...data,
            originalLength: text.split(" ").length,
        });

    } catch (err) {

        console.error("YOUTUBE API ERROR:", err);

        return res.status(200).json({
            shortSummary: "Transcript unavailable.",
            detailedSummary:
                "This video may not support captions or transcript extraction.",
            keyTakeaways: [
                "Transcript could not be fetched",
                "Try another YouTube video",
            ],
            timestamps: [],
            warning: err.message || "Unknown error",
        });
    }
}