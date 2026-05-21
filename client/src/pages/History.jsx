import { useState, useEffect } from 'react';
import { Clock, Search, Trash2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function History() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('summaryHistory') || '[]');
    setHistory(savedHistory);
  }, []);

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear your entire history?')) {
      localStorage.removeItem('summaryHistory');
      setHistory([]);
    }
  };

  const filteredHistory = history.filter(item => 
    item.summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">
          <Clock size={28} className="text-primary" /> Summary History
        </h2>
        <button 
          onClick={clearHistory}
          disabled={history.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          <Trash2 size={18} /> Clear All
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input 
          type="text" 
          placeholder="Search your summaries..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-background/50 border border-border rounded-xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {filteredHistory.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground">
            No history found. Try summarizing something new!
          </div>
        ) : (
          filteredHistory.map((item, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={item.id} 
              className="glass p-6 rounded-2xl flex flex-col gap-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span className="capitalize px-3 py-1 bg-white/5 rounded-full">{item.type}</span>
                <span>{new Date(item.date).toLocaleString()}</span>
              </div>
              <p className="text-foreground line-clamp-3 leading-relaxed">
                {item.summary}
              </p>
              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{item.originalLength} words original</span>
                  <span className="text-primary">•</span>
                  <span>{item.options.length}</span>
                  <span className="text-primary">•</span>
                  <span>{item.options.style}</span>
                </div>
                <button className="text-primary hover:text-primary/80 flex items-center gap-1 font-medium">
                  View Full <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
