import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helpText?: string | React.ReactNode;
  error?: string;
  endIcon?: React.ReactNode;
  onEndIconClick?: () => void;
}

/**
 * Input component with optional label, help text, and error message
 */
const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  helpText,
  error,
  className = '',
  id,
  endIcon,
  onEndIconClick,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  const inputClasses = `
    w-full 
    px-3 
    py-2 
    border 
    rounded-md 
    shadow-sm 
    focus:outline-none 
    focus:ring-2 
    focus:ring-blue-500 
    ${error ? 'border-red-300' : 'border-gray-300'} 
    ${endIcon ? 'pr-10' : ''} 
    ${className}
  `;

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium mb-2 text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          id={inputId}
          ref={ref}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
          {...props}
        />
        
        {endIcon && (
          <button
            type="button"
            onClick={onEndIconClick}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {endIcon}
          </button>
        )}
      </div>
      
      {helpText && !error && (
        <p id={`${inputId}-help`} className="mt-1 text-xs text-gray-500">
          {helpText}
        </p>
      )}
      
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;