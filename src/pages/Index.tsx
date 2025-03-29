
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import FileUploader from "@/components/FileUploader";
import PdfViewer from "@/components/PdfViewer";
import FormField from "@/components/FormField";
import InvoiceQueue from "@/components/InvoiceQueue";
import Connector from "@/components/Connector";
import Navbar from "@/components/Navbar";
import { InvoiceData, Annotation } from "@/types";
import { Check } from "lucide-react";

const Index = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [fieldsMap, setFieldsMap] = useState<Map<string, DOMRect>>(new Map());
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  
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
  
  const [invoices, setInvoices] = useState<InvoiceData[]>([
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
  ]);

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
    setAnnotations(prev => [...prev, annotation]);
    setActiveField(null);
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

  // Check if any annotation exists for a field
  const isFieldConnected = (fieldName: string) => {
    return annotations.some(ann => ann.type === fieldName);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        {!pdfLoaded ? (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Upload an Invoice</h2>
            <FileUploader onFileSelect={handleFileSelect} />
          </div>
        ) : (
          <>
            <div className="flex flex-col space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div ref={pdfContainerRef} className="relative">
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <PdfViewer 
                        file={file} 
                        annotations={annotations} 
                        onAnnotationAdd={handleAnnotationAdd}
                        activeField={activeField}
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
                
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Invoice Details</h2>
                    
                    <div className="space-y-1 mb-6">
                      <p className="text-sm text-gray-500">Click a field below, then click on the PDF to connect data points</p>
                    </div>
                    
                    <div id="field-vendor">
                      <FormField 
                        id="vendor"
                        label="Vendor"
                        value={invoiceData.vendor?.toString() || ""}
                        onChange={(value) => updateInvoiceField("vendor", value)}
                        connected={isFieldConnected("vendor")}
                      />
                      <Button
                        type="button"
                        variant={activeField === "vendor" ? "default" : "outline"}
                        size="sm"
                        className="mb-4 w-full"
                        onClick={() => handleFieldSelect("vendor")}
                      >
                        {activeField === "vendor" ? "Cancel Selection" : "Connect to PDF"}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div id="field-date">
                        <FormField 
                          id="date"
                          label="Invoice Date"
                          value={invoiceData.date?.toString() || ""}
                          onChange={(value) => updateInvoiceField("date", value)}
                          connected={isFieldConnected("date")}
                        />
                        <Button
                          type="button"
                          variant={activeField === "date" ? "default" : "outline"}
                          size="sm"
                          className="mb-4 w-full"
                          onClick={() => handleFieldSelect("date")}
                        >
                          {activeField === "date" ? "Cancel" : "Connect"}
                        </Button>
                      </div>
                      
                      <div id="field-dueDate">
                        <FormField 
                          id="dueDate"
                          label="Due Date"
                          value={invoiceData.dueDate?.toString() || ""}
                          onChange={(value) => updateInvoiceField("dueDate", value)}
                          connected={isFieldConnected("dueDate")}
                        />
                        <Button
                          type="button"
                          variant={activeField === "dueDate" ? "default" : "outline"}
                          size="sm"
                          className="mb-4 w-full"
                          onClick={() => handleFieldSelect("dueDate")}
                        >
                          {activeField === "dueDate" ? "Cancel" : "Connect"}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div id="field-amount">
                        <FormField 
                          id="amount"
                          label="Amount"
                          value={invoiceData.amount?.toString() || ""}
                          onChange={(value) => updateInvoiceField("amount", value)}
                          connected={isFieldConnected("amount")}
                        />
                        <Button
                          type="button"
                          variant={activeField === "amount" ? "default" : "outline"}
                          size="sm"
                          className="mb-4 w-full"
                          onClick={() => handleFieldSelect("amount")}
                        >
                          {activeField === "amount" ? "Cancel" : "Connect"}
                        </Button>
                      </div>
                      
                      <div id="field-tax">
                        <FormField 
                          id="tax"
                          label="Tax"
                          value={invoiceData.tax?.toString() || ""}
                          onChange={(value) => updateInvoiceField("tax", value)}
                          connected={isFieldConnected("tax")}
                        />
                        <Button
                          type="button"
                          variant={activeField === "tax" ? "default" : "outline"}
                          size="sm"
                          className="mb-4 w-full"
                          onClick={() => handleFieldSelect("tax")}
                        >
                          {activeField === "tax" ? "Cancel" : "Connect"}
                        </Button>
                      </div>
                      
                      <div id="field-total">
                        <FormField 
                          id="total"
                          label="Total"
                          value={invoiceData.total?.toString() || ""}
                          onChange={(value) => updateInvoiceField("total", value)}
                          connected={isFieldConnected("total")}
                        />
                        <Button
                          type="button"
                          variant={activeField === "total" ? "default" : "outline"}
                          size="sm"
                          className="mb-4 w-full"
                          onClick={() => handleFieldSelect("total")}
                        >
                          {activeField === "total" ? "Cancel" : "Connect"}
                        </Button>
                      </div>
                    </div>
                    
                    <div id="field-currency">
                      <FormField 
                        id="currency"
                        label="Currency"
                        value={invoiceData.currency?.toString() || ""}
                        onChange={(value) => updateInvoiceField("currency", value)}
                        connected={isFieldConnected("currency")}
                      />
                      <Button
                        type="button"
                        variant={activeField === "currency" ? "default" : "outline"}
                        size="sm"
                        className="mb-4 w-full"
                        onClick={() => handleFieldSelect("currency")}
                      >
                        {activeField === "currency" ? "Cancel" : "Connect"}
                      </Button>
                    </div>
                    
                    <div id="field-notes">
                      <FormField 
                        id="notes"
                        label="Notes"
                        value={invoiceData.notes?.toString() || ""}
                        onChange={(value) => updateInvoiceField("notes", value)}
                        connected={isFieldConnected("notes")}
                      />
                      <Button
                        type="button"
                        variant={activeField === "notes" ? "default" : "outline"}
                        size="sm"
                        className="mb-4 w-full"
                        onClick={() => handleFieldSelect("notes")}
                      >
                        {activeField === "notes" ? "Cancel" : "Connect"}
                      </Button>
                    </div>
                    
                    <Button 
                      className="w-full mt-4 gap-2" 
                      onClick={handleSaveInvoice}
                    >
                      <Check className="h-4 w-4" />
                      Save Invoice
                    </Button>
                  </CardContent>
                </Card>
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
