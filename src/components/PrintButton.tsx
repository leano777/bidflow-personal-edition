import React from 'react';

export type PrintButtonProps = {
  label?: string;
  className?: string;
  title?: string;
};

/**
 * PrintButton
 * - Triggers the browser print dialog for Save as PDF workflows
 * - Add `print-hidden` class to hide the button in the printed output
 */
export const PrintButton: React.FC<PrintButtonProps> = ({
  label = 'Print / Save PDF',
  className = '',
  title = 'Open print dialog to save as PDF',
}) => {
  const onClick = () => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  };

  return (
    <button
      type="button"
      className={`print-hidden inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      onClick={onClick}
      title={title}
      aria-label={label}
    >
      {/* Simple printer icon (SVG) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M6 7V3h12v4H6zm12 2V5H6v4H4a2 2 0 00-2 2v6h4v4h12v-4h4v-6a2 2 0 00-2-2h-2zm-2 10H8v-6h8v6zm2-8a1 1 0 110-2 1 1 0 010 2z" />
      </svg>
      <span>{label}</span>
    </button>
  );
};

export default PrintButton;

