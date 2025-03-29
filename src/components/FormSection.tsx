
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FormField from "@/components/FormField";
import { Check } from "lucide-react";
import { InvoiceData } from "@/types";

interface FormSectionProps {
  invoiceData: Partial<InvoiceData>;
  updateInvoiceField: (field: string, value: any) => void;
  activeField: string | null;
  handleFieldSelect: (fieldName: string) => void;
  isFieldConnected: (fieldName: string) => boolean;
  getFieldColor: (fieldName: string) => string;
}

const FormSection = ({
  invoiceData,
  updateInvoiceField,
  activeField,
  handleFieldSelect,
  isFieldConnected,
  getFieldColor,
  handleSaveInvoice
}: FormSectionProps & { handleSaveInvoice: () => void }) => {
  return (
    <Card className="md:col-span-4">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Invoice Details</h2>
        
        <div className="space-y-1 mb-6">
          <p className="text-sm text-gray-500">Click a field below, then click on the PDF to connect data points</p>
        </div>
        
        <div id="field-vendor" className="relative">
          <div 
            className="absolute left-0 top-1/2 w-1 h-full -translate-y-1/2 rounded-l" 
            style={{ backgroundColor: getFieldColor('vendor') }}
          ></div>
          <div className="pl-4">
            <FormField 
              id="vendor"
              label="Vendor"
              value={invoiceData.vendor?.toString() || ""}
              onChange={(value) => updateInvoiceField("vendor", value)}
              connected={isFieldConnected("vendor")}
              color={getFieldColor('vendor')}
            />
            <Button
              type="button"
              variant={activeField === "vendor" ? "default" : "outline"}
              size="sm"
              className="mb-4 w-full"
              onClick={() => handleFieldSelect("vendor")}
              style={{ 
                ...(activeField === "vendor" && { backgroundColor: getFieldColor('vendor') }) 
              }}
            >
              {activeField === "vendor" ? "Cancel Selection" : "Connect to PDF"}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div id="field-date" className="relative">
            <div 
              className="absolute left-0 top-1/2 w-1 h-full -translate-y-1/2 rounded-l" 
              style={{ backgroundColor: getFieldColor('date') }}
            ></div>
            <div className="pl-4">
              <FormField 
                id="date"
                label="Invoice Date"
                value={invoiceData.date?.toString() || ""}
                onChange={(value) => updateInvoiceField("date", value)}
                connected={isFieldConnected("date")}
                color={getFieldColor('date')}
              />
              <Button
                type="button"
                variant={activeField === "date" ? "default" : "outline"}
                size="sm"
                className="mb-4 w-full"
                onClick={() => handleFieldSelect("date")}
                style={{ 
                  ...(activeField === "date" && { backgroundColor: getFieldColor('date') }) 
                }}
              >
                {activeField === "date" ? "Cancel" : "Connect"}
              </Button>
            </div>
          </div>
          
          <div id="field-dueDate" className="relative">
            <div 
              className="absolute left-0 top-1/2 w-1 h-full -translate-y-1/2 rounded-l" 
              style={{ backgroundColor: getFieldColor('dueDate') }}
            ></div>
            <div className="pl-4">
              <FormField 
                id="dueDate"
                label="Due Date"
                value={invoiceData.dueDate?.toString() || ""}
                onChange={(value) => updateInvoiceField("dueDate", value)}
                connected={isFieldConnected("dueDate")}
                color={getFieldColor('dueDate')}
              />
              <Button
                type="button"
                variant={activeField === "dueDate" ? "default" : "outline"}
                size="sm"
                className="mb-4 w-full"
                onClick={() => handleFieldSelect("dueDate")}
                style={{ 
                  ...(activeField === "dueDate" && { backgroundColor: getFieldColor('dueDate') }) 
                }}
              >
                {activeField === "dueDate" ? "Cancel" : "Connect"}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div id="field-amount" className="relative">
            <div 
              className="absolute left-0 top-1/2 w-1 h-full -translate-y-1/2 rounded-l" 
              style={{ backgroundColor: getFieldColor('amount') }}
            ></div>
            <div className="pl-4">
              <FormField 
                id="amount"
                label="Amount"
                value={invoiceData.amount?.toString() || ""}
                onChange={(value) => updateInvoiceField("amount", value)}
                connected={isFieldConnected("amount")}
                color={getFieldColor('amount')}
              />
              <Button
                type="button"
                variant={activeField === "amount" ? "default" : "outline"}
                size="sm"
                className="mb-4 w-full"
                onClick={() => handleFieldSelect("amount")}
                style={{ 
                  ...(activeField === "amount" && { backgroundColor: getFieldColor('amount') }) 
                }}
              >
                {activeField === "amount" ? "Cancel" : "Connect"}
              </Button>
            </div>
          </div>
          
          <div id="field-tax" className="relative">
            <div 
              className="absolute left-0 top-1/2 w-1 h-full -translate-y-1/2 rounded-l" 
              style={{ backgroundColor: getFieldColor('tax') }}
            ></div>
            <div className="pl-4">
              <FormField 
                id="tax"
                label="Tax"
                value={invoiceData.tax?.toString() || ""}
                onChange={(value) => updateInvoiceField("tax", value)}
                connected={isFieldConnected("tax")}
                color={getFieldColor('tax')}
              />
              <Button
                type="button"
                variant={activeField === "tax" ? "default" : "outline"}
                size="sm"
                className="mb-4 w-full"
                onClick={() => handleFieldSelect("tax")}
                style={{ 
                  ...(activeField === "tax" && { backgroundColor: getFieldColor('tax') }) 
                }}
              >
                {activeField === "tax" ? "Cancel" : "Connect"}
              </Button>
            </div>
          </div>
          
          <div id="field-total" className="relative">
            <div 
              className="absolute left-0 top-1/2 w-1 h-full -translate-y-1/2 rounded-l" 
              style={{ backgroundColor: getFieldColor('total') }}
            ></div>
            <div className="pl-4">
              <FormField 
                id="total"
                label="Total"
                value={invoiceData.total?.toString() || ""}
                onChange={(value) => updateInvoiceField("total", value)}
                connected={isFieldConnected("total")}
                color={getFieldColor('total')}
              />
              <Button
                type="button"
                variant={activeField === "total" ? "default" : "outline"}
                size="sm"
                className="mb-4 w-full"
                onClick={() => handleFieldSelect("total")}
                style={{ 
                  ...(activeField === "total" && { backgroundColor: getFieldColor('total') }) 
                }}
              >
                {activeField === "total" ? "Cancel" : "Connect"}
              </Button>
            </div>
          </div>
        </div>
        
        <div id="field-currency" className="relative">
          <div 
            className="absolute left-0 top-1/2 w-1 h-full -translate-y-1/2 rounded-l" 
            style={{ backgroundColor: getFieldColor('currency') }}
          ></div>
          <div className="pl-4">
            <FormField 
              id="currency"
              label="Currency"
              value={invoiceData.currency?.toString() || ""}
              onChange={(value) => updateInvoiceField("currency", value)}
              connected={isFieldConnected("currency")}
              color={getFieldColor('currency')}
            />
            <Button
              type="button"
              variant={activeField === "currency" ? "default" : "outline"}
              size="sm"
              className="mb-4 w-full"
              onClick={() => handleFieldSelect("currency")}
              style={{ 
                ...(activeField === "currency" && { backgroundColor: getFieldColor('currency') }) 
              }}
            >
              {activeField === "currency" ? "Cancel" : "Connect"}
            </Button>
          </div>
        </div>
        
        <div id="field-notes" className="relative">
          <div 
            className="absolute left-0 top-1/2 w-1 h-full -translate-y-1/2 rounded-l" 
            style={{ backgroundColor: getFieldColor('notes') }}
          ></div>
          <div className="pl-4">
            <FormField 
              id="notes"
              label="Notes"
              value={invoiceData.notes?.toString() || ""}
              onChange={(value) => updateInvoiceField("notes", value)}
              connected={isFieldConnected("notes")}
              color={getFieldColor('notes')}
            />
            <Button
              type="button"
              variant={activeField === "notes" ? "default" : "outline"}
              size="sm"
              className="mb-4 w-full"
              onClick={() => handleFieldSelect("notes")}
              style={{ 
                ...(activeField === "notes" && { backgroundColor: getFieldColor('notes') }) 
              }}
            >
              {activeField === "notes" ? "Cancel" : "Connect"}
            </Button>
          </div>
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
  );
};

export default FormSection;
