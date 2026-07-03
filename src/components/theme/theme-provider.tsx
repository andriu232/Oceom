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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lee el tema que ya puso el script anti-parpadeo (sincrónico en cliente),
  // así los componentes que dependen del tema (backdrops) aciertan de una.
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof document !== "undefined"
      ? ((document.documentElement.dataset.theme as Theme) || "dark")
      : "dark",
  );

  useEffect(() => {
    const t = (document.documentElement.dataset.theme as Theme) || "dark";
    setThemeState((cur) => (cur === t ? cur : t));
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
