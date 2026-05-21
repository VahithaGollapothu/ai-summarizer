import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, HelpCircle, Layers } from 'lucide-react';

export default function NotesGenerator({ notesData }) {
  const [activeTab, setActiveTab] = useState('notes');
  const [flippedCards, setFlippedCards] = useState({});

  if (!notesData) return null;

  const toggleFlip = (index) => {
    setFlippedCards(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="w-full flex flex-col h-full space-y-6">
      {/* Tabs */}
      <div className="flex bg-secondary/50 p-1 rounded-xl w-fit">
        {[
          { id: 'notes', icon: BookOpen, label: 'Revision Notes' },
          { id: 'flashcards', icon: Layers, label: 'Flashcards' },
          { id: 'faqs', icon: HelpCircle, label: 'FAQs' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'hover:bg-white/10 text-muted-foreground'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <AnimatePresence mode="wait">
          {activeTab === 'notes' && (
            <motion.div 
              key="notes"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="prose prose-invert max-w-none whitespace-pre-wrap text-lg leading-relaxed glass p-6 rounded-2xl"
            >
              {notesData.notes || "No notes available."}
            </motion.div>
          )}

          {activeTab === 'flashcards' && (
            <motion.div 
              key="flashcards"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {notesData.flashcards?.map((card, i) => (
                <div 
                  key={i} 
                  className="h-64 relative perspective-1000 cursor-pointer"
                  onClick={() => toggleFlip(i)}
                >
                  <motion.div
                    className="w-full h-full relative preserve-3d transition-all duration-500"
                    initial={false}
                    animate={{ rotateY: flippedCards[i] ? 180 : 0 }}
                  >
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden glass rounded-2xl p-6 flex flex-col items-center justify-center text-center border-t-4 border-t-primary shadow-lg">
                      <div className="text-primary font-bold mb-4 uppercase tracking-widest text-xs">Flashcard {i+1}</div>
                      <h3 className="text-2xl font-bold">{card.q}</h3>
                      <p className="text-muted-foreground text-sm mt-auto">Click to flip</p>
                    </div>
                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden glass rounded-2xl p-6 flex flex-col items-center justify-center text-center border-t-4 border-t-secondary rotate-y-180 shadow-lg">
                      <div className="text-secondary font-bold mb-4 uppercase tracking-widest text-xs">Answer</div>
                      <p className="text-lg font-medium text-foreground">{card.a}</p>
                    </div>
                  </motion.div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'faqs' && (
            <motion.div 
              key="faqs"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {notesData.faqs?.map((faq, i) => (
                <div key={i} className="glass p-6 rounded-2xl space-y-3 border border-border/50">
                  <h3 className="text-xl font-bold flex gap-3"><HelpCircle className="text-primary flex-shrink-0 mt-1" size={20}/> {faq.q}</h3>
                  <p className="text-muted-foreground pl-8">{faq.a}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
