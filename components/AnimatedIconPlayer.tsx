"use client";

import { useEffect, useRef, useState } from "react";
import lottie, { type AnimationItem } from "lottie-web";

const animationCache = new Map<string, Promise<unknown>>();

async function loadAnimationData(url: string) {
  const cached = animationCache.get(url);
  if (cached) return cached;

  const promise = fetch(url, { cache: "force-cache" }).then((response) => {
    if (!response.ok) {
      throw new Error(`Could not load animated icon: ${response.status} ${response.statusText}`);
    }
    return response.json();
  });

  animationCache.set(url, promise);
  return promise;
}

type AnimatedIconPlayerProps = {
  src: string;
  className?: string;
  ariaLabel?: string;
  progress?: number;
};

function getLottieFrame(animationData: unknown, progress: number) {
  const data = animationData as { ip?: number; op?: number };
  const startFrame = Number.isFinite(data.ip) ? data.ip ?? 0 : 0;
  const endFrame = Number.isFinite(data.op) ? data.op ?? 0 : 0;
  const totalFrames = Math.max(1, Math.round(endFrame - startFrame));
  const normalized = ((progress % 1) + 1) % 1;
  return startFrame + normalized * Math.max(1, totalFrames - 1);
}

export function AnimatedIconPlayer({ src, className = "", ariaLabel = "", progress }: AnimatedIconPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);
  const animationDataRef = useRef<unknown>(null);
  const progressRef = useRef<number | undefined>(progress);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    let isMounted = true;
    setIsReady(false);

    async function renderAnimation() {
      const container = containerRef.current;
      if (!container) return;

      try {
        const animationData = await loadAnimationData(src);
        if (!isMounted || !containerRef.current) return;

        animationDataRef.current = animationData;
        animationRef.current?.destroy();
        animationRef.current = lottie.loadAnimation({
          container,
          renderer: "svg",
          loop: true,
          autoplay: progress === undefined,
          animationData,
          rendererSettings: {
            preserveAspectRatio: "xMidYMid meet",
          },
        });

        if (typeof progressRef.current === "number") {
          animationRef.current.goToAndStop(getLottieFrame(animationData, progressRef.current), true);
        }
        setIsReady(true);
      } catch {
        // Fall back to an empty container if the animation can't be loaded.
        setIsReady(true);
      }
    }

    void renderAnimation();

    return () => {
      isMounted = false;
      animationRef.current?.destroy();
      animationRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    if (typeof progress !== "number") return;
    const animation = animationRef.current;
    const animationData = animationDataRef.current;
    if (!animation || !animationData) return;
    animation.goToAndStop(getLottieFrame(animationData, progress), true);
  }, [progress]);

  return <div ref={containerRef} className={className} aria-label={ariaLabel} role={ariaLabel ? "img" : undefined} data-lottie-ready={isReady ? "true" : "false"} aria-busy={!isReady} />;
}
