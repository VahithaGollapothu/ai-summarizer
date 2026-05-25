import axios from "axios";
import * as cheerio from "cheerio";
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

        const { url } = req.body;

        if (!url) {

            return res.status(400).json({
                error: "URL is required"
            });
        }

        /**
         * FETCH WEBSITE
         */
        let html = "";

        try {

            const response = await axios.get(url, {

                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                },

                timeout: 15000,
            });

            html = response.data;

        } catch (fetchError) {

            console.error(
                "Website Fetch Error:",
                fetchError.message
            );

            return res.status(200).json({

                summary:
                    "This website blocks automated scraping requests. Try another article or website.",

                warning:
                    fetchError.message
            });
        }

        /**
         * PARSE HTML
         */
        const $ = cheerio.load(html);

        $("script").remove();
        $("style").remove();
        $("noscript").remove();

        const text =
            $("body")
                .text()
                .replace(/\s+/g, " ")
                .trim();

        if (!text || text.length < 200) {

            return res.status(200).json({

                summary:
                    "Could not extract enough readable content from this website."
            });
        }

        /**
         * LIMIT TEXT
         */
        const limitedText =
            text.slice(0, 12000);

        /**
         * AI SUMMARY
         */
        const completion =
            await groq.chat.completions.create({

                model: "llama-3.1-8b-instant",

                messages: [

                    {
                        role: "system",

                        content:
                            "Summarize the article clearly in concise bullet points."
                    },

                    {
                        role: "user",

                        content: limitedText
                    }
                ],

                temperature: 0.3,
            });

        const summary =
            completion.choices?.[0]?.message?.content
            || "No summary generated.";

        return res.status(200).json({
            summary
        });

    } catch (error) {

        console.error(
            "URL Summarizer Fatal Error:",
            error
        );

        return res.status(200).json({

            summary:
                "Something went wrong while processing the URL.",

            error:
                error.message
        });
    }
}  