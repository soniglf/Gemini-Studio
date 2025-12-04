
import React from 'react';

export const SoniNewMediaLogo = ({ className }: { className?: string }) => (
    <img 
        src="SoniNewMedia.png"
        alt="Soni New Media"
        className={className}
        style={{ 
            filter: 'brightness(0) invert(1)', // Ensures logo is white on dark background
            display: 'block',
            objectFit: 'contain'
        }}
        draggable={false}
    />
);
