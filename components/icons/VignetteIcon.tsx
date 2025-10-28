import React from 'react';

export const VignetteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 014.5 3.75h15a.75.75 0 01.75.75v15a.75.75 0 01-.75.75h-15a.75.75 0 01-.75-.75v-15z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15.75l.75-1.5 3 4.5 3-6 .75 1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12h9" />
    </svg>
);