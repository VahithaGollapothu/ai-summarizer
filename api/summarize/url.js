import axios from "axios";
import * as cheerio from "cheerio";
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

async function generateSummary(text) {

    const completion =
        await groq.chat.completions.create({

            messages: [
                {
                    role: "system",
                    content:
                        "Summarize the content clearly."
                },

                {
                    role: "user",
                    content: text.slice(0, 12000)
                }
            ],

            model: "llama-3.1-8b-instant",
        });

    return (
        completion.choices[0]?.message?.content
        || "No summary generated."
    );
}

export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const { url } = req.body;

        if (!url) {

            return res.status(400).json({
                error: "URL is required"
            });
        }

        /**
         * FETCH WEBSITE
         */
        const response = await axios.get(url, {

            headers: {
                "User-Agent":
                    "Mozilla/5.0"
            },

            timeout: 10000,
        });

        /**
         * PARSE HTML
         */
        const $ = cheerio.load(response.data);

        $("script").remove();
        $("style").remove();

        const text =
            $("body").text()
                .replace(/\s+/g, " ")
                .trim();

        if (!text || text.length < 100) {

            return res.status(400).json({
                error:
                    "Could not extract enough text from this website."
            });
        }

        /**
         * GENERATE SUMMARY
         */
        const summary =
            await generateSummary(text);

        return res.status(200).json({
            summary
        });

    } catch (error) {

        console.error(
            "URL Summarizer Error:",
            error.message
        );

        return res.status(500).json({

            error:
                "Failed to fetch URL. Website may block automated requests."
        });
    }
}