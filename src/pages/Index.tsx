
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import InvoiceQueue from "@/components/InvoiceQueue";
import WelcomeScreen from "@/components/WelcomeScreen";
import PdfViewerSection from "@/components/PdfViewerSection";
import FormSection from "@/components/FormSection";
import { useInvoiceForm } from "@/hooks/useInvoiceForm";
import { getFieldColor } from "@/utils/fieldColors";

// Sample initial invoices
const initialInvoices = [
  {
    id: "inv-001",
    vendor: "Acme Corp",
    date: "2023-05-15",
    dueDate: "2023-06-15",
    amount: 1250.00,
    tax: 250.00,
    total: 1500.00,
    currency: "USD",
    status: "processed",
    fileName: "invoice-acme-may.pdf",
    uploadedAt: "2023-05-16T10:30:00Z"
  },
  {
    id: "inv-002",
    vendor: "Tech Solutions",
    date: "2023-06-01",
    dueDate: "2023-07-01",
    amount: 2000.00,
    tax: 400.00,
    total: 2400.00,
    currency: "USD",
    status: "pending",
    fileName: "invoice-tech-june.pdf",
    uploadedAt: "2023-06-02T14:15:00Z"
  }
];

const Index = () => {
  const { toast } = useToast();
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [fieldsMap, setFieldsMap] = useState<Map<string, DOMRect>>(new Map());
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  
  const {
    file,
    pdfLoaded,
    annotations,
    activeField,
    invoices,
    invoiceData,
    handleFileSelect,
    handleAnnotationAdd,
    updateInvoiceField,
    handleFieldSelect,
    handleSaveInvoice,
    isFieldConnected
  } = useInvoiceForm(initialInvoices);

  // Update field rectangles for drawing connections
  useEffect(() => {
    const fieldElements = document.querySelectorAll('[id^="field-"]');
    const newFieldsMap = new Map<string, DOMRect>();
    
    fieldElements.forEach(el => {
      const field = el as HTMLElement;
      const fieldType = field.id.replace('field-', '');
      newFieldsMap.set(fieldType, field.getBoundingClientRect());
    });
    
    setFieldsMap(newFieldsMap);
    
    if (pdfContainerRef.current) {
      setContainerRect(pdfContainerRef.current.getBoundingClientRect());
    }
  }, [pdfLoaded, annotations, invoiceData]);

  // Get active color for highlighting
  const activeColor = activeField ? getFieldColor(activeField) : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        {!pdfLoaded ? (
          <WelcomeScreen onFileSelect={handleFileSelect} />
        ) : (
          <>
            <div className="flex flex-col space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* PDF Viewer Section */}
                <PdfViewerSection 
                  file={file}
                  annotations={annotations}
                  activeField={activeField}
                  activeColor={activeColor}
                  pdfContainerRef={pdfContainerRef}
                  containerRect={containerRect}
                  fieldsMap={fieldsMap}
                  onAnnotationAdd={handleAnnotationAdd}
                />
                
                {/* Form Section */}
                <FormSection 
                  invoiceData={invoiceData}
                  updateInvoiceField={updateInvoiceField}
                  activeField={activeField}
                  handleFieldSelect={handleFieldSelect}
                  isFieldConnected={isFieldConnected}
                  getFieldColor={getFieldColor}
                  handleSaveInvoice={handleSaveInvoice}
                />
              </div>
              
              <div className="mt-8">
                <InvoiceQueue 
                  invoices={invoices} 
                  onSelectInvoice={(invoice) => {
                    console.log("Selected invoice:", invoice);
                    toast({
                      title: "Invoice selected",
                      description: `Opened ${invoice.fileName}`,
                    });
                  }} 
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
