import React from 'react';
import { StarIcon } from './icons/StarIcon';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, maxRating = 5 }) => {
  return (
    <div className="flex items-center">
      <span className="text-amber-500 font-bold mr-1">{rating.toFixed(1)}</span>
      <div className="flex">
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1;
          return (
            <StarIcon
              key={index}
              className={`h-4 w-4 ${
                starValue <= rating
                  ? 'text-amber-400'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default StarRating;
