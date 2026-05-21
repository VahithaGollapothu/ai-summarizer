import { useState } from 'react';
import { Settings2, Moon, Sun, Globe, Key } from 'lucide-react';

export default function Settings() {
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('english');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col gap-8">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">
        <Settings2 size={28} className="text-primary" /> Settings
      </h2>

      <div className="space-y-6">
        {/* Theme Setting */}
        <div className="glass p-6 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
            </div>
            <div>
              <h3 className="font-bold text-lg">Appearance</h3>
              <p className="text-muted-foreground text-sm">Toggle between Light and Dark mode.</p>
            </div>
          </div>
          <button 
            onClick={toggleTheme}
            className="w-14 h-8 bg-background border border-border rounded-full relative transition-colors focus:outline-none"
          >
            <div className={`w-6 h-6 bg-primary rounded-full absolute top-1 transition-all ${theme === 'dark' ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {/* Language Setting */}
        <div className="glass p-6 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
              <Globe size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Language</h3>
              <p className="text-muted-foreground text-sm">Select your preferred summarization language.</p>
            </div>
          </div>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="english">English</option>
            <option value="spanish">Spanish</option>
            <option value="french">French</option>
            <option value="german">German</option>
          </select>
        </div>

        {/* API Key Setting */}
        <div className="glass p-6 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-500">
              <Key size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Custom API Key</h3>
              <p className="text-muted-foreground text-sm">Use your own Groq API key instead of the server's.</p>
            </div>
          </div>
          <button className="px-6 py-2 rounded-lg bg-white/5 border border-border hover:bg-white/10 transition-colors">
            Configure
          </button>
        </div>
      </div>
    </div>
  );
}
