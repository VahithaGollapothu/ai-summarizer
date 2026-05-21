import axios from "axios";
import * as cheerio from "cheerio";
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    let { url, length = 'Medium', style = 'Paragraph', eli5 = false } = req.body;
    if (!url) {
        return res.status(400).json({ error: "URL is required" });
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = response.data;
        const $ = cheerio.load(html);
        
        let extractedText = '';
        $('p').each((i, el) => {
            extractedText += $(el).text() + '\n';
        });

        if (!extractedText.trim()) {
            return res.status(400).json({ error: "Could not extract any text from this URL. The page might be empty or require JavaScript." });
        }

        let prompt = `Summarize the following text.\nLength: ${length}\nStyle: ${style}\n`;
        if (eli5) {
            prompt += "Explain it like I'm 5 years old (ELI5).\n";
        }
        prompt += `\nText:\n${extractedText}`;

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

        const summary = chatCompletion.choices[0]?.message?.content || "No summary generated";

        return res.status(200).json({
            originalLength: extractedText.split(' ').length,
            summary,
            extractedText
        });
    } catch (err) {
        console.error("URL Fetch Error:", err.message);
        return res.status(500).json({ error: "Failed to fetch URL. Ensure the URL is valid, or the website might be blocking automated requests." });
    }
}
