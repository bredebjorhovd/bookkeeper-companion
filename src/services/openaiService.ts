import { Annotation } from '@/types';
import * as pdfjs from 'pdfjs-dist';
import { getMockAnnotations, mockOpenAIResponse } from '@/utils/mockData';

// Set debug mode to use mock data instead of calling OpenAI
const DEBUG_MODE = true;

// Set up the worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

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
    // In debug mode, return mock annotations without calling OpenAI
    if (DEBUG_MODE) {
      console.log('DEBUG MODE: Using mock OpenAI response');
      console.log('Mock data:', mockOpenAIResponse);
      return getMockAnnotations();
    }

    // This is the real implementation that calls OpenAI
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    const messages = [
      {
        role: "system",
        content: "You are an invoice analysis assistant. Extract invoice details including vendor, date, due date, amount, tax, total, currency and any notes. You MUST respond with a valid JSON object in this exact format: { \"fields\": [ { \"type\": \"vendor\", \"text\": \"value\", \"boundingBox\": { \"x\": 0, \"y\": 0, \"width\": 0, \"height\": 0 }, \"confidence\": 0.9 } ] }. Make sure your response is ONLY the JSON with NO explanatory text before or after."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this invoice and extract all relevant fields. Return a JSON object with fields array containing these properties: type, text, boundingBox (x, y, width, height as percentage of document dimensions), and confidence. Valid field types are: vendor, date, dueDate, amount, tax, total, currency, notes. Do NOT include any explanatory text in your response, ONLY the JSON object."
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
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.2,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    console.log('Raw OpenAI response:', data);

    let analysisResult: OpenAIInvoiceAnalysisResult;

    try {
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        console.log('Message content:', data.choices[0].message.content);
        const content = data.choices[0].message.content.trim();
        analysisResult = JSON.parse(content) as OpenAIInvoiceAnalysisResult;
      } else {
        throw new Error('Invalid response format from OpenAI');
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      // Fallback to a simpler structure if we can't parse the JSON
      return createFallbackAnnotations(data.choices[0].message.content);
    }

    console.log('Parsed result:', analysisResult);

    // Convert detected fields to annotations
    const annotations: Annotation[] = analysisResult.fields.map(field => {
      const x = field.boundingBox.x;
      const y = field.boundingBox.y;
      const width = field.boundingBox.width;
      const height = field.boundingBox.height;

      let validType = field.type as 'vendor' | 'date' | 'dueDate' | 'amount' | 'tax' | 'total' | 'currency' | 'notes';

      // Force valid types
      if (!['vendor', 'date', 'dueDate', 'amount', 'tax', 'total', 'currency', 'notes'].includes(validType)) {
        // Map common field names to our expected types
        if (field.type.toLowerCase().includes('vendor')) {
          validType = 'vendor';
        } else if (field.type.toLowerCase().includes('date') && !field.type.toLowerCase().includes('due')) {
          validType = 'date';
        } else if (field.type.toLowerCase().includes('due')) {
          validType = 'dueDate';
        } else if (field.type.toLowerCase().includes('amount') || field.type.toLowerCase().includes('subtotal')) {
          validType = 'amount';
        } else if (field.type.toLowerCase().includes('tax') || field.type.toLowerCase().includes('vat')) {
          validType = 'tax';
        } else if (field.type.toLowerCase().includes('total')) {
          validType = 'total';
        } else if (field.type.toLowerCase().includes('currency')) {
          validType = 'currency';
        } else {
          validType = 'notes';
        }
      }

      // Process field value
      let processedValue = field.text;
      // For amount/tax/total, ensure we extract just the numeric part without currency
      if (['amount', 'tax', 'total'].includes(validType)) {
        // Remove any currency symbols and keep only digits, comma, dot
        processedValue = field.text.replace(/[^0-9.,]/g, '');
      }

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
        x: x,          // Use the original x coordinate
        y: y,          // Use the original y coordinate
        type: validType,
        value: processedValue,
        color: fieldColors[validType] || "#3b82f6",
        boundingBox: {
          x,          // Fraction (0-1)
          y,          // Fraction (0-1)
          width,      // Fraction (0-1)
          height      // Fraction (0-1)
        }
      };
    });

    return annotations;
  } catch (error) {
    console.error('Error analyzing invoice with OpenAI:', error);
    throw error;
  }
};

// Function to create fallback annotations when JSON parsing fails
const createFallbackAnnotations = (textContent: string): Annotation[] => {
  console.log('Creating fallback annotations from text content');
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

  const annotations: Annotation[] = [];

  // Match fields using the format from the OpenAI response
  // Example: "**Field Type:** Vendor\n**Exact Text Value:** Aker Solutions AS\n**Position:** (x: 0.0, y: 0.0, width: 30.0, height: 5.0)"
  const fieldRegex = /\*\*Field Type:\*\*\s*(.*?)\n\*\*Exact Text Value:\*\*\s*(.*?)\n\*\*Position:\*\*\s*\(x:\s*([\d.]+),\s*y:\s*([\d.]+),\s*width:\s*([\d.]+),\s*height:\s*([\d.]+)\)/gis;

  let match;
  while ((match = fieldRegex.exec(textContent)) !== null) {
    const fieldType = match[1].trim().toLowerCase();
    const value = match[2].trim();
    // Parse position values and convert to fractions (0-1)
    // The regex will extract values like "0.1" or "10.0" directly as strings
    const x = parseFloat(match[3]);
    const y = parseFloat(match[4]);
    const width = parseFloat(match[5]);
    const height = parseFloat(match[6]);

    // Log the extracted values for debugging
    console.log(`Extracted from text for ${fieldType}:`, { x, y, width, height });

    // Normalize to fractions if they seem to be percentages (> 1)
    const normalizedX = x > 1 ? x / 100 : x;
    const normalizedY = y > 1 ? y / 100 : y;
    const normalizedWidth = width > 1 ? width / 100 : width;
    const normalizedHeight = height > 1 ? height / 100 : height;

    // Log the normalized values for debugging
    console.log(`Normalized to fractions for ${fieldType}:`, {
      x: normalizedX,
      y: normalizedY,
      width: normalizedWidth,
      height: normalizedHeight
    });

    // Map common field names to our expected types
    let mappedType: string;
    if (fieldType === 'vendor' || fieldType.includes('vendor')) {
      mappedType = 'vendor';
    } else if (fieldType === 'date' || fieldType.includes('date') && !fieldType.includes('due')) {
      mappedType = 'date';
    } else if (fieldType === 'due date' || fieldType.includes('due')) {
      mappedType = 'dueDate';
    } else if (fieldType === 'amount' || fieldType.includes('amount') || fieldType.includes('subtotal')) {
      mappedType = 'amount';
    } else if (fieldType === 'tax' || fieldType.includes('tax') || fieldType.includes('vat')) {
      mappedType = 'tax';
    } else if (fieldType === 'total' || fieldType.includes('total')) {
      mappedType = 'total';
    } else if (fieldType === 'currency' || fieldType.includes('currency')) {
      mappedType = 'currency';
    } else if (fieldType === 'notes' || fieldType.includes('notes')) {
      mappedType = 'notes';
    } else {
      // Skip fields we don't recognize
      continue;
    }

    // Process field value for numeric fields
    let processedValue = value;
    if (['amount', 'tax', 'total'].includes(mappedType)) {
      // Remove any currency symbols and keep only digits, comma, dot
      processedValue = value.replace(/[^0-9.,]/g, '');
    }

    // Create annotation
    annotations.push({
      id: `${mappedType}-auto-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x: normalizedX + (normalizedWidth / 2), // Center point x as fraction
      y: normalizedY + (normalizedHeight / 2), // Center point y as fraction
      type: mappedType as any,
      value: processedValue,
      color: fieldColors[mappedType] || "#3b82f6",
      boundingBox: {
        x: normalizedX,
        y: normalizedY,
        width: normalizedWidth,
        height: normalizedHeight
      }
    });
  }

  // If we couldn't extract anything with the specific format, fall back to simpler extraction
  if (annotations.length === 0) {
    // The original fallback code for simpler extraction
    const vendorMatch = textContent.match(/Vendor.*?:\s*(.*?)(?:\n|$)/i);
    const dateMatch = textContent.match(/Date.*?:\s*(.*?)(?:\n|$)/i);
    const dueDateMatch = textContent.match(/Due Date.*?:\s*(.*?)(?:\n|$)/i);
    const amountMatch = textContent.match(/Amount.*?:\s*(.*?)(?:\n|$)/i);
    const taxMatch = textContent.match(/(?:VAT|Tax).*?:\s*(.*?)(?:\n|$)/i);
    const totalMatch = textContent.match(/Total.*?:\s*(.*?)(?:\n|$)/i);

    if (vendorMatch && vendorMatch[1]) {
      annotations.push({
        id: `vendor-auto-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        x: 0.2, // 20% of width
        y: 0.1, // 10% of height
        type: 'vendor',
        value: vendorMatch[1].trim(),
        color: fieldColors.vendor,
        boundingBox: { x: 0.1, y: 0.05, width: 0.2, height: 0.1 }
      });
    }

    if (dateMatch && dateMatch[1]) {
      annotations.push({
        id: `date-auto-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        x: 0.7, // 70% of width
        y: 0.1, // 10% of height
        type: 'date',
        value: dateMatch[1].trim(),
        color: fieldColors.date,
        boundingBox: { x: 0.6, y: 0.05, width: 0.2, height: 0.1 }
      });
    }

    if (dueDateMatch && dueDateMatch[1]) {
      annotations.push({
        id: `dueDate-auto-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        x: 0.7, // 70% of width
        y: 0.2, // 20% of height
        type: 'dueDate',
        value: dueDateMatch[1].trim(),
        color: fieldColors.dueDate,
        boundingBox: { x: 0.6, y: 0.15, width: 0.2, height: 0.1 }
      });
    }

    if (amountMatch && amountMatch[1]) {
      const processedValue = amountMatch[1].trim().replace(/[^0-9.,]/g, '');
      annotations.push({
        id: `amount-auto-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        x: 0.7, // 70% of width
        y: 0.4, // 40% of height
        type: 'amount',
        value: processedValue,
        color: fieldColors.amount,
        boundingBox: { x: 0.6, y: 0.35, width: 0.2, height: 0.1 }
      });
    }

    if (taxMatch && taxMatch[1]) {
      const processedValue = taxMatch[1].trim().replace(/[^0-9.,]/g, '');
      annotations.push({
        id: `tax-auto-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        x: 0.7, // 70% of width
        y: 0.5, // 50% of height
        type: 'tax',
        value: processedValue,
        color: fieldColors.tax,
        boundingBox: { x: 0.6, y: 0.45, width: 0.2, height: 0.1 }
      });
    }

    if (totalMatch && totalMatch[1]) {
      const processedValue = totalMatch[1].trim().replace(/[^0-9.,]/g, '');
      annotations.push({
        id: `total-auto-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        x: 0.7, // 70% of width
        y: 0.6, // 60% of height
        type: 'total',
        value: processedValue,
        color: fieldColors.total,
        boundingBox: { x: 0.6, y: 0.55, width: 0.2, height: 0.1 }
      });
    }
  }

  console.log('Created fallback annotations:', annotations);
  return annotations;
}

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
    console.log('Starting PDF rendering with URL:', pdfUrl);

    // Load the PDF document
    const loadingTask = pdfjs.getDocument(pdfUrl);
    console.log('PDF loading task created');

    const pdf = await loadingTask.promise;
    console.log('PDF loaded, total pages:', pdf.numPages);

    // Get the specified page
    const page = await pdf.getPage(pageNumber);
    console.log('Page loaded:', pageNumber);

    // Set viewport
    const viewport = page.getViewport({ scale });
    console.log('Viewport created:', viewport.width, 'x', viewport.height);

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

    console.log('Starting page render');
    await page.render(renderContext).promise;
    console.log('Page rendered successfully');

    // Convert the canvas to an image data URL
    const imageDataUrl = canvas.toDataURL('image/png');
    console.log('Image data URL created');

    return imageDataUrl;
  } catch (error) {
    console.error('Error rendering PDF page as image:', error);
    return null;
  }
};

// Add this function after the analyzeInvoiceWithOpenAI function
export const getMockInvoiceAnalysis = (): Annotation[] => {
  console.log('Using mock invoice analysis data');

  // These coordinates are based on percentages of the viewable area
  const annotations: Annotation[] = [
    {
      id: `vendor-auto-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x: 20,
      y: 10,
      type: 'vendor',
      value: 'Aker Solutions AS',
      color: "#10b981",
      boundingBox: { x: 10, y: 5, width: 20, height: 10 }
    },
    {
      id: `date-auto-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x: 80,
      y: 10,
      type: 'date',
      value: '2024-10-03',
      color: "#3b82f6",
      boundingBox: { x: 70, y: 5, width: 20, height: 10 }
    },
    {
      id: `dueDate-auto-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x: 80,
      y: 20,
      type: 'dueDate',
      value: '2024-11-02',
      color: "#8b5cf6",
      boundingBox: { x: 70, y: 15, width: 20, height: 10 }
    },
    {
      id: `amount-auto-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x: 80,
      y: 40,
      type: 'amount',
      value: '613,785.00',
      color: "#f59e0b",
      boundingBox: { x: 70, y: 35, width: 20, height: 10 }
    },
    {
      id: `tax-auto-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x: 80,
      y: 50,
      type: 'tax',
      value: '122,757.00',
      color: "#ef4444",
      boundingBox: { x: 70, y: 45, width: 20, height: 10 }
    },
    {
      id: `total-auto-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x: 80,
      y: 60,
      type: 'total',
      value: '613,785.00',
      color: "#ec4899",
      boundingBox: { x: 70, y: 55, width: 20, height: 10 }
    },
    {
      id: `currency-auto-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x: 80,
      y: 70,
      type: 'currency',
      value: 'NOK',
      color: "#06b6d4",
      boundingBox: { x: 70, y: 65, width: 20, height: 10 }
    },
    {
      id: `notes-auto-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      x: 20,
      y: 80,
      type: 'notes',
      value: 'Payment certificate: 5503691187',
      color: "#6b7280",
      boundingBox: { x: 10, y: 75, width: 20, height: 10 }
    }
  ];

  return annotations;
};
