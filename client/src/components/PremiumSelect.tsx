import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface PremiumSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const PremiumSelect: React.FC<PremiumSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`w-full flex items-center justify-between bg-white border ${
          isOpen ? 'border-brand-coral ring-2 ring-brand-coral/20' : 'border-gray-200'
        } text-brand-navy rounded-xl px-4 py-3 focus:outline-none transition-all ${
          disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'hover:border-gray-300'
        } overflow-hidden`}
      >
        <span className={selectedOption ? 'text-brand-navy block truncate text-left flex-1' : 'text-gray-400 block truncate text-left flex-1'}>
          {isHovered && displayText && displayText.length > 20 ? (
            // @ts-ignore
            <marquee scrollamount="4">{displayText}</marquee>
          ) : (
            displayText
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-auto py-1 animate-in fade-in zoom-in-95 duration-100">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">No options available</div>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                  value === option.value 
                    ? 'bg-brand-blush/30 text-brand-coral font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="truncate pr-4">{option.label}</span>
                {value === option.value && <Check className="w-4 h-4 text-brand-coral shrink-0" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
