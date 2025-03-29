
import { useEffect, useState } from 'react';
import { Annotation } from '@/types';

interface ConnectorProps {
  annotations: Annotation[];
  fieldsMap: Map<string, DOMRect>;
  containerRect: DOMRect | null;
}

const Connector = ({ annotations, fieldsMap, containerRect }: ConnectorProps) => {
  const [lines, setLines] = useState<
    Array<{
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }>
  >([]);

  useEffect(() => {
    if (!containerRect) return;
    
    const newLines = annotations.map(annotation => {
      const field = fieldsMap.get(annotation.type);
      
      if (field) {
        // Calculate positions
        const x1 = (annotation.x / 100) * containerRect.width;
        const y1 = (annotation.y / 100) * containerRect.height;
        
        const x2 = field.left - containerRect.left;
        const y2 = field.top - containerRect.top + field.height / 2;
        
        return {
          id: annotation.id,
          x1,
          y1,
          x2,
          y2
        };
      }
      return null;
    }).filter(Boolean) as Array<{
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }>;
    
    setLines(newLines);
  }, [annotations, fieldsMap, containerRect]);

  return (
    <>
      {lines.map(line => {
        // Angle calculation for the line
        const angle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1) * 180 / Math.PI;
        
        // Distance calculation for the line
        const length = Math.sqrt(Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2));
        
        return (
          <div
            key={line.id}
            className="connecting-line"
            style={{
              width: `${length}px`,
              left: `${line.x1}px`,
              top: `${line.y1}px`,
              transform: `rotate(${angle}deg)`,
              transformOrigin: '0 0',
            }}
          />
        );
      })}
    </>
  );
};

export default Connector;
