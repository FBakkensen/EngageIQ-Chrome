import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

/**
 * Button component with different variants and states
 */
const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props 
}) => {
  const getVariantClasses = () => {
    const isDisabled = disabled || isLoading;
    
    switch (variant) {
      case 'primary':
        return isDisabled 
          ? 'bg-blue-300 text-white cursor-not-allowed' 
          : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
      case 'secondary':
        return isDisabled 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
          : 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-400';
      case 'outline':
        return isDisabled 
          ? 'border border-gray-300 text-gray-400 cursor-not-allowed' 
          : 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400';
      case 'danger':
        return isDisabled 
          ? 'bg-red-300 text-white cursor-not-allowed' 
          : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
      default:
        return isDisabled 
          ? 'bg-blue-300 text-white cursor-not-allowed' 
          : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';
    }
  };

  const baseClasses = 'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const buttonClasses = `${baseClasses} ${getVariantClasses()} ${className}`;

  return (
    <button
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      <div className="flex items-center justify-center">
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {!isLoading && icon && <span className="mr-2">{icon}</span>}
        {children}
      </div>
    </button>
  );
};

export default Button;