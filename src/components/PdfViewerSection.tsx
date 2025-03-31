import { Card, CardContent } from "@/components/ui/card";
import PdfViewer from "@/components/PdfViewer";
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
    <div className="relative md:col-span-8">
      <Card className="h-full">
        <CardContent className="p-6">
          <div ref={pdfContainerRef} className="relative" style={{ position: 'relative' }}>
            <PdfViewer
              file={file}
              annotations={annotations}
              onAnnotationAdd={onAnnotationAdd}
              activeField={activeField}
              activeColor={activeColor}
              externalFieldsMap={fieldsMap}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PdfViewerSection;
