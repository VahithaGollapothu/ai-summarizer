import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download } from 'lucide-react';

// Setup PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfHighlighter({ file, keywords }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  // Highlight logic for the text layer
  const highlightTextLayer = () => {
    if (!keywords || keywords.length === 0) return;
    
    // Find the text layer elements
    const textLayers = document.querySelectorAll('.react-pdf__Page__textContent span');
    
    textLayers.forEach(span => {
      let html = span.innerHTML;
      let replaced = false;
      
      keywords.forEach(keyword => {
        const regex = new RegExp(`(${keyword})`, 'gi');
        if (regex.test(html)) {
          html = html.replace(regex, '<mark class="bg-primary/40 text-foreground px-0.5 rounded">$1</mark>');
          replaced = true;
        }
      });
      
      if (replaced) {
        span.innerHTML = html;
      }
    });
  };

  useEffect(() => {
    // Wait a brief moment for the text layer to render before highlighting
    const timer = setTimeout(highlightTextLayer, 500);
    return () => clearTimeout(timer);
  }, [pageNumber, scale, keywords]);

  return (
    <div className="flex flex-col h-full bg-background/50 rounded-xl overflow-hidden border border-border">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium">Page {pageNumber} of {numPages || '--'}</span>
          <button 
            onClick={() => setPageNumber(Math.min(numPages || 1, pageNumber + 1))}
            disabled={pageNumber >= numPages}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-sm font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
          <button 
            onClick={() => setScale(s => Math.min(3, s + 0.2))}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
          >
            <ZoomIn size={20} />
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto custom-scrollbar flex justify-center bg-black/5 p-4">
        {file ? (
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            className="shadow-xl"
            loading={<div className="text-muted-foreground mt-10">Loading PDF...</div>}
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale} 
              onRenderTextLayerSuccess={highlightTextLayer}
            />
          </Document>
        ) : (
          <div className="mt-20 text-muted-foreground">No PDF selected</div>
        )}
      </div>
    </div>
  );
}
