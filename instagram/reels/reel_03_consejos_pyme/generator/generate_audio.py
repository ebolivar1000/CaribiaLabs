import asyncio
import edge_tts
import json
import os
import subprocess

SCRIPT_TEXT = """Si tienes un negocio y sigues haciendo estas tres cosas a mano, estás perdiendo diez horas a la semana:
Reenviar presupuestos en PDF, confirmar transferencias una a una y anotar turnos en papel.
En CaribIA Labs automatizamos todo tu flujo con la entrega personalizada más rápida del mercado.
Comenta AUTO o entra al link de la bio."""

OUTPUT_DIR = r"D:\ProyectosIA\caribia-labs-site\instagram\reels\reel_03_consejos_pyme\audio"
RAW_MP3 = os.path.join(OUTPUT_DIR, "raw_voice.mp3")
MASTER_WAV = os.path.join(OUTPUT_DIR, "master_voice.wav")
TIMESTAMPS_JSON = os.path.join(OUTPUT_DIR, "acoustic_timestamps.json")

os.makedirs(OUTPUT_DIR, exist_ok=True)

async def generate():
    print("Generating neural voice with edge-tts (es-MX-JorgeNeural)...")
    communicate = edge_tts.Communicate(SCRIPT_TEXT, voice="es-MX-JorgeNeural", rate="+10%", pitch="+0Hz")
    
    boundaries = []
    with open(RAW_MP3, "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "SentenceBoundary":
                # offset and duration in 100ns ticks -> convert to milliseconds
                offset_ms = round(chunk["offset"] / 10000, 2)
                duration_ms = round(chunk["duration"] / 10000, 2)
                boundaries.append({
                    "text": chunk["text"],
                    "offset_ms": offset_ms,
                    "duration_ms": duration_ms,
                    "start_sec": round(offset_ms / 1000, 2),
                    "end_sec": round((offset_ms + duration_ms) / 1000, 2)
                })

    print(f"Generated raw MP3. Extracted {len(boundaries)} sentence boundaries.")
    with open(TIMESTAMPS_JSON, "w", encoding="utf-8") as jf:
        json.dump(boundaries, jf, indent=2, ensure_ascii=False)

    # Convert to 48kHz WAV with ffmpeg and normalize gain to -1 dBFS
    print("Normalizing voice to -1 dBFS WAV...")
    cmd = [
        "ffmpeg", "-y", "-i", RAW_MP3,
        "-af", "loudnorm=I=-16:TP=-1.0:LRA=7",
        "-ar", "48000", "-ac", "2",
        MASTER_WAV
    ]
    subprocess.run(cmd, check=True)
    print("Master voice created at:", MASTER_WAV)

if __name__ == "__main__":
    asyncio.run(generate())
