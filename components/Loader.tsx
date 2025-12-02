import React from 'react';
import '../types';

interface LoaderProps {
    size?: number;
    className?: string;
    hideText?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({ size, className, hideText }) => {
    const isIconMode = typeof size === 'number';
    const shouldHideText = hideText ?? isIconMode;
    const shouldRemovePadding = isIconMode;

    const sizeStyle = size ? { width: size, height: size } : undefined;
    const sizeClass = size ? '' : 'w-12 h-12';
    const borderClass = size && size < 20 ? 'border-2' : 'border-4';

    return (
        <div className={`flex flex-col items-center justify-center ${shouldRemovePadding ? '' : 'p-8'} ${className || ''}`}>
            <div 
                className={`${sizeClass} ${borderClass} border-pink-500 border-t-transparent rounded-full animate-spin`}
                style={sizeStyle}
            ></div>
            {!shouldHideText && (
                <p className="mt-4 text-pink-400 font-medium animate-pulse">Generating your model...</p>
            )}
        </div>
    );
};