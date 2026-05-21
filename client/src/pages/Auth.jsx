import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="h-full flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md glass p-8 rounded-2xl relative overflow-hidden"
      >
        <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 text-foreground">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-muted-foreground">
              {isLogin ? 'Enter your details to access your summaries.' : 'Sign up to start saving your summaries.'}
            </p>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {!isLogin && (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Full Name</label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input type="text" placeholder="John Doe" className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none" />
                </div>
              </div>
            )}
            
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input type="email" placeholder="john@example.com" className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input type="password" placeholder="••••••••" className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
            </div>

            <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl transition-all mt-6 flex items-center justify-center gap-2">
              {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">
              {isLogin ? 'Sign up here' : 'Login here'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
