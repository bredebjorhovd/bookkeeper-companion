import { useEffect, useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFPageProxy } from 'pdfjs-dist';
import { Annotation } from '@/types';
import { Spinner } from '@/components/Spinner';
import Connector from './Connector';
import { getMockAnnotations } from '@/utils/mockData';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  file: File | null;
  annotations: Annotation[];
  onAnnotationAdd: (annotation: Annotation) => void;
  activeField: string | null;
  activeColor?: string;
  externalFieldsMap?: Map<string, DOMRect>;
}

interface PdfDimensions {
  originalWidth: number;
  originalHeight: number;
  renderedWidth: number;
  renderedHeight: number;
  offsetX: number;
  offsetY: number;
}

const PdfViewer = ({
  file,
  annotations,
  onAnnotationAdd,
  activeField,
  activeColor = '#3b82f6',
  externalFieldsMap,
}: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [highlightPosition, setHighlightPosition] = useState<{ x: number; y: number } | null>(null);
  const [pdfDimensions, setPdfDimensions] = useState<PdfDimensions | null>(null);
  const [fieldsMap, setFieldsMap] = useState<Map<string, DOMRect>>(externalFieldsMap || new Map());
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [loadMockData, setLoadMockData] = useState<boolean>(true);

  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  useEffect(() => {
    if (externalFieldsMap && externalFieldsMap.size > 0) {
      setFieldsMap(externalFieldsMap);
    }
  }, [externalFieldsMap]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const handleRenderSuccess = (page: { getViewport: (options: { scale: number }) => { width: number; height: number } }) => {
    if (!pageRef.current) return;

    const viewport = page.getViewport({ scale: 1.0 });
    const scaledViewport = page.getViewport({ scale });
    const containerRect = pageRef.current.getBoundingClientRect();

    const offsetX = Math.max(0, (containerRect.width - scaledViewport.width) / 2);
    const offsetY = Math.max(0, (containerRect.height - scaledViewport.height) / 2);

    const initialDimensions = {
      originalWidth: viewport.width,
      originalHeight: viewport.height,
      renderedWidth: scaledViewport.width,
      renderedHeight: scaledViewport.height,
      offsetX,
      offsetY
    };

    requestAnimationFrame(() => {
      const canvas = pageRef.current?.querySelector("canvas");
      if (canvas) {
        const canvasRect = canvas.getBoundingClientRect();

        const updatedDimensions = {
          originalWidth: viewport.width,
          originalHeight: viewport.height,
          renderedWidth: canvasRect.width,
          renderedHeight: canvasRect.height,
          offsetX: canvasRect.left - containerRect.left,
          offsetY: canvasRect.top - containerRect.top
        };

        setPdfDimensions(updatedDimensions);

        const newFieldsMap = new Map<string, DOMRect>();
        const formFields = document.querySelectorAll('.form-field');
        formFields.forEach((field) => {
          const type = field.getAttribute('data-field-type');
          if (type) {
            newFieldsMap.set(type, field.getBoundingClientRect());
          }
        });
        setFieldsMap(newFieldsMap);

        if (loadMockData && annotations.length === 0) {
          const mockAnnotations = getMockAnnotations();
          mockAnnotations.forEach(annotation => {
            onAnnotationAdd(annotation);
          });
          setLoadMockData(false);
        }
      } else {
        setPdfDimensions(initialDimensions);

        if (loadMockData && annotations.length === 0) {
          const mockAnnotations = getMockAnnotations();
          mockAnnotations.forEach(annotation => {
            onAnnotationAdd(annotation);
          });
          setLoadMockData(false);
        }
      }
    });
  };

  const normalizedToPixels = (x: number, y: number, width: number, height: number) => {
    if (!pdfDimensions) return null;

    const pixelX = (x * pdfDimensions.renderedWidth) + pdfDimensions.offsetX;
    const pixelY = (y * pdfDimensions.renderedHeight) + pdfDimensions.offsetY;
    const pixelWidth = width * pdfDimensions.renderedWidth;
    const pixelHeight = height * pdfDimensions.renderedHeight;

    return {
      left: pixelX,
      top: pixelY,
      width: Math.max(1, pixelWidth),
      height: Math.max(1, pixelHeight)
    };
  };

  const pixelsToNormalized = (clientX: number, clientY: number) => {
    if (!pdfDimensions || !pageRef.current) return null;

    const rect = pageRef.current.getBoundingClientRect();

    const containerX = clientX - rect.left;
    const containerY = clientY - rect.top;

    const renderedX = containerX - pdfDimensions.offsetX;
    const renderedY = containerY - pdfDimensions.offsetY;

    return {
      x: Math.max(0, Math.min(1, renderedX / pdfDimensions.renderedWidth)),
      y: Math.max(0, Math.min(1, renderedY / pdfDimensions.renderedHeight))
    };
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeField || !pdfDimensions) return;

    const normalized = pixelsToNormalized(e.clientX, e.clientY);
    if (!normalized) return;

    const newAnnotation: Annotation = {
      id: `${activeField}-${Date.now()}`,
      x: normalized.x,
      y: normalized.y,
      type: activeField as any,
      value: '',
      color: activeColor,
      boundingBox: {
        x: normalized.x - 0.03,
        y: normalized.y - 0.01,
        width: 0.06,
        height: 0.02
      }
    };

    onAnnotationAdd(newAnnotation);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeField || !pageRef.current) {
      setHighlightPosition(null);
      return;
    }
    const rect = pageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setHighlightPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setHighlightPosition(null);
  };

  const zoomIn = () => setScale(prev => prev + 0.2);
  const zoomOut = () => setScale(prev => Math.max(0.6, prev - 0.2));
  const toggleBoxes = () => setShowBoxes(prev => !prev);

  const reloadMockData = () => {
    annotations.forEach(annotation => {
      onAnnotationAdd({
        ...annotation,
        id: `clear-${Date.now()}`
      });
    });

    setLoadMockData(true);

    if (pdfDimensions) {
      const mockAnnotations = getMockAnnotations();
      mockAnnotations.forEach(annotation => {
        onAnnotationAdd(annotation);
      });
    }
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
          <button onClick={zoomIn} className="p-2 rounded-md hover:bg-gray-100">
            +
          </button>
          <button
            onClick={toggleBoxes}
            className="p-2 rounded-md bg-gray-200 hover:bg-gray-300"
          >
            {showBoxes ? "Hide Boxes" : "Show Boxes"}
          </button>
          <button
            onClick={reloadMockData}
            className="p-2 rounded-md bg-green-200 hover:bg-green-300"
          >
            Reload
          </button>
        </div>
        {numPages && (
          <div className="text-sm text-gray-500">
            Page {pageNumber} of {numPages}
          </div>
        )}
      </div>

      <div className="pdf-container flex-1 overflow-auto border rounded-md relative">
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
            <div
              ref={pageRef}
              onClick={handleClick}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ position: 'relative', display: 'inline-block' }}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                className="pdf-page"
                onRenderSuccess={handleRenderSuccess}
              />

              {pdfDimensions && showBoxes &&
                pageRef.current && (
                  <Connector
                    annotations={annotations}
                    fieldsMap={fieldsMap}
                    containerRect={pageRef.current.getBoundingClientRect()}
                    pdfViewport={{
                      width: pdfDimensions.renderedWidth,
                      height: pdfDimensions.renderedHeight,
                      offsetX: pdfDimensions.offsetX,
                      offsetY: pdfDimensions.offsetY
                    }}
                  />
                )}

              {highlightPosition && (
                <div
                  className="annotation-highlight absolute pointer-events-none"
                  style={{
                    left: highlightPosition.x,
                    top: highlightPosition.y,
                    borderColor: activeColor,
                  }}
                />
              )}
            </div>
          </Document>
        )}
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
