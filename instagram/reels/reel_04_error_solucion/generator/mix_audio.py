import os
import subprocess

AUDIO_DIR = r"D:\ProyectosIA\caribia-labs-site\instagram\reels\reel_04_error_solucion\audio"
VOICE = os.path.join(AUDIO_DIR, "master_voice.wav")
MUSIC = os.path.join(AUDIO_DIR, "music_bed.wav")
GLITCH = os.path.join(AUDIO_DIR, "sfx_glitch.wav")
CASH = os.path.join(AUDIO_DIR, "sfx_cash_short.wav")
OUTPUT_MASTER_WAV = os.path.join(AUDIO_DIR, "master_audio.wav")
OUTPUT_MASTER_MP3 = os.path.join(AUDIO_DIR, "master_audio.mp3")

TOTAL_DURATION = 12.0

# SOP v2 Mix Architecture:
# - Voice: -1.0 dBFS Peak (protagonist, normalized with loudnorm)
# - Music bed: loop if needed, trim to 12s, volume -19dB, fadeout at 11s
# - Glitch SFX: at frame 113 (4520 ms) transition, volume -6dB
# - Cash SFX: at frame 180 (7200 ms) feature highlight, volume -6dB
filter_complex = (
    # Music: loop, trim to 12.0s, volume -19dB, fade out last 1s
    "[1:a]aloop=loop=-1:size=2e+09,atrim=0:12.0,asetpts=PTS-STARTPTS,volume=-19dB,afade=t=out:st=11.0:d=1.0[music];"
    # SFX Glitch delayed 4520ms, volume -6dB
    "[2:a]adelay=4520|4520,volume=-6dB[glitch];"
    # SFX Cash delayed 7200ms, volume -6dB
    "[3:a]adelay=7200|7200,volume=-6dB[cash];"
    # Voice trimmed to 12.0s, volume 0dB (already loudnormed at -1 dBFS)
    "[0:a]atrim=0:12.0,asetpts=PTS-STARTPTS,volume=0dB[voice];"
    # Mix all 4 inputs
    "[voice][music][glitch][cash]amix=inputs=4:duration=longest:dropout_transition=0,volume=1.0[out]"
)

cmd = [
    "ffmpeg", "-y",
    "-i", VOICE,
    "-i", MUSIC,
    "-i", GLITCH,
    "-i", CASH,
    "-filter_complex", filter_complex,
    "-map", "[out]",
    "-t", str(TOTAL_DURATION),
    "-ar", "48000",
    "-ac", "2",
    OUTPUT_MASTER_WAV
]

print("Mezclando Master Audio con FFmpeg (SOP v2 Gain Staging)...")
subprocess.run(cmd, check=True)

# Also create 320kbps MP3
cmd_mp3 = [
    "ffmpeg", "-y",
    "-i", OUTPUT_MASTER_WAV,
    "-b:a", "320k",
    OUTPUT_MASTER_MP3
]
subprocess.run(cmd_mp3, check=True)
print("Master Audio WAV creado exitosamente:", OUTPUT_MASTER_WAV)
print("Master Audio MP3 creado exitosamente:", OUTPUT_MASTER_MP3)
