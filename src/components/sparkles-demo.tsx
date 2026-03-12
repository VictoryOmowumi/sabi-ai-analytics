"use client";
import React from "react";
import { SparklesCore } from "@/components/ui/sparkles";

export default function SparklesPreview() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
      <h1 className="relative z-20 px-3 text-center text-2xl font-bold text-foreground md:text-5xl">
        SABI AI Analytics
      </h1>
      <div className="relative h-24 w-full max-w-2xl">
        {/* Gradients */}
        <div className="absolute inset-x-10 top-0 h-[2px] w-3/4 bg-gradient-to-r from-transparent via-sky-500 to-transparent blur-sm" />
        <div className="absolute inset-x-10 top-0 h-px w-3/4 bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
        <div className="absolute inset-x-28 top-0 h-[5px] w-1/3 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-sm" />
        <div className="absolute inset-x-28 top-0 h-px w-1/3 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Core component */}
        <SparklesCore
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={900}
          className="w-full h-full"
          particleColor="#E5F4FF"
        />

        {/* Radial Gradient to prevent sharp edges */}
        <div className="absolute inset-0 h-full w-full bg-background [mask-image:radial-gradient(260px_120px_at_top,transparent_20%,white)]" />
      </div>
    </div>
  );
}
