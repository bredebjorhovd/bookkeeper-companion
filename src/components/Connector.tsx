
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
      color: string;
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
          y2,
          color: annotation.color
        };
      }
      return null;
    }).filter(Boolean) as Array<{
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
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
        
        // Calculate the control points for the curve (for Sankey-like effect)
        const midX = (line.x1 + line.x2) / 2;
        
        return (
          <div
            key={line.id}
            className="connecting-line-container"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 20
            }}
          >
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
              <path
                d={`M ${line.x1} ${line.y1} 
                    C ${midX} ${line.y1}, 
                      ${midX} ${line.y2}, 
                      ${line.x2} ${line.y2}`}
                stroke={line.color}
                strokeWidth="3"
                fill="none"
                strokeDasharray="5,5"
                strokeLinecap="round"
              />
              <circle
                cx={line.x1}
                cy={line.y1}
                r="5"
                fill={line.color}
              />
            </svg>
          </div>
        );
      })}
    </>
  );
};

export default Connector;
