import { redirect } from "next/navigation";

/** "Círculo" se renombró a "Comunidad". Redirige para no romper enlaces viejos. */
export default function CirculoRedirectPage() {
  redirect("/comunidad");
}
