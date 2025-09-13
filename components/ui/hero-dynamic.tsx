"use client";

import { useState, useEffect } from "react";
import { HeroStatic } from "./hero-static";
import dynamic from "next/dynamic";

// Dynamically import the heavy animated component
const HeroGeometric = dynamic(
  () => import("./shape-landing-hero").then((mod) => ({ default: mod.HeroGeometric })),
  {
    ssr: false, // Don't render on server
    loading: () => null, // No loading state, show static version
  }
);

interface HeroProps {
  badge?: string;
  title1?: string;
  title2?: string;
}

export function HeroDynamic(props: HeroProps) {
  const [showAnimated, setShowAnimated] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Only load animated version after initial render and user interaction
    const timer = setTimeout(() => {
      // Check if user prefers reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (!prefersReducedMotion) {
        setShowAnimated(true);
      }
    }, 1000); // Delay to ensure LCP is measured first

    return () => clearTimeout(timer);
  }, []);

  // Always show static version on server and initially on client
  if (!isClient || !showAnimated) {
    return <HeroStatic {...props} />;
  }

  // Show animated version only after delay and if motion is preferred
  return <HeroGeometric {...props} />;
}