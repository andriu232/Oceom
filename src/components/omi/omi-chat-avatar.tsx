import Image from "next/image";
import { cn } from "@/lib/utils";

/** Avatar circular de OMI para los mensajes del chat: el rostro de Valeria IA
 *  con glow y anillo cian, coherente con el hero. Reemplazable en
 *  /public/omi/omi-avatar-chat.png. */
export function OmiChatAvatar({ className }: { className?: string }) {
  return (
    <div className={cn("relative shrink-0", className)}>
      {/* Glow que respira */}
      <div
        aria-hidden
        className="absolute -inset-1 rounded-full opacity-70 blur-[6px] [animation:pulse-glow_5s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{
          background: "radial-gradient(circle, rgba(34,211,238,0.5), transparent 70%)",
        }}
      />
      {/* Mini-halo en rotación lenta */}
      <div
        aria-hidden
        className="absolute -inset-0.5 rounded-full border border-ocean-cyan/40 [animation:spin-slow_18s_linear_infinite] motion-reduce:animate-none"
      />
      <div className="relative size-full overflow-hidden rounded-full shadow-[0_0_12px_-2px_rgba(34,211,238,0.7)] ring-1 ring-inset ring-ocean-cyan/50">
        <Image
          src="/omi/omi-avatar-chat.png"
          alt=""
          fill
          sizes="40px"
          className="object-cover"
        />
      </div>
    </div>
  );
}
