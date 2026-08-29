# Hermes bridge

Puente entre WhatsApp y OCEOM. Sostiene una sesión de WhatsApp con
[Baileys](https://github.com/WhiskeySockets/Baileys) (el mismo protocolo de
WhatsApp Web) y la conecta con la plataforma.

**Este servicio es tonto a propósito.** Solo reenvía. La identidad de quien
escribe, el filtro de seguridad, el modelo y la escritura en la bitácora viven
en OCEOM (`src/lib/hermes/`). Si el bridge se cae no se pierde ni un dato: solo
la conexión. Y si algún día se migra a la Cloud API de Meta, se borra esta
carpeta y no se toca nada más.

```
WhatsApp ──▶ bridge ──▶ POST {OCEOM_URL}/api/hermes/bridge
WhatsApp ◀── bridge ◀── POST {BRIDGE_URL}/send  ◀── OCEOM
```

Los dos sentidos van firmados con HMAC-SHA256 sobre `timestamp.cuerpo` con un
secreto compartido, y se rechaza todo lo que tenga más de 5 minutos. Sin eso,
quien descubriera la URL del bridge podría escribirles a los estudiantes
haciéndose pasar por Hermes.

## ⚠️ Antes de nada

Esto usa la API **no oficial** de WhatsApp. Va contra los términos de servicio
de Meta y **el número se puede banear**. Consecuencias prácticas:

- Usa un **número dedicado** a Hermes, nunca el personal de Valeria ni el de
  atención al cliente. Si lo banean, se pierde ese número.
- El celular donde escanees el QR tiene que **seguir existiendo** (no hace falta
  que esté encendido siempre, pero si borras WhatsApp de ahí, se cae la sesión).
- No lo uses para envíos masivos ni para escribirle a gente que no lo pidió:
  eso es lo que dispara los baneos. Hermes solo escribe a quien vinculó su
  número y dio consentimiento — está construido así a propósito.

## Correr en local

```bash
cp .env.example .env
# rellena HERMES_BRIDGE_SECRET
npm install
npm start
```

Sale un QR en la terminal → celular de Hermes → WhatsApp → **Dispositivos
vinculados → Vincular un dispositivo**. Cuando el log diga `Conectado como …`,
ya está.

Comprobar: `curl localhost:8080/health`

## Desplegar

Necesita un **proceso permanente** y un **volumen persistente** (la sesión de
WhatsApp vive en disco; si se borra, hay que escanear el QR otra vez). No sirve
Vercel ni ningún serverless.

### Railway (lo más rápido)
1. Nuevo proyecto → *Deploy from GitHub repo* → repo `andriu232/Oceom`.
2. **Root Directory: `hermes-bridge`** ← si no, intenta construir el Next.
3. Variables: `HERMES_BRIDGE_SECRET`, `OCEOM_URL`, `AUTH_DIR=/data/auth`.
4. Agregar un **Volume** montado en `/data`.
5. Deploy → mira los logs → escanea el QR.

### Fly.io
`fly launch --no-deploy` dentro de esta carpeta, luego
`fly volumes create hermes_auth --size 1`, monta en `/data`,
`fly secrets set HERMES_BRIDGE_SECRET=… OCEOM_URL=…`, y `fly deploy`.

### VPS con Docker
```bash
docker build -t hermes-bridge .
docker run -d --name hermes-bridge --restart unless-stopped \
  -p 8080:8080 -v hermes_auth:/data \
  -e HERMES_BRIDGE_SECRET=… -e OCEOM_URL=https://oceom.33vertebras.com \
  hermes-bridge
docker logs -f hermes-bridge   # aquí sale el QR
```

Después, en **Vercel → oceom → Environment Variables**:
`HERMES_BRIDGE_URL` (la URL pública del bridge) y `HERMES_BRIDGE_SECRET`
(el mismo valor). Redeploy.

## Endpoints

| Método | Ruta | Para qué |
|---|---|---|
| `GET` | `/health` | Estado del proceso y de la conexión con WhatsApp. Público. |
| `GET` | `/qr?secret=…` | El QR pendiente, si despliegas donde no ves la consola. |
| `POST` | `/send` | Enviar texto. Firmado. Lo llama OCEOM. |

## Qué hace y qué no

- ✅ Chats 1 a 1 de texto.
- ✅ Se reconecta solo, con espera creciente hasta 60 s (reconectar en bucle
  rápido es justo lo que hace que WhatsApp marque el número como abusivo).
- ✅ Ignora grupos, estados, canales y sus propios mensajes (si no, Hermes se
  respondería a sí mismo en bucle).
- ✅ Ignora la sincronización de historial al reconectar (si no, reprocesaría
  días enteros de mensajes viejos).
- ❌ No transcribe notas de voz. OCEOM las reconoce y pide que se lo escriban.
- ❌ No maneja imágenes ni documentos.
- ❌ Si la sesión se cierra desde el teléfono, **no** reintenta: hay que borrar
  la carpeta de auth y volver a escanear. Lo dice claro en el log.

## Cuando algo falla

| Síntoma | Causa casi siempre |
|---|---|
| `/health` dice `esperando-qr` | Nadie ha escaneado, o se borró el volumen. |
| `sesion-cerrada` | Alguien desvinculó el dispositivo desde el celular. |
| OCEOM responde 401 | El secreto no coincide entre Vercel y el bridge. |
| Firma correcta pero 401 | Reloj del contenedor desfasado más de 5 minutos. |
| Hermes no contesta | Mira los logs del bridge Y las funciones de Vercel: el bridge solo reenvía, el fallo suele estar del lado de OCEOM. |
