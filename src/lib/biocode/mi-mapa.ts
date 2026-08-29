import "server-only";
import { createClient } from "@/lib/supabase/server";
import { DIMENSIONES, type Mapa, type MapaNodo } from "./dimensiones";

/* ============================================================
   "MI MAPA BIOCODE" (§16) y el historial (§21).

   El mapa acumulado no se guarda aparte: se arma sumando lo que la persona
   fue eligiendo en cada exploración. Así nunca se desincroniza de lo que
   realmente pasó, y borrar una exploración la borra también del mapa — que
   es lo que exige el §26.
   ============================================================ */

export interface Exploracion {
  id: string;
  numero: number | null;
  tema: string | null;
  titulo: string;
  estado: string;
  creada: string;
  mapa: Mapa;
  ficha: {
    zona?: string;
    emocion?: string;
    creencia?: string;
    patron?: string;
    pregunta?: string;
    reflexion?: string;
    ejercicio?: string;
  } | null;
}

export interface TemaRepetido {
  texto: string;
  veces: number;
}

export interface MiMapa {
  exploraciones: Exploracion[];
  /** Lo que se repite, por dimensión y ordenado por frecuencia. */
  porDimension: { key: string; label: string; color: string; temas: TemaRepetido[] }[];
  total: number;
  /** La base todavía no tiene las columnas de la migración 0030. */
  faltaMigracion: boolean;
}

const VACIO: MiMapa = {
  exploraciones: [],
  porDimension: [],
  total: 0,
  faltaMigracion: false,
};

export async function getMiMapa(): Promise<MiMapa> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return VACIO;

  const { data, error } = await supabase
    .from("biocode_sessions")
    .select("id,numero,tema,title,estado,created_at,mapa,ficha")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    // 42703 = la columna no existe: la 0030 aún no se aplicó. Se dice en
    // pantalla en vez de fingir que la persona no tiene exploraciones.
    const faltaMigracion = error.code === "42703";
    if (!faltaMigracion) console.error("[biocode] mi mapa", error.message);
    return { ...VACIO, faltaMigracion };
  }

  const exploraciones: Exploracion[] = (data ?? []).map((s) => ({
    id: s.id as string,
    numero: (s.numero as number | null) ?? null,
    tema: (s.tema as string | null) ?? null,
    titulo: (s.title as string) ?? "Exploración",
    estado: (s.estado as string) ?? "abierta",
    creada: s.created_at as string,
    mapa: ((s.mapa as Mapa | null) ?? { nodos: [], aristas: [] }) as Mapa,
    ficha: (s.ficha as Exploracion["ficha"]) ?? null,
  }));

  // Cuenta cuántas veces aparece cada cosa a lo largo del tiempo.
  const cuenta = new Map<string, Map<string, number>>();
  for (const e of exploraciones) {
    for (const n of e.mapa.nodos as MapaNodo[]) {
      const porTema = cuenta.get(n.dimension) ?? new Map<string, number>();
      porTema.set(n.texto, (porTema.get(n.texto) ?? 0) + 1);
      cuenta.set(n.dimension, porTema);
    }
  }

  const porDimension = DIMENSIONES.filter((d) => cuenta.has(d.key)).map((d) => ({
    key: d.key,
    label: d.label,
    color: d.color,
    temas: [...(cuenta.get(d.key) ?? new Map())]
      .map(([texto, veces]) => ({ texto, veces }))
      .sort((a, b) => b.veces - a.veces || a.texto.localeCompare(b.texto)),
  }));

  return {
    exploraciones,
    porDimension,
    total: exploraciones.length,
    faltaMigracion: false,
  };
}
