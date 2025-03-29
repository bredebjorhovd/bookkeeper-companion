
import { Card, CardContent } from "@/components/ui/card";
import PdfViewer from "@/components/PdfViewer";
import Connector from "@/components/Connector";
import { Annotation } from "@/types";
import { RefObject } from "react";

interface PdfViewerSectionProps {
  file: File | null;
  annotations: Annotation[];
  activeField: string | null;
  activeColor?: string;
  pdfContainerRef: RefObject<HTMLDivElement>;
  containerRect: DOMRect | null;
  fieldsMap: Map<string, DOMRect>;
  onAnnotationAdd: (annotation: Annotation) => void;
}

const PdfViewerSection = ({
  file,
  annotations,
  activeField,
  activeColor,
  pdfContainerRef,
  containerRect,
  fieldsMap,
  onAnnotationAdd
}: PdfViewerSectionProps) => {
  return (
    <div ref={pdfContainerRef} className="relative md:col-span-8">
      <Card className="h-full">
        <CardContent className="p-6">
          <PdfViewer 
            file={file} 
            annotations={annotations} 
            onAnnotationAdd={onAnnotationAdd}
            activeField={activeField}
            activeColor={activeColor}
          />
        </CardContent>
      </Card>
      
      {/* This is where the connector lines will be rendered */}
      {containerRect && (
        <Connector 
          annotations={annotations} 
          fieldsMap={fieldsMap} 
          containerRect={containerRect} 
        />
      )}
    </div>
  );
};

export default PdfViewerSection;
