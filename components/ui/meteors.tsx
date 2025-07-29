"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

export const Meteors = ({
  number = 50,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [meteors, setMeteors] = useState<
    { top: number; left: number; delay: number; duration: number }[]
  >([]);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    setDimensions({ width, height });

    const newMeteors = Array.from({ length: number }).map(() => ({
      top: Math.floor(Math.random() * height),
      left: Math.floor(Math.random() * width),
      delay: Math.random() * (0.8 - 0.2) + 0.2,
      duration: Math.floor(Math.random() * (10 - 2) + 2),
    }));
    setMeteors(newMeteors);
  }, [number]);

  if (!dimensions) return null;

  return (
    <>
      {meteors.map((meteor, idx) => (
        <span
          key={"meteor" + idx}
          className={cn(
            "animate-meteor-effect absolute h-0.5 w-0.5 rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]",
            "before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-[#64748b] before:to-transparent",
            className
          )}
          style={{
            top: meteor.top + "px",
            left: meteor.left + "px",
            animationDelay: meteor.delay + "s",
            animationDuration: meteor.duration + "s",
          }}
        ></span>
      ))}
    </>
  );
}; 