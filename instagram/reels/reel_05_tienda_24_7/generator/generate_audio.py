import asyncio
import edge_tts
import json
import os
import subprocess

SCRIPT_REEL5 = """Tu local cierra a las ocho, pero tus clientes siguen comprando.
Con CaribIA Labs tu catálogo vende y cobra por Mercado Pago veinticuatro siete.
La entrega más rápida del mercado: tu tienda lista en tres días.
Comenta TIENDA o entra al link de la bio."""

OUTPUT_DIR = r"D:\ProyectosIA\caribia-labs-site\instagram\reels\reel_05_tienda_24_7\audio"
RAW_MP3 = os.path.join(OUTPUT_DIR, "raw_voice.mp3")
MASTER_WAV = os.path.join(OUTPUT_DIR, "master_voice.wav")
TIMESTAMPS_JSON = os.path.join(OUTPUT_DIR, "acoustic_timestamps.json")

os.makedirs(OUTPUT_DIR, exist_ok=True)

async def generate():
    communicate = edge_tts.Communicate(SCRIPT_REEL5, voice="es-MX-JorgeNeural", rate="+24%")
    boundaries = []
    with open(RAW_MP3, "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "SentenceBoundary":
                offset_ms = round(chunk["offset"] / 10000, 2)
                duration_ms = round(chunk["duration"] / 10000, 2)
                boundaries.append({
                    "text": chunk["text"],
                    "offset_ms": offset_ms,
                    "duration_ms": duration_ms,
                    "start_sec": round(offset_ms / 1000, 2),
                    "end_sec": round((offset_ms + duration_ms) / 1000, 2)
                })

    print(f"Total sentences: {len(boundaries)}")
    for b in boundaries:
        print(f"[{b['start_sec']}s -> {b['end_sec']}s] ({round(b['duration_ms']/1000, 2)}s): {b['text']}")
    total_sec = boundaries[-1]['end_sec'] if boundaries else 0
    print(f"===> TOTAL DURATION: {total_sec} SECONDS")
    with open(TIMESTAMPS_JSON, "w", encoding="utf-8") as jf:
        json.dump(boundaries, jf, indent=2, ensure_ascii=False)

    # Normalize to -1 dBFS WAV
    cmd = [
        "ffmpeg", "-y", "-i", RAW_MP3,
        "-af", "loudnorm=I=-16:TP=-1.0:LRA=7",
        "-ar", "48000", "-ac", "2",
        MASTER_WAV
    ]
    subprocess.run(cmd, check=True)
    print("Master voice created successfully!")

if __name__ == "__main__":
    asyncio.run(generate())
