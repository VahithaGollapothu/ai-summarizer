import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Link as LinkIcon, Type, Settings2, Download, Copy, Play, Loader2, Zap, PlayCircle, BookOpen } from 'lucide-react';
import axios from 'axios';
import YouTubePlayer from '../components/YouTubePlayer';
import NotesGenerator from '../components/NotesGenerator';
import PdfHighlighter from '../components/PdfHighlighter';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('text');
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [file, setFile] = useState(null);
  
  const [length, setLength] = useState('Medium');
  const [style, setStyle] = useState('Paragraph');
  const [eli5, setEli5] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const [notesData, setNotesData] = useState(null);
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'notes'

  const handleSummarize = async () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setLoading(true);
    setResult(null);
    setNotesData(null);
    setViewMode('summary');
    
    const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5000';
    
    try {
      let res;
      if (activeTab === 'text') {
        res = await axios.post(`${API_BASE}/api/summarize/text`, { text: inputText, length, style, eli5 });
      } else if (activeTab === 'url') {
        res = await axios.post(`${API_BASE}/api/summarize/url`, { url: inputUrl, length, style, eli5 });
      } else if (activeTab === 'youtube') {
        res = await axios.post(`${API_BASE}/api/summarize/youtube`, { url: youtubeUrl });
      } else if (activeTab === 'file') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('length', length);
        formData.append('style', style);
        formData.append('eli5', eli5);
        res = await axios.post(`${API_BASE}/api/summarize/file`, formData);
      }
      setResult(res.data);
      
      // Save to local history
      if (res.data && !res.data.error) {
        const history = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
        history.unshift({
          id: Date.now(),
          date: new Date().toISOString(),
          type: activeTab,
          originalLength: res.data.originalLength,
          summary: res.data.summary || res.data.shortSummary,
          options: { length, style, eli5 }
        });
        localStorage.setItem('summaryHistory', JSON.stringify(history.slice(0, 50))); // Keep last 50
      }
    } catch (error) {
      console.error(error);
      let errorMessage = "Failed to generate summary. Make sure the backend is running and the API key is set.";
      
      if (error.response?.data?.error) {
        if (typeof error.response.data.error === 'string') {
          errorMessage = error.response.data.error;
        } else if (error.response.data.error.message) {
          errorMessage = error.response.data.error.message;
        } else {
          errorMessage = JSON.stringify(error.response.data.error);
        }
      }
      
      setResult({ error: errorMessage });
    }
    setLoading(false);
  };

  const handleGenerateNotes = async () => {
    if (!result?.extractedText && !inputText) return alert("No text available to generate notes from.");
    const textToUse = result.extractedText || inputText;
    
    setGeneratingNotes(true);
    
    const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5000';
    
    try {
      const res = await axios.post(`${API_BASE}/api/notes/generate`, { text: textToUse });
      setNotesData(res.data);
      setViewMode('notes');
    } catch (error) {
      console.error(error);
      alert("Failed to generate notes.");
    }
    setGeneratingNotes(false);
  };

  const handleCopy = () => {
    if (result?.summary) {
      navigator.clipboard.writeText(result.summary);
      alert('Copied to clipboard!');
    }
  };

  const handleDownload = () => {
    if (result?.summary) {
      const element = document.createElement('a');
      const fileBlob = new Blob([result.summary], {type: 'text/plain'});
      element.href = URL.createObjectURL(fileBlob);
      element.download = 'summary.txt';
      document.body.appendChild(element);
      element.click();
    }
  };

  const handlePlay = () => {
    if (result?.summary && 'speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      } else {
        const msg = new SpeechSynthesisUtterance(result.summary);
        window.speechSynthesis.speak(msg);
      }
    } else {
      alert("Text-to-speech is not supported in your browser.");
    }
  };

  const isPDF = file && file.type === 'application/pdf' && activeTab === 'file';

  return (
    <div className={`h-full flex flex-col ${isPDF && result && !result.error ? 'lg:flex-row' : 'lg:flex-row'} gap-6`}>
      {/* Input Section (Becomes PDF Viewer if PDF is loaded) */}
      <div className={`flex-1 flex flex-col gap-6 ${isPDF && result && !result.error ? 'lg:w-1/2' : ''}`}>
        
        {isPDF && result && !result.error ? (
          <div className="flex-1 h-[70vh]">
             <PdfHighlighter file={file} keywords={result.keywords} />
          </div>
        ) : (
          <div className="glass rounded-2xl p-6 flex-1 flex flex-col">
            <div className="flex flex-wrap bg-secondary/50 p-1 rounded-xl w-fit mb-6 gap-1">
              {[
                { id: 'text', icon: Type, label: 'Text' },
                { id: 'file', icon: FileText, label: 'Document' },
                { id: 'url', icon: LinkIcon, label: 'URL' },
                { id: 'youtube', icon: PlayCircle, label: 'YouTube' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setResult(null);
                    setNotesData(null);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === tab.id ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/10 text-muted-foreground'
                  }`}
                >
                  <tab.icon size={16} /> {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 flex flex-col min-h-[300px]">
              {activeTab === 'text' && (
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your long text here..."
                  className="flex-1 w-full bg-background/50 border border-border rounded-xl p-4 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                />
              )}
              {activeTab === 'url' && (
                <div className="flex-1 flex items-center justify-center">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://example.com/article"
                    className="w-full max-w-md bg-background/50 border border-border rounded-xl p-4 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              )}
              {activeTab === 'youtube' && (
                <div className="flex-1 flex items-center justify-center">
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full max-w-md bg-background/50 border border-border rounded-xl p-4 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              )}
              {activeTab === 'file' && (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border rounded-xl bg-background/20 hover:bg-background/40 transition-colors relative">
                  <input 
                    type="file" 
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center">
                    <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="font-medium text-lg">Click or drag file to upload</p>
                    <p className="text-muted-foreground text-sm mt-1">{file ? file.name : "Supports PDF, DOCX, TXT"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Options Panel */}
        {activeTab !== 'youtube' && (
          <div className="glass rounded-2xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Settings2 size={18}/> Summary Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Length</label>
                <select value={length} onChange={(e) => setLength(e.target.value)} className="w-full bg-background border border-border rounded-lg p-2.5">
                  <option>Short</option>
                  <option>Medium</option>
                  <option>Detailed</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Style</label>
                <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-background border border-border rounded-lg p-2.5">
                  <option>Paragraph</option>
                  <option>Bullet Points</option>
                  <option>Key Insights</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={eli5} onChange={(e) => setEli5(e.target.checked)} className="w-5 h-5 rounded border-border text-primary focus:ring-primary" />
                  <span className="font-medium">Explain Like I'm 5</span>
                </label>
              </div>
            </div>
          </div>
        )}
        
        <button 
          onClick={handleSummarize}
          disabled={loading || (activeTab === 'text' && !inputText) || (activeTab === 'url' && !inputUrl) || (activeTab === 'youtube' && !youtubeUrl) || (activeTab === 'file' && !file)}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-lg shadow-lg"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
          {loading ? 'Analyzing Content...' : 'Generate Summary'}
        </button>
      </div>

      {/* Output Section */}
      <div className={`flex-1 glass rounded-2xl p-6 flex flex-col bg-gradient-to-b from-background/40 to-background/10 border-t-4 border-t-primary ${isPDF && result && !result.error ? 'lg:w-1/2' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-foreground">
            {activeTab === 'youtube' ? 'Video Insights' : 'AI Summary'}
          </h2>
          {result && !result.error && activeTab !== 'youtube' && (
            <div className="flex gap-2">
              <button 
                onClick={() => setViewMode('summary')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'summary' ? 'bg-primary text-white' : 'bg-secondary text-foreground hover:bg-secondary/70'}`}
              >
                Summary
              </button>
              <button 
                onClick={notesData ? () => setViewMode('notes') : handleGenerateNotes}
                disabled={generatingNotes}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'notes' ? 'bg-primary text-white' : 'bg-secondary text-foreground hover:bg-secondary/70'}`}
              >
                {generatingNotes ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />}
                Study Notes
              </button>
              <div className="w-px bg-border mx-1"></div>
              <button onClick={handleCopy} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-primary" title="Copy to clipboard"><Copy size={18}/></button>
              <button onClick={handleDownload} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-primary" title="Download as .txt"><Download size={18}/></button>
              <button onClick={handlePlay} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-primary" title="Play Text-to-Speech"><Play size={18}/></button>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {!result && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                <Zap size={32} className="opacity-50" />
              </div>
              <p>Your AI-generated summary will appear here.</p>
            </div>
          )}
          
          {loading && (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <Loader2 size={40} className="animate-spin text-primary" />
              <p className="text-primary font-medium animate-pulse">Extracting key insights...</p>
            </div>
          )}

          {result && result.error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
              {result.error}
            </div>
          )}

          {result && !result.error && activeTab === 'youtube' && (
            <YouTubePlayer result={result} youtubeUrl={youtubeUrl} />
          )}

          {result && !result.error && activeTab !== 'youtube' && viewMode === 'summary' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex gap-4 p-4 rounded-xl bg-background/50 border border-border">
                <div className="flex-1 text-center">
                  <div className="text-sm text-muted-foreground">Original Words</div>
                  <div className="text-2xl font-bold text-foreground">{result.originalLength}</div>
                </div>
                <div className="w-px bg-border"></div>
                <div className="flex-1 text-center">
                  <div className="text-sm text-muted-foreground">Summary Words</div>
                  <div className="text-2xl font-bold text-primary">{result.summary.split(' ').length}</div>
                </div>
              </div>
              
              {result.keywords && result.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {result.keywords.map((kw, i) => (
                    <span key={i} className="px-3 py-1 bg-primary/10 text-primary font-medium text-sm rounded-full border border-primary/20">
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              <div className="prose prose-invert max-w-none text-lg leading-relaxed text-foreground whitespace-pre-wrap">
                {result.summary}
              </div>
            </motion.div>
          )}

          {result && !result.error && activeTab !== 'youtube' && viewMode === 'notes' && notesData && (
            <NotesGenerator notesData={notesData} />
          )}
        </div>
      </div>
    </div>
  );
}
