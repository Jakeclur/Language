import { createContext, useContext } from "react";
import type { AppData } from "./data";

export const DataCtx = createContext<AppData | null>(null);
export function useData(): AppData {
  const d = useContext(DataCtx);
  if (!d) throw new Error("data not loaded");
  return d;
}
