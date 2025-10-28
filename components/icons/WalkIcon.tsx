import React from 'react';

export const WalkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75v8.25" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 12.75l3.75 2.25" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21l-3.75-3.75M12 21l3.75-3.75" />
    </svg>
);
