import asyncio
import edge_tts
import json
import os
import subprocess

VOICE = "es-MX-JorgeNeural"
AUDIO_DIR = r"D:\ProyectosIA\caribia-labs-site\instagram\reels\reel_04_error_solucion\audio"
RAW_MP3_DIR = os.path.join(AUDIO_DIR, "raw_parts")
MASTER_VOICE_WAV = os.path.join(AUDIO_DIR, "master_voice.wav")
TIMESTAMPS_JSON = os.path.join(AUDIO_DIR, "acoustic_timestamps.json")

os.makedirs(RAW_MP3_DIR, exist_ok=True)

# 3 Narrative Acts aligned to video cuts:
# Act 1 (0.0s - 4.52s): Error / Problema (offset: 0.20s)
# Act 2 (4.52s - 9.00s): Solución CaribIA (offset: 4.55s)
# Act 3 (9.00s - 12.00s): Outro / CTA (offset: 9.10s)
SEGMENTS = [
    {
        "id": "act1_error",
        "text": "Cada minuto que tardas en contestar, el cliente se va a la competencia.",
        "rate": "+22%",
        "timeline_offset_ms": 200
    },
    {
        "id": "act2_solucion",
        "text": "Con CaribIA Labs, tu chatbot IA cotiza y cierra ventas en automático.",
        "rate": "+18%",
        "timeline_offset_ms": 4550
    },
    {
        "id": "act3_cta",
        "text": "Comenta ERROR o entra al link de la bio.",
        "rate": "+14%",
        "timeline_offset_ms": 9100
    }
]

async def generate_segment(seg):
    mp3_path = os.path.join(RAW_MP3_DIR, f"{seg['id']}.mp3")
    comm = edge_tts.Communicate(seg["text"], voice=VOICE, rate=seg["rate"])
    
    boundaries = []
    with open(mp3_path, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "SentenceBoundary":
                offset_ms = round(chunk["offset"] / 10000, 2)
                duration_ms = round(chunk["duration"] / 10000, 2)
                master_start_ms = round(seg["timeline_offset_ms"] + offset_ms, 2)
                master_end_ms = round(master_start_ms + duration_ms, 2)
                boundaries.append({
                    "segment_id": seg["id"],
                    "text": chunk["text"],
                    "local_offset_ms": offset_ms,
                    "duration_ms": duration_ms,
                    "master_start_ms": master_start_ms,
                    "master_end_ms": master_end_ms,
                    "master_start_sec": round(master_start_ms / 1000, 2),
                    "master_end_sec": round(master_end_ms / 1000, 2)
                })
    
    wav_path = os.path.join(RAW_MP3_DIR, f"{seg['id']}.wav")
    # Normalize segment to 48kHz stereo
    cmd = [
        "ffmpeg", "-y", "-i", mp3_path,
        "-ar", "48000", "-ac", "2",
        wav_path
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return wav_path, boundaries

async def main():
    print("=== Generando Voz Neuronal con edge-tts (es-MX-JorgeNeural) ===")
    all_boundaries = []
    segment_wavs = []

    for seg in SEGMENTS:
        wav, bounds = await generate_segment(seg)
        segment_wavs.append((wav, seg["timeline_offset_ms"]))
        all_boundaries.extend(bounds)
        print(f"[{seg['id']}] Master Timeline: {bounds[0]['master_start_sec']}s -> {bounds[-1]['master_end_sec']}s")

    # Save exact acoustic timestamps
    with open(TIMESTAMPS_JSON, "w", encoding="utf-8") as f:
        json.dump(all_boundaries, f, indent=2, ensure_ascii=False)
    print(f"Marcas acústicas milimétricas guardadas en: {TIMESTAMPS_JSON}")

    # Assemble master voice track on a 12.0s timeline with exact adelay
    # Inputs: 0: act1, 1: act2, 2: act3
    filter_complex = (
        f"[0:a]adelay={SEGMENTS[0]['timeline_offset_ms']}|{SEGMENTS[0]['timeline_offset_ms']}[v0];"
        f"[1:a]adelay={SEGMENTS[1]['timeline_offset_ms']}|{SEGMENTS[1]['timeline_offset_ms']}[v1];"
        f"[2:a]adelay={SEGMENTS[2]['timeline_offset_ms']}|{SEGMENTS[2]['timeline_offset_ms']}[v2];"
        f"[v0][v1][v2]amix=inputs=3:duration=longest:dropout_transition=0,volume=2.8,"
        f"loudnorm=I=-16:TP=-1.0:LRA=7[out]"
    )

    cmd = [
        "ffmpeg", "-y",
        "-i", segment_wavs[0][0],
        "-i", segment_wavs[1][0],
        "-i", segment_wavs[2][0],
        "-filter_complex", filter_complex,
        "-map", "[out]",
        "-t", "12.0",
        "-ar", "48000",
        "-ac", "2",
        MASTER_VOICE_WAV
    ]
    print("Construyendo master_voice.wav normalizado a -1.0 dBFS Peak...")
    subprocess.run(cmd, check=True)
    print("master_voice.wav generado exitosamente en:", MASTER_VOICE_WAV)

if __name__ == "__main__":
    asyncio.run(main())
