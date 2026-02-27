'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

type StarRatingProps = {
    rating: number;
    maxRating?: number;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    interactive?: boolean;
    onChange?: (rating: number) => void;
    showValue?: boolean;
    className?: string;
};

const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
};

export default function StarRating({
    rating,
    maxRating = 5,
    size = 'md',
    interactive = false,
    onChange,
    showValue = false,
    className = ''
}: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState<number | null>(null);

    const displayRating = hoverRating !== null ? hoverRating : rating;

    const handleClick = (value: number) => {
        if (interactive && onChange) {
            onChange(value);
        }
    };

    const handleMouseEnter = (value: number) => {
        if (interactive) {
            setHoverRating(value);
        }
    };

    const handleMouseLeave = () => {
        if (interactive) {
            setHoverRating(null);
        }
    };

    return (
        <div className={`inline-flex items-center gap-1 ${className}`}>
            <div className="inline-flex items-center gap-0.5" dir="ltr">
                {Array.from({ length: maxRating }, (_, i) => {
                    const starValue = i + 1;
                    const isFilled = starValue <= displayRating;
                    const isPartial = !isFilled && starValue - 0.5 <= displayRating;

                    const starContent = isPartial ? (
                        <div className="relative">
                            <Star className={`${sizeClasses[size]} text-gray-300`} />
                            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                                <Star className={`${sizeClasses[size]} text-amber-400 fill-amber-400`} />
                            </div>
                        </div>
                    ) : (
                        <Star
                            className={`
                    ${sizeClasses[size]}
                    ${isFilled ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                    ${interactive && hoverRating !== null && starValue <= hoverRating ? 'text-amber-300 fill-amber-300' : ''}
                  `}
                        />
                    );

                    if (!interactive) {
                        return (
                            <span key={i} className="inline-flex">
                                {starContent}
                            </span>
                        );
                    }

                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => handleClick(starValue)}
                            onMouseEnter={() => handleMouseEnter(starValue)}
                            onMouseLeave={handleMouseLeave}
                            className="p-0 leading-none cursor-pointer hover:scale-110 transition-transform relative"
                            aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
                        >
                            {starContent}
                        </button>
                    );
                })}
            </div>

            {showValue && (
                <span className="text-sm font-black text-gray-700 ml-1" dir="ltr">
                    {rating.toFixed(1)}
                </span>
            )}
        </div>
    );
}
