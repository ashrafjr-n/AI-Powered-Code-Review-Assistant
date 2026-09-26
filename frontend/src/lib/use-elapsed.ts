"use client";

import { useEffect, useState } from "react";

/** Whole seconds since `running` became true; 0 when not running. For "Reviewing… 23s". */
export function useElapsed(running: boolean): number {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const started = Date.now();
    const timer = setInterval(
      () => setSeconds(Math.floor((Date.now() - started) / 1000)),
      1000,
    );
    return () => {
      clearInterval(timer);
      setSeconds(0);
    };
  }, [running]);
  return running ? seconds : 0;
}

/** "Reviewing…" → "Reviewing… 23s" once the first second has passed. */
export function withElapsed(label: string, seconds: number): string {
  return seconds > 0 ? `${label} ${seconds}s` : label;
}
