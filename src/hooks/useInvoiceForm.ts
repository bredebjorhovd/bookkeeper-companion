
import { useState } from "react";
import { InvoiceData, Annotation } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { getFieldColor } from "@/utils/fieldColors";

export const useInvoiceForm = (initialInvoices: InvoiceData[] = []) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceData[]>(initialInvoices);
  
  const [invoiceData, setInvoiceData] = useState<Partial<InvoiceData>>({
    vendor: "",
    date: "",
    dueDate: "",
    amount: 0,
    tax: 0,
    total: 0,
    currency: "USD",
    status: "pending",
    notes: ""
  });

  const handleFileSelect = (newFile: File) => {
    setFile(newFile);
    setPdfLoaded(true);
    setAnnotations([]);
    
    // Create a new draft invoice entry
    const newInvoice: Partial<InvoiceData> = {
      vendor: "",
      date: "",
      dueDate: "",
      amount: 0,
      tax: 0,
      total: 0,
      currency: "USD",
      status: "pending",
      notes: "",
      fileName: newFile.name,
    };
    
    setInvoiceData(newInvoice);
  };

  const handleAnnotationAdd = (annotation: Annotation) => {
    // Remove any existing annotation for this field type
    const filteredAnnotations = annotations.filter(ann => ann.type !== annotation.type);
    
    // Add the new annotation
    setAnnotations([...filteredAnnotations, annotation]);
    setActiveField(null);
    
    // If there's a value in the annotation (e.g., from OCR), update the form
    if (annotation.value) {
      updateInvoiceField(annotation.type, annotation.value);
    }
  };

  const handleAnnotationUpdate = (id: string, value: string) => {
    setAnnotations(prev => 
      prev.map(ann => ann.id === id ? { ...ann, value } : ann)
    );
  };

  const updateInvoiceField = (field: string, value: any) => {
    setInvoiceData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFieldSelect = (fieldName: string) => {
    setActiveField(activeField === fieldName ? null : fieldName);
  };

  const handleSaveInvoice = () => {
    if (!file) {
      toast({
        title: "Missing file",
        description: "Please upload an invoice first",
        variant: "destructive",
      });
      return;
    }

    // Create a new invoice with the current data
    const newInvoice: InvoiceData = {
      id: `inv-${Date.now()}`,
      vendor: invoiceData.vendor || "Unknown Vendor",
      date: invoiceData.date || new Date().toISOString().split('T')[0],
      dueDate: invoiceData.dueDate || "",
      amount: Number(invoiceData.amount) || 0,
      tax: Number(invoiceData.tax) || 0,
      total: Number(invoiceData.total) || 0,
      currency: invoiceData.currency || "USD",
      status: "processed",
      notes: invoiceData.notes || "",
      fileName: file.name,
      uploadedAt: new Date().toISOString()
    };
    
    // Add to invoices
    setInvoices(prev => [newInvoice, ...prev]);
    
    // Reset form
    setFile(null);
    setPdfLoaded(false);
    setAnnotations([]);
    setInvoiceData({
      vendor: "",
      date: "",
      dueDate: "",
      amount: 0,
      tax: 0,
      total: 0,
      currency: "USD",
      status: "pending",
      notes: ""
    });
    
    toast({
      title: "Invoice saved",
      description: "The invoice has been processed successfully",
    });
  };

  // Check if any annotation exists for a field
  const isFieldConnected = (fieldName: string) => {
    return annotations.some(ann => ann.type === fieldName);
  };

  return {
    file,
    pdfLoaded,
    annotations,
    activeField,
    invoices,
    invoiceData,
    handleFileSelect,
    handleAnnotationAdd,
    handleAnnotationUpdate,
    updateInvoiceField,
    handleFieldSelect,
    handleSaveInvoice,
    isFieldConnected,
    getFieldColor,
    setInvoices
  };
};
