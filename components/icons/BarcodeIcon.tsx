import React from 'react';

export const BarcodeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 014.5 3.75h15a.75.75 0 01.75.75v15a.75.75 0 01-.75.75h-15a.75.75 0 01-.75-.75v-15z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6v12m1.5-12v12m3-12v12m-9-6h15m-12 3h3m3 0h.75" />
    </svg>
);