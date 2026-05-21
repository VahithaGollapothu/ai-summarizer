import { useRef } from 'react';
import { Play } from 'lucide-react';

export default function YouTubePlayer({ result, youtubeUrl }) {
  const iframeRef = useRef(null);

  if (!result || !result.timestamps) return null;

  const extractVideoId = (url) => {
    if (!url) return "dQw4w9WgXcQ";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : "dQw4w9WgXcQ";
  };

  const handleTimestampClick = (timeStr) => {
    // Parse time string like "1:23" or "01:23:45" to seconds
    const parts = timeStr.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else {
      seconds = parts[0] || 0;
    }

    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'seekTo',
        args: [seconds, true]
      }), '*');
      iframeRef.current.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'playVideo',
        args: []
      }), '*');
    }
  };

  return (
    <div className="space-y-6">
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/50 border border-border flex items-center justify-center relative group">
        {/* Embedded YouTube Player */}
        <iframe
          ref={iframeRef}
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${extractVideoId(youtubeUrl)}?controls=1&enablejsapi=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0"
        ></iframe>
      </div>

      <div className="glass p-6 rounded-xl space-y-6">
        <div>
          <h3 className="text-xl font-bold mb-2">Short Summary</h3>
          <p className="text-muted-foreground">{result.shortSummary}</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-2">Detailed Analysis</h3>
          <p className="text-muted-foreground">{result.detailedSummary}</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Key Takeaways</h3>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            {result.keyTakeaways?.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-3">Important Moments</h3>
          <div className="space-y-3">
            {result.timestamps?.map((ts, i) => (
              <button
                key={i}
                onClick={() => handleTimestampClick(ts.time)}
                className="w-full flex items-center gap-4 p-3 rounded-lg bg-background/50 hover:bg-primary/20 transition-colors border border-border hover:border-primary/50 text-left"
              >
                <div className="px-3 py-1 bg-primary/20 text-primary font-mono font-medium rounded-md text-sm">
                  {ts.time}
                </div>
                <div className="flex-1 font-medium">{ts.description}</div>
                <Play size={16} className="text-primary opacity-50 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
