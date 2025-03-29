
export interface InvoiceData {
  id: string;
  vendor: string;
  date: string;
  dueDate: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  status: 'pending' | 'processed' | 'error';
  notes?: string;
  fileName: string;
  uploadedAt: string;
  pdfUrl?: string;
}

export interface Annotation {
  id: string;
  x: number;
  y: number;
  type: 'vendor' | 'date' | 'dueDate' | 'amount' | 'tax' | 'total' | 'currency' | 'notes';
  value: string;
}

export interface PdfViewerProps {
  file: File | null;
  annotations: Annotation[];
  onAnnotationAdd: (annotation: Annotation) => void;
  onAnnotationUpdate: (id: string, value: string) => void;
}

export interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  connected: boolean;
}
