import { Annotation } from "@/types";

/**
 * Mock data representing OpenAI responses for testing
 */
export const mockOpenAIResponse = {
    "fields": [
        {
            "type": "vendor",
            "text": "Aker Solutions AS",
            "boundingBox": { "x": 0.155, "y": 0.18, "width": 0.15, "height": 0.025 },
            "confidence": 0.9
        },
        {
            "type": "date",
            "text": "2024-10-03",
            "boundingBox": { "x": 0.185, "y": 0.255, "width": 0.1, "height": 0.02 },
            "confidence": 0.9
        },
        {
            "type": "dueDate",
            "text": "2024-11-02",
            "boundingBox": { "x": 0.185, "y": 0.14, "width": 0.1, "height": 0.02 },
            "confidence": 0.9
        },
        {
            "type": "amount",
            "text": "613,785.00",
            "boundingBox": { "x": 0.285, "y": 0.565, "width": 0.12, "height": 0.02 },
            "confidence": 0.9
        },
        {
            "type": "tax",
            "text": "122,757.00",
            "boundingBox": { "x": 0.285, "y": 0.548, "width": 0.12, "height": 0.02 },
            "confidence": 0.9
        },
        {
            "type": "total",
            "text": "613,785.00",
            "boundingBox": { "x": 0.285, "y": 0.565, "width": 0.12, "height": 0.02 },
            "confidence": 0.9
        },
        {
            "type": "currency",
            "text": "NOK",
            "boundingBox": { "x": 0.325, "y": 0.587, "width": 0.05, "height": 0.02 },
            "confidence": 0.9
        },
        {
            "type": "notes",
            "text": "Please include invoice number with payment",
            "boundingBox": { "x": 0.18, "y": 0.357, "width": 0.35, "height": 0.02 },
            "confidence": 0.9
        }
    ]
};

/**
 * Convert OpenAI response format to our Annotation format
 */
export const getMockAnnotations = (): Annotation[] => {
    // Colors for different field types
    const fieldColors: Record<string, string> = {
        vendor: "#10b981",    // green
        date: "#3b82f6",      // blue
        dueDate: "#8b5cf6",   // purple
        amount: "#f59e0b",    // amber
        tax: "#ef4444",       // red
        total: "#ec4899",     // pink
        currency: "#06b6d4",  // cyan
        notes: "#6b7280",     // gray
    };

    return mockOpenAIResponse.fields.map(field => {
        const { type, text, boundingBox } = field;
        const { x, y, width, height } = boundingBox;

        // Create a unique ID
        const sessionId = `${type}-mock-${Math.random().toString(36).substring(2, 9)}`;

        // Save the normalized coordinates in both the annotation point and bounding box
        return {
            id: sessionId,
            x: x + (width / 2), // Center point of the bounding box for better alignment 
            y: y + (height / 2),
            type: type as any,
            value: text,
            color: fieldColors[type] || "#3b82f6",
            boundingBox: {
                x,
                y,
                width,
                height
            }
        };
    });
}; 