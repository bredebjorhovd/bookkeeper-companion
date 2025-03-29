
import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFieldProps } from '@/types';

const FormField = ({ id, label, value, onChange, connected }: FormFieldProps) => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  return (
    <div 
      ref={fieldRef}
      className={`relative mb-4 p-4 rounded-md transition-all ${connected ? 'bg-blue-50 border border-blue-200' : 'bg-white'} ${isActive ? 'ring-2 ring-primary' : ''}`}
    >
      {connected && (
        <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-primary rounded-full"></div>
      )}
      <Label 
        htmlFor={id}
        className="text-sm font-medium text-gray-700 mb-1 block"
      >
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsActive(true)}
        onBlur={() => setIsActive(false)}
        className="w-full"
      />
    </div>
  );
};

export default FormField;
