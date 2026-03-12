"use client";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";

export default function CanvasRevealEffectDemo3() {
  return (
    <div className="group relative mx-auto flex h-[16rem] w-full items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-black px-6">
      <div className="absolute inset-0 opacity-70 transition-opacity duration-300 group-hover:opacity-100">
        <CanvasRevealEffect
          animationSpeed={5}
          containerClassName="bg-transparent"
          colors={[
            [59, 130, 246],
            [56, 189, 248],
          ]}
          opacities={[0.2, 0.2, 0.2, 0.2, 0.2, 0.4, 0.4, 0.4, 0.4, 1]}
          dotSize={2}
        />
      </div>

      <p className="relative z-20 mx-auto max-w-2xl text-center text-xl font-medium text-white md:text-2xl">
        SABI AI Analytics
        <br />
        <span className="text-sm text-white/80 md:text-base">
          Ask anything about your data.
        </span>
      </p>

      {/* Radial gradient for the cute fade */}
      <div className="absolute inset-0 bg-black/50 [mask-image:radial-gradient(360px_at_center,white,transparent)]" />
    </div>
  );
}
