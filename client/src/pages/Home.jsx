import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, FileText } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center text-center max-w-4xl mx-auto space-y-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-foreground">
          Summarize <span className="text-muted-foreground">Anything</span> in Seconds
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          The ultimate AI-powered content summarizer. Paste text, upload documents, or provide a URL to get concise, accurate summaries instantly.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link to="/dashboard" className="group inline-flex items-center justify-center px-8 py-3.5 font-medium text-primary-foreground bg-primary rounded-lg transition-all hover:bg-primary/90 shadow-sm">
            Start Summarizing <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </motion.div>

    </div>
  );
}
