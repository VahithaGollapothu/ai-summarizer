import { Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col gap-8 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-3xl text-center space-y-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="w-20 h-20 mx-auto bg-gradient-futuristic rounded-2xl flex items-center justify-center text-white shadow-xl">
          <Info size={40} />
        </div>
        
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
          About AI Summarizer
        </h1>
        
        <p className="text-lg text-muted-foreground leading-relaxed">
          AI Summarizer is a modern web application built to help you digest long-form content quickly. 
          By leveraging cutting-edge NLP and the blazing fast inference speeds of Groq, we extract the core insights from articles, documents, and plain text in seconds.
        </p>

        <div className="grid grid-cols-2 gap-4 text-left pt-6">
          <div className="bg-background/50 border border-border p-4 rounded-xl">
            <div className="font-bold text-foreground">Version</div>
            <div className="text-muted-foreground">1.0.0-beta</div>
          </div>
          <div className="bg-background/50 border border-border p-4 rounded-xl">
            <div className="font-bold text-foreground">Tech Stack</div>
            <div className="text-muted-foreground">React, Tailwind, Node.js, Groq</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
