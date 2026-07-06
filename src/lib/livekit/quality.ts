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
 * Códec de video. VP9 (SVC) da la mejor calidad por bit y, junto con dynacast,
 * es ideal para 1→N. `backupCodec` (por defecto) publica una pista VP8 de respaldo
 * para el navegador raro que no soporte VP9, así nadie se queda sin ver.
 * Si algún día aparecen problemas de compatibilidad/CPU, poné "h264".
 */
const VIDEO_CODEC = "vp9" as const;

const AUDIO_BY_PROFILE: Record<
  AudioProfile,
  { capture: RoomOptions["audioCaptureDefaults"]; publish: Partial<NonNullable<RoomOptions["publishDefaults"]>> }
> = {
  conference: {
    capture: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
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
    backupCodec: true,
    // Bitrate/encoding de la capa principal de cámara en 1080p.
    videoEncoding: VideoPresets.h1080.encoding,
    // Al compartir pantalla: 1080p a 30 fps + una capa baja para redes lentas.
    screenShareEncoding: ScreenSharePresets.h1080fps30.encoding,
    screenShareSimulcastLayers: [ScreenSharePresets.h360fps15],
    // Ante congestión, degrada de forma equilibrada (ni solo fps ni solo nitidez).
    degradationPreference: "balanced",
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
