import { useState } from "react";
import { InvoiceData, Annotation } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { getFieldColor } from "@/utils/fieldColors";
import { analyzeInvoiceWithOpenAI, renderPdfPageAsImage, getMockInvoiceAnalysis } from "@/services/openaiService";

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
    currency: "NOK",
    status: "pending",
    notes: ""
  });

  const handleFileSelect = async (newFile: File) => {
    try {
      console.log('File selected:', newFile.name);
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
        currency: "NOK",
        status: "pending",
        notes: "",
        fileName: newFile.name,
      };

      // Set initial invoice data
      setInvoiceData(newInvoice);

      // Create URL for the PDF
      const pdfUrl = URL.createObjectURL(newFile);
      console.log('Created PDF URL:', pdfUrl);

      // Convert PDF to image
      console.log('Converting PDF to image...');
      const imageUrl = await renderPdfPageAsImage(pdfUrl);
      console.log('PDF converted to image:', imageUrl ? 'success' : 'failed');

      if (imageUrl) {
        // Call OpenAI API for analysis
        console.log('Starting OpenAI analysis...');
        const aiAnnotations = await analyzeInvoiceWithOpenAI(
          null,
          imageUrl,
          import.meta.env.VITE_OPENAI_API_KEY || ''
        );
        console.log('OpenAI analysis results:', aiAnnotations);

        // Debug checking on annotation objects
        console.log('Checking AI Annotation objects:');
        aiAnnotations.forEach(annotation => {
          console.log(`${annotation.type}: Has boundingBox=${!!annotation.boundingBox}, x=${annotation.x}, y=${annotation.y}`);
        });

        // Make sure annotations have the necessary properties
        const validAnnotations = aiAnnotations.map(annotation => {
          // Ensure the boundingBox property is present
          if (!annotation.boundingBox) {
            // Create a default bounding box based on point coordinates
            annotation.boundingBox = {
              x: annotation.x - 0.03,
              y: annotation.y - 0.01,
              width: 0.06,
              height: 0.02
            };
          }
          return annotation;
        });

        // Update annotations with AI results
        setAnnotations(validAnnotations);
        console.log('Updated annotations state');

        // Update form fields with detected values
        validAnnotations.forEach(annotation => {
          if (annotation.value) {
            console.log(`Updating field ${annotation.type} with value:`, annotation.value);
            updateInvoiceField(annotation.type, annotation.value);
          }
        });

        toast({
          title: "Analysis complete",
          description: "Invoice has been processed with AI",
        });
      } else {
        console.error('Failed to convert PDF to image');
        toast({
          title: "Error",
          description: "Failed to convert PDF to image",
          variant: "destructive",
        });
        return;
      }

      console.log('Created new invoice draft:', newInvoice);

    } catch (error) {
      console.error('Error processing invoice:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process invoice with AI",
        variant: "destructive",
      });
    }
  };

  const handleAnnotationAdd = (annotation: Annotation) => {
    // Skip any empty annotations from mock data resets
    if (annotation.id.startsWith('clear-')) {
      setAnnotations([]);
      console.log('Cleared all annotations');
      return;
    }

    // Make sure the annotation has a boundingBox
    if (!annotation.boundingBox) {
      annotation.boundingBox = {
        x: annotation.x - 0.03,
        y: annotation.y - 0.01,
        width: 0.06,
        height: 0.02
      };
      console.log(`Added missing boundingBox to ${annotation.type} annotation`);
    }

    // Remove any existing annotation for this field type
    const filteredAnnotations = annotations.filter(ann => ann.type !== annotation.type);

    // Log what's happening
    console.log(`Adding annotation for ${annotation.type}:`, {
      id: annotation.id,
      position: `${annotation.x}, ${annotation.y}`,
      boundingBox: annotation.boundingBox ? `${annotation.boundingBox.x}, ${annotation.boundingBox.y}, ${annotation.boundingBox.width}, ${annotation.boundingBox.height}` : 'none'
    });
    console.log(`Previous annotations: ${annotations.length}, after filtering: ${filteredAnnotations.length}, new total: ${filteredAnnotations.length + 1}`);

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
      currency: invoiceData.currency || "NOK",
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
