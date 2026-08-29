import type { Metadata, Viewport } from "next";
import { Sora, Inter } from "next/font/google";
import { RefCapture } from "@/components/referrals/ref-capture";
import { OceomWaterBackground } from "@/components/brand/oceom-water-background";
import { OceomSacredLayer } from "@/components/brand/oceom-sacred-layer";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OCEOM — Donde el océano interior despierta",
  description: "Donde el océano interior despierta. Tecnología emocional para la evolución humana.",
};

export const viewport: Viewport = {
  themeColor: "#03060e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${sora.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        {/* Captura ?ref=XXX de cualquier URL → cookie 30d para asociar el
            referido al registrarse (landing, auth, cualquier entrada). */}
        <RefCapture />
        {/* Fondo de agua de toda la app: las ondas siguen al puntero. Va en el
            layout raíz para que sea una sola escena WebGL compartida por todas
            las rutas, en vez de una por zona. */}
        <OceomWaterBackground />
        {/* Flor de la Vida + estrellas, por encima del agua y por debajo del
            contenido (z-index -9 contra el -10 del agua). */}
        <OceomSacredLayer />
        {children}
      </body>
    </html>
  );
}
