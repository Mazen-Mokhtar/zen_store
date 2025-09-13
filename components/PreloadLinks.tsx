'use client';

import { useEffect } from 'react';

export default function PreloadLinks() {
  useEffect(() => {
    // Handle CSS preload
    const cssLink = document.querySelector('link[href="/globals.css"]') as HTMLLinkElement;
    if (cssLink && cssLink.rel === 'preload') {
      const handleCSSLoad = () => {
        cssLink.rel = 'stylesheet';
        cssLink.removeEventListener('load', handleCSSLoad);
      };
      cssLink.addEventListener('load', handleCSSLoad);
    }

    // Handle font preload
    const fontLink = document.querySelector('link[href*="fonts.googleapis.com"]') as HTMLLinkElement;
    if (fontLink && fontLink.rel === 'preload') {
      const handleFontLoad = () => {
        fontLink.rel = 'stylesheet';
        fontLink.removeEventListener('load', handleFontLoad);
      };
      fontLink.addEventListener('load', handleFontLoad);
    }
  }, []);

  return (
    <>
      {/* Preload non-critical CSS */}
      <link 
        rel="preload" 
        href="/globals.css" 
        as="style" 
      />
      <noscript><link rel="stylesheet" href="/globals.css" /></noscript>
      
      {/* Optimize font loading */}
      <link
        rel="preload"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        as="style"
      />
      <noscript>
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" 
        />
      </noscript>
    </>
  );
}