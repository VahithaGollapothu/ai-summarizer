import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Helper method to run Express middleware in Vercel Serverless
function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}

const upload = multer({ storage: multer.memoryStorage() });
const multerSingle = upload.single('file');

export const config = {
    api: {
        bodyParser: false, // Disables standard body parsing, required for multer to work
    },
};

async function generateKeywords(text) {
    const prompt = `Extract exactly 5 most important keywords or short key phrases from this text. Return JSON: {"keywords": ["word1", "word2"]}\n\nText: ${text.substring(0, 5000)}`;
    const chatCompletion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: "You are a helpful AI. You must respond ONLY with valid JSON matching the requested structure." },
            { role: "user", content: prompt }
        ],
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" }
    });
    const rawContent = chatCompletion.choices[0]?.message?.content || "";
    try {
        return JSON.parse(rawContent);
    } catch (e) {
        return { keywords: [] };
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Run multer middleware
        await runMiddleware(req, res, multerSingle);

        if (!req.file) {
            return res.status(400).json({ error: 'File is required' });
        }

        const { length = 'Medium', style = 'Paragraph', eli5 = 'false' } = req.body;
        const mimeType = req.file.mimetype;
        const fileBuffer = req.file.buffer;

        let extractedText = '';

        if (mimeType === 'application/pdf') {
            const parser = new PDFParse({ data: fileBuffer });
            try {
                const data = await parser.getText();
                extractedText = data.text;
            } finally {
                await parser.destroy();
            }
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            extractedText = result.value;
        } else if (mimeType === 'text/plain') {
            extractedText = fileBuffer.toString('utf8');
        } else {
            return res.status(400).json({ error: 'Unsupported file format' });
        }

        if (!extractedText.trim()) {
            return res.status(400).json({ error: 'The uploaded file contains no readable text.' });
        }

        let prompt = `Summarize the following text.\nLength: ${length}\nStyle: ${style}\n`;
        if (eli5 === 'true' || eli5 === true) {
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
        const keywordsData = await generateKeywords(extractedText);

        return res.status(200).json({
            originalLength: extractedText.split(' ').length,
            summary,
            keywords: keywordsData?.keywords || [],
            extractedText
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}
