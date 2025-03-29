
import { useEffect, useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Annotation } from '@/types';
import { Spinner } from '@/components/Spinner';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  file: File | null;
  annotations: Annotation[];
  onAnnotationAdd: (annotation: Annotation) => void;
  activeField: string | null;
  activeColor?: string;
}

const PdfViewer = ({ file, annotations, onAnnotationAdd, activeField, activeColor = '#3b82f6' }: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (file) {
      // Create a URL for the file object
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      
      // Clean up the URL when the component unmounts
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeField || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newAnnotation: Annotation = {
      id: `${activeField}-${Date.now()}`,
      x,
      y,
      type: activeField as any,
      value: '',
      color: activeColor
    };
    
    onAnnotationAdd(newAnnotation);
  };

  const zoomIn = () => {
    setScale((prevScale) => prevScale + 0.2);
  };

  const zoomOut = () => {
    setScale((prevScale) => Math.max(0.6, prevScale - 0.2));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button 
            onClick={zoomOut}
            className="p-2 rounded-md hover:bg-gray-100"
            disabled={scale <= 0.6}
          >
            -
          </button>
          <span className="p-2">{Math.round(scale * 100)}%</span>
          <button 
            onClick={zoomIn}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            +
          </button>
        </div>
        {numPages && (
          <div className="text-sm text-gray-500">
            Page {pageNumber} of {numPages}
          </div>
        )}
      </div>
      
      <div 
        ref={containerRef}
        className="pdf-container flex-1 overflow-auto border rounded-md relative"
        onClick={handleClick}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50">
            <Spinner />
          </div>
        )}
        
        {pdfUrl && (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<Spinner />}
            error={<p className="text-center text-red-500 mt-4">Failed to load PDF</p>}
            className="pdf-canvas"
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              className="pdf-page"
            />
          </Document>
        )}
        
        {annotations.map((annotation) => (
          <div
            key={annotation.id}
            className="annotation-point"
            style={{
              left: `${annotation.x}%`,
              top: `${annotation.y}%`,
              backgroundColor: annotation.color,
            }}
          />
        ))}
      </div>
      
      {numPages && numPages > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          <button
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1}
            className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
            disabled={pageNumber >= numPages}
            className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfViewer;
