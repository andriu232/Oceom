import Image from "next/image";
import { cn } from "@/lib/utils";

/** Avatar circular de OMI para los mensajes del chat: el rostro de Valeria con
 *  borde y glow cian, coherente con el header. Reemplazable en
 *  /public/omi/valeria-ai-chat-avatar.jpg. */
export function OmiChatAvatar({ className }: { className?: string }) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        aria-hidden
        className="absolute -inset-0.5 rounded-full bg-ocean-cyan/25 blur-[5px] [animation:pulse-glow_5s_ease-in-out_infinite] motion-reduce:animate-none"
      />
      <div className="relative size-full overflow-hidden rounded-full shadow-[0_0_12px_-2px_rgba(34,211,238,0.7)] ring-1 ring-inset ring-ocean-cyan/50">
        <Image
          src="/omi/valeria-ai-chat-avatar.jpg"
          alt=""
          fill
          sizes="40px"
          className="object-cover"
        />
      </div>
    </div>
  );
}
