
// Field color map for consistent coloring
export const fieldColors = {
  vendor: "#10b981", // green
  date: "#3b82f6",   // blue 
  dueDate: "#8b5cf6", // purple
  amount: "#f59e0b", // amber
  tax: "#ef4444",    // red
  total: "#ec4899",  // pink
  currency: "#06b6d4", // cyan
  notes: "#6b7280",  // gray
};

// Helper function to get a color for a field
export const getFieldColor = (fieldName: string): string => {
  return fieldColors[fieldName as keyof typeof fieldColors] || "#3b82f6";
};
