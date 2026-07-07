import type { Metadata, Viewport } from "next";
import { Sora, Inter } from "next/font/google";
import { RefCapture } from "@/components/referrals/ref-capture";
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
        {children}
      </body>
    </html>
  );
}
