"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function ScrollRestorer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `scroll:${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    const saved = sessionStorage.getItem(key);
    if (saved) {
      // instant para que no se vea el salto
      window.scrollTo({ top: parseInt(saved, 10), behavior: "instant" });
    }

    let raf: ReturnType<typeof requestAnimationFrame>;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        sessionStorage.setItem(key, String(Math.round(window.scrollY)));
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [key]);

  return null;
}
