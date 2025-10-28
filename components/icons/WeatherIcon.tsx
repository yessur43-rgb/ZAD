import React from 'react';
import { WeatherIconType } from '../../types';

// Individual SVG components for each weather type
const SunnyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
);

const CloudyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-2.666-5.113 5.25 5.25 0 00-10.75 4.757 4.5 4.5 0 00-1.928 6.002z" />
    </svg>
);

const PartlyCloudyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M22.5 15a4.5 4.5 0 01-4.5 4.5H7.5a4.5 4.5 0 01-4.5-4.5 4.5 4.5 0 014.5-4.5h.75" opacity="0.5" />
    </svg>
);

const RainyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-2.666-5.113 5.25 5.25 0 00-10.75 4.757 4.5 4.5 0 00-1.928 6.002z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19.5l-1.5 2.25M15 19.5l-1.5 2.25" />
    </svg>
);

interface WeatherIconProps extends React.SVGProps<SVGSVGElement> {
  icon: WeatherIconType;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ icon, ...props }) => {
  switch (icon) {
    case 'sunny':
      return <SunnyIcon {...props} />;
    case 'cloudy':
      return <CloudyIcon {...props} />;
    case 'partly-cloudy':
      return <PartlyCloudyIcon {...props} />;
    case 'rainy':
      return <RainyIcon {...props} />;
    // Add more cases for 'snowy', 'windy' etc. if needed
    default:
      return <CloudyIcon {...props} />; // Default icon
  }
};
