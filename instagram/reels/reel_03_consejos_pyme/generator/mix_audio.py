import os
import subprocess
import json

AUDIO_DIR = r"D:\ProyectosIA\caribia-labs-site\instagram\reels\reel_03_consejos_pyme\audio"
VOICE = os.path.join(AUDIO_DIR, "master_voice.wav")
MUSIC = os.path.join(AUDIO_DIR, "music_bed.wav")
GLITCH = os.path.join(AUDIO_DIR, "sfx_glitch.wav")
CASH = os.path.join(AUDIO_DIR, "sfx_cash_short.wav")
OUTPUT_MASTER = os.path.join(AUDIO_DIR, "master_audio.wav")
OUTPUT_MP3 = os.path.join(AUDIO_DIR, "master_audio.mp3")

# We want exactly 15.0 seconds
TOTAL_DURATION = 15.0

# Glitch at transition (7.83s -> 7830 ms)
# Cash at CaribIA punch (11.8s -> 11800 ms)

filter_complex = (
    # Music: loop, trim to 15s, volume -18dB, fadeout last 1s
    "[1:a]aloop=loop=-1:size=2e+09,atrim=0:15.0,asetpts=PTS-STARTPTS,volume=-18dB,afade=t=out:st=14.0:d=1.0[music];"
    # SFX Glitch delayed 7830ms, volume -4dB
    "[2:a]adelay=7830|7830,volume=-4dB[glitch];"
    # SFX Cash delayed 11800ms, volume -3dB
    "[3:a]adelay=11800|11800,volume=-3dB[cash];"
    # Voice trimmed to 15s, volume 0dB (already loudnormed)
    "[0:a]atrim=0:15.0,asetpts=PTS-STARTPTS,volume=0dB[voice];"
    # Mix all together
    "[voice][music][glitch][cash]amix=inputs=4:duration=first:dropout_transition=2,volume=1.0[out]"
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
    OUTPUT_MASTER
]

print("Mixing master audio with FFmpeg...")
subprocess.run(cmd, check=True)

# Also create MP3 version
cmd_mp3 = [
    "ffmpeg", "-y",
    "-i", OUTPUT_MASTER,
    "-b:a", "320k",
    OUTPUT_MP3
]
subprocess.run(cmd_mp3, check=True)
print("Master mixed audio created successfully at:", OUTPUT_MASTER)
