"use client";

import { useState, useEffect } from "react";

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  orientation: "portrait" | "landscape";
  width: number;
  height: number;
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === "undefined") {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        hasTouch: false,
        orientation: "landscape",
        width: 1280,
        height: 800,
      };
    }
    const width = window.innerWidth;
    const height = window.innerHeight;
    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width <= 1024,
      isDesktop: width > 1024,
      hasTouch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
      orientation: height > width ? "portrait" : "landscape",
      width,
      height,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setState({
        isMobile: width < 768,
        isTablet: width >= 768 && width <= 1024,
        isDesktop: width > 1024,
        hasTouch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
        orientation: height > width ? "portrait" : "landscape",
        width,
        height,
      });
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return state;
}
