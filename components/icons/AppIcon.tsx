import React from 'react';

export const AppIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    {/* Magnifying Glass */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    {/* Globe lines inside the glass */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 14.25c-1.5 0-2.84.4-4.005 1.08M10.5 5.25c1.165-.68 2.505-1.08 4.005-1.08" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.375 9.75c-.68 1.165-1.08 2.505-1.08 4.005" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.625 9.75c.68-1.165 1.08-2.505 1.08-4.005" />
  </svg>
);
