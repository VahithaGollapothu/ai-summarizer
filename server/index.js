const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');
const cheerio = require('cheerio');
const Groq = require('groq-sdk');
const { YoutubeTranscript } = require('youtube-transcript');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Setup multer for memory storage (required for Vercel Serverless)
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Groq SDK (requires GROQ_API_KEY in .env)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy_key' });

async function callAI(messages) {
  const apiKey = process.env.GROQ_API_KEY;
  if (apiKey && apiKey.startsWith('xai-')) {
    const response = await axios.post('https://api.x.ai/v1/chat/completions', {
      messages,
      model: "grok-4.3",
      response_format: { type: "json_object" }
    }, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    });
    return response.data.choices[0]?.message?.content || "";
  } else if (apiKey && apiKey !== 'your_key_here') {
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });
    return chatCompletion.choices[0]?.message?.content || "";
  }
  return null;
}

async function summarizeText(text, length = 'Medium', style = 'Paragraph', eli5 = false) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    return `[Mock Summary] Received text of length ${text.length}. Requested: ${length}, ${style}. ELI5: ${eli5}. Please add a real API key to enable summarization.`;
  }

  let prompt = `Summarize the following text.\nLength: ${length}\nStyle: ${style}\n`;
  if (eli5) {
    prompt += "Explain it like I'm 5 years old (ELI5).\n";
  }
  prompt += `\nText:\n${text}`;

  const messages = [
    { role: "system", content: "You are a highly capable AI assistant that summarizes text accurately. IMPORTANT: Return the output as a plain string, NOT JSON." },
    { role: "user", content: prompt }
  ];

  try {
    if (apiKey.startsWith('xai-')) {
      const response = await axios.post('https://api.x.ai/v1/chat/completions', {
        messages,
        model: "grok-4.3",
      }, {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
      });
      return response.data.choices[0]?.message?.content || "Could not generate summary from xAI.";
    }
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
    });
    return chatCompletion.choices[0]?.message?.content || "Could not generate summary from Groq.";
  } catch (error) {
    console.error("API Error:", error?.response?.data || error);
    throw new Error("Failed to summarize text");
  }
}

async function generateStructuredData(text, type) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    // Return dummy data
    if (type === 'keywords') return { keywords: ['Dummy', 'Keyword', 'Extraction'] };
    if (type === 'notes') return { 
      flashcards: [{q: 'What is this?', a: 'A dummy flashcard.'}, {q: 'Is this working?', a: 'Yes, this is dummy data.'}], 
      faqs: [{q: 'How does it work?', a: 'Add an API key.'}],
      notes: "Dummy revision notes for exam preparation."
    };
    if (type === 'youtube') return {
      shortSummary: "Dummy short summary of the video.",
      detailedSummary: "Dummy detailed summary explaining everything.",
      keyTakeaways: ["Point 1 about video", "Point 2 about video"],
      timestamps: [{ time: "0:00", description: "Start of video" }, { time: "1:23", description: "Important topic" }]
    };
  }

  let prompt = '';
  if (type === 'keywords') {
    prompt = `Extract exactly 5 most important keywords or short key phrases from this text. Return JSON: {"keywords": ["word1", "word2"]}\n\nText: ${text.substring(0, 5000)}`;
  } else if (type === 'notes') {
    prompt = `Generate study notes from this text. Return JSON with 3 keys: "flashcards" (array of {q, a}), "faqs" (array of {q, a}), "notes" (string, revision notes).\n\nText: ${text.substring(0, 8000)}`;
  } else if (type === 'youtube') {
    prompt = `Summarize this YouTube transcript. Return JSON with 4 keys: "shortSummary", "detailedSummary", "keyTakeaways" (array of strings), "timestamps" (array of {time: "M:SS", description: "..."}).\n\nTranscript: ${text.substring(0, 10000)}`;
  }

  const messages = [
    { role: "system", content: "You are a helpful AI. You must respond ONLY with valid JSON matching the requested structure." },
    { role: "user", content: prompt }
  ];

  try {
    const rawContent = await callAI(messages);
    if (!rawContent) return null;
    return JSON.parse(rawContent);
  } catch (error) {
    console.error(`Error generating ${type}:`, error.message);
    return null;
  }
}

// 1. Endpoint: Summarize raw text
app.post('/api/summarize/text', async (req, res) => {
  const { text, length, style, eli5 } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  try {
    const summary = await summarizeText(text, length, style, eli5);
    res.json({ originalLength: text.split(' ').length, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Endpoint: Summarize file (PDF/DOCX/TXT)
app.post('/api/summarize/file', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "File is required" });
  
  const { length, style, eli5 } = req.body;
  const mimeType = req.file.mimetype;
  const fileBuffer = req.file.buffer;

  try {
    let extractedText = '';

    if (mimeType === 'application/pdf') {
      const data = await pdfParse(fileBuffer);
      extractedText = data.text;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      extractedText = result.value;
    } else if (mimeType === 'text/plain') {
      extractedText = fileBuffer.toString('utf8');
    } else {
      throw new Error("Unsupported file format");
    }

    const summary = await summarizeText(extractedText, length, style, eli5 === 'true');
    const keywordsData = await generateStructuredData(extractedText, 'keywords');
    
    res.json({ 
      originalLength: extractedText.split(' ').length, 
      summary, 
      keywords: keywordsData?.keywords || [],
      extractedText // Return extracted text so frontend can use it to generate notes if needed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Endpoint: Summarize URL
app.post('/api/summarize/url', async (req, res) => {
  let { url, length, style, eli5 } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

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

    const summary = await summarizeText(extractedText, length, style, eli5);
    res.json({ originalLength: extractedText.split(' ').length, summary, extractedText });
  } catch (err) {
    console.error("URL Fetch Error:", err.message);
    res.status(500).json({ error: "Failed to fetch URL. Ensure the URL is valid, or the website might be blocking automated requests." });
  }
});

// 4. Endpoint: Summarize YouTube
app.post('/api/summarize/youtube', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "YouTube URL is required" });

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(url);
    const text = transcript.map(t => t.text).join(' ');
    const data = await generateStructuredData(text, 'youtube');
    if (!data) throw new Error("Failed to generate YouTube summary data.");
    res.json({ ...data, originalLength: text.split(' ').length });
  } catch (err) {
    console.error("YouTube Error:", err.message);
    
    // If the URL is just completely invalid, return a standard error
    if (err.message.includes('Impossible to retrieve Youtube video ID')) {
      return res.status(400).json({ error: "Invalid YouTube URL. Please provide a valid link." });
    }

    // Fallback to dummy data if transcript fails for other reasons (e.g. disabled captions)
    const dummy = await generateStructuredData("dummy", "youtube");
    return res.json({ ...dummy, originalLength: 1000, warning: "Transcripts disabled. Showing dummy data." });
  }
});

// 5. Endpoint: Generate Notes
app.post('/api/notes/generate', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  try {
    const data = await generateStructuredData(text, 'notes');
    if (!data) throw new Error("Failed to generate notes.");
    res.json(data);
  } catch (err) {
    console.error("Notes Error:", err.message);
    res.status(500).json({ error: "Failed to generate notes." });
  }
});

// Export app for Vercel
module.exports = app;

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
