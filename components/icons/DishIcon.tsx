import React from 'react';

export const DishIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 12.25c0 .414-.336.75-.75.75H3c-.414 0-.75-.336-.75-.75V12c0-.414.336-.75.75-.75h18c.414 0 .75.336.75.75v.25zM18.75 6.75h-13.5a.75.75 0 000 1.5h13.5a.75.75 0 000-1.5zM12 21.75a.75.75 0 00.75-.75V15.75a.75.75 0 00-1.5 0v5.25c0 .414.336.75.75.75zM8.25 15.75H7.5v5.25a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75zm7.5 0h-.75a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-5.25z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12.75v6.25a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5v-6.25" />
  </svg>
);
