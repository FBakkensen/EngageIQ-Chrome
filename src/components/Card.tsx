import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Card component with optional title and footer
 */
const Card: React.FC<CardProps> = ({ title, children, footer, className = '' }) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6 ${className}`}>
      {title && (
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
      )}
      
      <div className="card-body">
        {children}
      </div>
      
      {footer && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;