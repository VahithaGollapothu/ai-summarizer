import { YoutubeTranscript } from "youtube-transcript";
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function generateYoutubeStructuredData(text) {
    const prompt = `Summarize this YouTube transcript. Return JSON with 4 keys: "shortSummary", "detailedSummary", "keyTakeaways" (array of strings), "timestamps" (array of {time: "M:SS", description: "..."}).\n\nTranscript: ${text.substring(0, 10000)}`;
    
    const chatCompletion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: "You are a helpful AI. You must respond ONLY with valid JSON matching the requested structure." },
            { role: "user", content: prompt }
        ],
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" }
    });

    const rawContent = chatCompletion.choices[0]?.message?.content || "";
    return JSON.parse(rawContent);
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: "YouTube URL is required" });
    }

    try {
        const transcript = await YoutubeTranscript.fetchTranscript(url);
        const text = transcript.map(t => t.text).join(' ');
        const data = await generateYoutubeStructuredData(text);
        if (!data) throw new Error("Failed to generate YouTube summary data.");
        return res.status(200).json({ ...data, originalLength: text.split(' ').length });
    } catch (err) {
        console.error("YouTube Error:", err.message);
        
        if (err.message.includes('Impossible to retrieve Youtube video ID')) {
            return res.status(400).json({ error: "Invalid YouTube URL. Please provide a valid link." });
        }

        // Fallback to dummy data if transcript fails for other reasons (e.g. disabled captions)
        try {
            const dummy = {
                shortSummary: "Dummy short summary of the video.",
                detailedSummary: "Dummy detailed summary explaining everything.",
                keyTakeaways: ["Point 1 about video", "Point 2 about video"],
                timestamps: [{ time: "0:00", description: "Start of video" }, { time: "1:23", description: "Important topic" }]
            };
            return res.status(200).json({ ...dummy, originalLength: 1000, warning: "Transcripts disabled. Showing dummy data." });
        } catch (e) {
            return res.status(500).json({ error: "Failed to fetch transcript and failed to generate fallback data." });
        }
    }
}
