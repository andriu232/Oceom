"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

/* ============================================================
   Tema OCEOM: oscuro (por defecto) ↔ claro. El valor real lo pone
   un script anti-parpadeo en <body> (lee localStorage) ANTES de
   pintar; aquí solo sincronizamos el estado de React para que los
   componentes que dependen del tema (backdrops) reaccionen.
   ============================================================ */

type Theme = "dark" | "light";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}>({ theme: "dark", toggle: () => {}, setTheme: () => {} });

function readStored(): Theme {
  try {
    const s = localStorage.getItem("oceom-theme");
    if (s === "light" || s === "dark") return s;
  } catch {
    /* almacenamiento bloqueado */
  }
  return "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof document !== "undefined"
      ? ((document.documentElement.dataset.theme as Theme) || "dark")
      : "dark",
  );

  // CRÍTICO: React BORRA el data-theme que puso el script anti-parpadeo al
  // hidratar <html> (no está en su JSX). Aquí lo RE-ESCRIBIMOS desde
  // localStorage tras montar, para que el tema quede realmente aplicado.
  useEffect(() => {
    const t = readStored();
    document.documentElement.dataset.theme = t;
    setThemeState(t);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem("oceom-theme", t);
    } catch {
      /* almacenamiento bloqueado: el tema vive solo en esta sesión */
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(
      document.documentElement.dataset.theme === "light" ? "dark" : "light",
    );
  }, [setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
