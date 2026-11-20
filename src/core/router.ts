import { useEffect, useState } from "react";

/**
 * Tiny hash router: #/ , #/sport/hockey , #/new/tennis , #/match/<id> , #/history/hockey.
 * Hash routes work from any folder and inside an installed PWA without server config.
 */
export function navigate(path: string): void {
  window.location.hash = path.startsWith("#") ? path : `#${path}`;
  window.scrollTo(0, 0);
}

export function useRoute(): string[] {
  const read = () => window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const [parts, setParts] = useState<string[]>(read);
  useEffect(() => {
    const on = () => setParts(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return parts;
}
