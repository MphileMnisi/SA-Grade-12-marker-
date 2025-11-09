import React from 'react';

export const ChatBubbleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72 3.72a1.05 1.05 0 01-1.485 0l-3.72-3.72A2.1 2.1 0 014.5 14.894V8.511c0-1.136.847-2.1 1.98-2.193l3.72-3.72a1.05 1.05 0 011.485 0l3.72 3.72c.884.284 1.5 1.128 1.5 2.097zM14.25 8.25a2.25 2.25 0 10-4.5 0 2.25 2.25 0 004.5 0z" />
  </svg>
);
