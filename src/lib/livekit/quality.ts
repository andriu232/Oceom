import {
  AudioPresets,
  VideoPresets,
  ScreenSharePresets,
  type RoomOptions,
  type RoomConnectOptions,
} from "livekit-client";

/**
 * Configuración de máxima calidad para los Círculos en Vivo (LiveKit).
 *
 * Objetivo: que la transmisión se vea en HD real (1080p) y se escuche perfecto.
 * LiveKit por defecto publica a 720p con audio de 48 kbps mono — aquí subimos
 * captura, códec, bitrate y presets de audio al máximo, y activamos
 * `adaptiveStream` + `dynacast` para que esa calidad NO sature la red de quien
 * mira: cada espectador recibe solo la capa que su pantalla necesita.
 *
 * ── Perfil de audio ──────────────────────────────────────────────────────────
 * Un círculo es una videollamada grupal (varios micrófonos a la vez), así que el
 * default es "conference": cancelación de eco + supresión de ruido + control de
 * ganancia ON (evita el acople/feedback y nivela voces dispares), publicado en
 * alta fidelidad. Para una sesión de sonido/meditación con buen micrófono, cambiá
 * AUDIO_PROFILE a "fidelity" (desactiva el procesado y transmite estéreo 128 kbps).
 */

export type AudioProfile = "conference" | "fidelity";

/** Cambiá a "fidelity" para sesiones de sonido/meditación (mic e interfaz buenos). */
export const AUDIO_PROFILE: AudioProfile = "conference";

/**
 * Códec de video. **H264** para clases en vivo reales: tiene aceleración por
 * hardware casi universal (codificar y decodificar), así que va más fluido, gasta
 * menos batería/CPU en móviles y es compatible con TODO (iOS/Safari, Android,
 * navegadores viejos). Con simulcast (abajo) cada estudiante recibe la capa que su
 * red aguanta. VP9 daría algo más de nitidez por bit, pero su codificación por
 * software puede tirar los fps en equipos modestos → en un aula heterogénea, H264
 * gana en fluidez y estabilidad. Para cambiarlo, poné "vp9".
 */
const VIDEO_CODEC = "h264" as const;

const AUDIO_BY_PROFILE: Record<
  AudioProfile,
  { capture: RoomOptions["audioCaptureDefaults"]; publish: Partial<NonNullable<RoomOptions["publishDefaults"]>> }
> = {
  conference: {
    capture: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000, // full-band: voz nítida sin recorte de agudos
    },
    publish: {
      audioPreset: AudioPresets.musicHighQuality, // 96 kbps, voz cristalina
      dtx: true, // corta el envío en silencios (varios mics → ahorra red)
      red: true, // audio redundante → aguanta pérdida de paquetes
    },
  },
  fidelity: {
    capture: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 2,
    },
    publish: {
      audioPreset: AudioPresets.musicHighQualityStereo, // 128 kbps estéreo
      forceStereo: true,
      dtx: false, // no cortar colas de sonidos/música sostenida
      red: true,
    },
  },
};

const audio = AUDIO_BY_PROFILE[AUDIO_PROFILE];

/**
 * RoomOptions que se pasa a `<LiveKitRoom options={...}>`.
 * Aplica a lo que cada participante publica (cámara/mic/pantalla) y a cómo se
 * gestiona la calidad de lo que recibe.
 */
export const roomOptions: RoomOptions = {
  // Ajusta automáticamente la calidad de cada video suscrito al tamaño real en
  // pantalla (miniaturas → capa baja; spotlight → HD). Clave para que el grid HD
  // no consuma de más.
  adaptiveStream: true,
  // Pausa las capas de video que nadie está viendo → menos CPU y ancho de banda
  // de quien publica, sin perder calidad para quien sí mira.
  dynacast: true,

  // Captura de cámara en 1080p a 30 fps.
  videoCaptureDefaults: {
    resolution: VideoPresets.h1080.resolution,
    frameRate: 30,
  },

  audioCaptureDefaults: audio.capture,

  publishDefaults: {
    videoCodec: VIDEO_CODEC,
    // Capa principal de cámara en 1080p.
    videoEncoding: VideoPresets.h1080.encoding,
    // Simulcast: además de 1080p, publica 540p y 180p. Cada estudiante recibe la
    // capa que su red/pantalla soporta (la elige adaptiveStream) → HD para quien
    // puede, fluido para quien tiene red lenta o mira en miniatura.
    videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h180],
    // Al compartir pantalla: 1080p a 30 fps + una capa baja para redes lentas.
    screenShareEncoding: ScreenSharePresets.h1080fps30.encoding,
    screenShareSimulcastLayers: [ScreenSharePresets.h360fps15],
    // Ante congestión, prioriza mantener los FPS (fluidez) antes que la resolución:
    // en una clase, que no se congele importa más que un instante ultranítido.
    degradationPreference: "maintain-framerate",
    ...audio.publish,
  },
};

/**
 * Opciones de conexión. `autoSubscribe` (default) suscribe a todas las pistas.
 * No forzamos rtcConfig; los defaults de LiveKit ya priorizan la mejor ruta.
 */
export const connectOptions: RoomConnectOptions = {
  autoSubscribe: true,
};
