import { useEffect, useState } from "react";

// Hash routes are plain names like #dictionary or #lesson-a1-02-1 (works on any static host).
export function useRoute(): string {
  const [route, setRoute] = useState(() => location.hash.slice(1));
  useEffect(() => {
    const on = () => {
      setRoute(location.hash.slice(1));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

export const go = (route: string) => {
  location.hash = route;
};
