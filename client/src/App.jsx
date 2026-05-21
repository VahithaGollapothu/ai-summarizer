import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import About from './pages/About';

function App() {
  return (
    <Router>
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="w-full h-full p-4 md:p-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<div className="flex h-full items-center justify-center text-xl text-muted-foreground">Page not found</div>} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
