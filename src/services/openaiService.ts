
import { Annotation } from '@/types';

interface DetectedField {
  type: string;
  text: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

export interface OpenAIInvoiceAnalysisResult {
  fields: DetectedField[];
}

export const analyzeInvoiceWithOpenAI = async (
  pdfBase64: string | null,
  pdfImage: string | null,
  apiKey: string
): Promise<Annotation[]> => {
  if (!pdfBase64 && !pdfImage) {
    throw new Error("Either PDF base64 or image is required for analysis");
  }

  try {
    // This is a sample implementation - in a real app, you would call the OpenAI API
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    const messages = [
      {
        role: "system",
        content: "You are an invoice analysis assistant. Extract invoice details including vendor, date, due date, amount, tax, total, currency and any notes."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this invoice and extract all relevant fields. Provide the field type, exact text value, and the position of each field as coordinates (x, y, width, height) as percentage of document dimensions."
          },
          {
            type: "image_url",
            image_url: {
              url: pdfImage || `data:application/pdf;base64,${pdfBase64}`
            }
          }
        ]
      }
    ];

    // In a real implementation, you'd use this code:
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers,
    //   body: JSON.stringify({
    //     model: 'gpt-4o',
    //     messages,
    //     temperature: 0.2,
    //     max_tokens: 1500
    //   })
    // });
    // 
    // const data = await response.json();
    // const analysisResult = JSON.parse(data.choices[0].message.content) as OpenAIInvoiceAnalysisResult;

    // For demonstration purposes, we'll simulate a response:
    console.log('OpenAI analysis would happen here with actual API call');
    
    // Simulate detected fields
    const mockAnalysisResult: OpenAIInvoiceAnalysisResult = {
      fields: [
        {
          type: "vendor",
          text: "Acme Inc.",
          boundingBox: { x: 10, y: 15, width: 30, height: 5 },
          confidence: 0.95
        },
        {
          type: "date",
          text: "2023-10-15",
          boundingBox: { x: 70, y: 15, width: 20, height: 5 },
          confidence: 0.93
        },
        {
          type: "dueDate",
          text: "2023-11-15",
          boundingBox: { x: 70, y: 25, width: 20, height: 5 },
          confidence: 0.92
        },
        {
          type: "amount",
          text: "1250.00",
          boundingBox: { x: 75, y: 60, width: 15, height: 5 },
          confidence: 0.97
        },
        {
          type: "tax",
          text: "187.50",
          boundingBox: { x: 75, y: 65, width: 15, height: 5 },
          confidence: 0.96
        },
        {
          type: "total",
          text: "1437.50",
          boundingBox: { x: 75, y: 70, width: 15, height: 5 },
          confidence: 0.98
        },
        {
          type: "currency",
          text: "USD",
          boundingBox: { x: 80, y: 60, width: 5, height: 5 },
          confidence: 0.94
        }
      ]
    };

    // Convert detected fields to annotations
    const annotations: Annotation[] = mockAnalysisResult.fields.map(field => {
      // Calculate center point of the bounding box
      const x = field.boundingBox.x + (field.boundingBox.width / 2);
      const y = field.boundingBox.y + (field.boundingBox.height / 2);
      
      // Map OpenAI field types to application field types if needed
      const validType = field.type as 'vendor' | 'date' | 'dueDate' | 'amount' | 'tax' | 'total' | 'currency' | 'notes';
      
      // Generate a color based on the field type (using existing color map from the application)
      const fieldColors: Record<string, string> = {
        vendor: "#10b981",
        date: "#3b82f6",
        dueDate: "#8b5cf6",
        amount: "#f59e0b",
        tax: "#ef4444",
        total: "#ec4899",
        currency: "#06b6d4",
        notes: "#6b7280",
      };
      
      return {
        id: `${validType}-auto-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        x,
        y,
        type: validType,
        value: field.text,
        color: fieldColors[validType] || "#3b82f6",
        boundingBox: field.boundingBox // Added for visualization
      };
    });
    
    return annotations;
  } catch (error) {
    console.error('Error analyzing invoice with OpenAI:', error);
    throw error;
  }
};

// Helper function to convert a File to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

// Helper function to render a PDF page as an image
export const renderPdfPageAsImage = async (
  pdfUrl: string, 
  pageNumber: number = 1, 
  scale: number = 2
): Promise<string | null> => {
  try {
    const { default: pdfjs } = await import('pdfjs-dist');
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    
    // Get the specified page
    const page = await pdf.getPage(pageNumber);
    
    // Set viewport
    const viewport = page.getViewport({ scale });
    
    // Prepare canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    
    // Render the page to the canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    // Convert the canvas to an image data URL
    const imageDataUrl = canvas.toDataURL('image/png');
    return imageDataUrl;
  } catch (error) {
    console.error('Error rendering PDF page as image:', error);
    return null;
  }
};
