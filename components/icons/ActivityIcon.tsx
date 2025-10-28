import React from 'react';

export const ActivityIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6.75v10.5m-3-10.5v10.5m-3-10.5v10.5m-3-10.5v10.5M4.5 21h15M4.5 3h15" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18" />
    </svg>
);