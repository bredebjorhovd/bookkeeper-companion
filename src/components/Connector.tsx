import { useEffect, useState } from 'react';
import { Annotation } from '@/types';

interface ConnectorProps {
  annotations: Annotation[];
  fieldsMap: Map<string, DOMRect>;
  containerRect: DOMRect | null;
  pdfViewport: {
    width: number;
    height: number;
    offsetX?: number;
    offsetY?: number;
  };
}

const Connector = ({ annotations, fieldsMap, containerRect, pdfViewport }: ConnectorProps) => {
  // Return just the colored boxes for annotations, no connectors
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'visible',
      pointerEvents: 'none'
    }}>
      {containerRect && pdfViewport && annotations.map(annotation => {
        if (!annotation.boundingBox || !pdfViewport.width || !pdfViewport.height) {
          return null;
        }

        // Get dimensions
        const { x, y, width, height } = annotation.boundingBox;
        const offsetX = pdfViewport.offsetX || 0;
        const offsetY = pdfViewport.offsetY || 0;

        // Convert normalized coordinates to pixels directly
        const left = (x * pdfViewport.width) + offsetX;
        const top = (y * pdfViewport.height) + offsetY;
        const boxWidth = width * pdfViewport.width;
        const boxHeight = height * pdfViewport.height;

        return (
          <div
            key={`box-${annotation.id}`}
            style={{
              position: 'absolute',
              top: `${top}px`,
              left: `${left}px`,
              width: `${boxWidth}px`,
              height: `${boxHeight}px`,
              backgroundColor: `${annotation.color}50`,
              border: `2px solid ${annotation.color}`,
              zIndex: 100,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-18px',
                left: '0',
                backgroundColor: annotation.color,
                color: 'white',
                fontSize: '10px',
                padding: '2px 4px',
                borderRadius: '2px',
                whiteSpace: 'nowrap'
              }}
            >
              {annotation.type}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Connector;
