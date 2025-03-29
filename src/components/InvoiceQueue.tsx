
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceData } from '@/types';
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';

interface InvoiceQueueProps {
  invoices: InvoiceData[];
  onSelectInvoice: (invoice: InvoiceData) => void;
}

const InvoiceQueue = ({ invoices, onSelectInvoice }: InvoiceQueueProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Processing Queue</CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No invoices in queue</p>
        ) : (
          <div className="space-y-2">
            {invoices.map((invoice) => (
              <div 
                key={invoice.id}
                onClick={() => onSelectInvoice(invoice)}
                className="flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-gray-50 border"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs">{invoice.fileName.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-medium">{invoice.vendor || 'Unknown Vendor'}</p>
                    <p className="text-sm text-gray-500">{invoice.fileName}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <Badge 
                    variant={
                      invoice.status === 'processed' ? 'default' : 
                      invoice.status === 'error' ? 'destructive' : 'secondary'
                    }
                    className="mb-1"
                  >
                    {invoice.status}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(invoice.uploadedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceQueue;
