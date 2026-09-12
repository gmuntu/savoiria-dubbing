import torch
import torchaudio
import soundfile as sf

# Patch nécessaire : torchaudio.load() peut échouer sur certains fichiers WAV
# (notamment ceux générés par F5-TTS ou FFmpeg) à cause de backends audio
# incompatibles. Ce patch utilise soundfile comme backend de remplacement
# pour garantir la compatibilité sur toutes les plateformes.
def patched_torchaudio_load(filepath, *args, **kwargs):
    data, samplerate = sf.read(filepath, always_2d=True)
    tensor = torch.tensor(data.T, dtype=torch.float32)
    return tensor, samplerate

torchaudio.load = patched_torchaudio_load

import ffmpeg
import os
import re
import subprocess
import yt_dlp
import ollama
from f5_tts.api import F5TTS

def parse_srt(srt_path):
    """Parse un fichier SRT et retourne une liste de segments (start, end, text)."""
    with open(srt_path, 'r', encoding='utf-8') as f:
        content = f.read()

    segments = []
    # Pattern SRT : index, timecodes, texte
    pattern = re.compile(
        r'\d+\s*\n'
        r'(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*'
        r'(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*\n'
        r'((?:(?!\d+\s*\n\d{2}:\d{2}).+\n?)+)',
        re.MULTILINE
    )

    for match in pattern.finditer(content):
        h1, m1, s1, ms1 = int(match.group(1)), int(match.group(2)), int(match.group(3)), int(match.group(4))
        h2, m2, s2, ms2 = int(match.group(5)), int(match.group(6)), int(match.group(7)), int(match.group(8))

        start = h1 * 3600 + m1 * 60 + s1 + ms1 / 1000
        end = h2 * 3600 + m2 * 60 + s2 + ms2 / 1000
        text = match.group(9).replace('\n', ' ').strip()

        if text:
            segments.append((start, end, text))

    return segments

def get_optimal_device():
    if torch.backends.mps.is_available():
        print("Accélération matérielle activée : Apple Silicon (MPS)")
        return torch.device("mps")
    elif torch.cuda.is_available():
        print("Accélération matérielle activée : CUDA (GPU)")
        return torch.device("cuda")
    else:
        print("Avertissement : Aucun GPU disponible. Utilisation du CPU.")
        return torch.device("cpu")

def extract_audio(video_path, audio_path):
    print("Extraction de l'audio en cours...")
    try:
        (
            ffmpeg
            .input(video_path)
            .output(audio_path, acodec='pcm_s16le', ac=1, ar='16k')
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
        print("Extraction terminée.")
    except ffmpeg.Error as e:
        print('Erreur FFmpeg:', e.stderr.decode('utf8'))
        raise

def download_youtube_video(url, output_path):
    print(f"Téléchargement de la vidéo YouTube : {url} ...")
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': output_path,
        'quiet': False
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
    print("Téléchargement YouTube terminé !")

def translate_to_french(text, engine="gemini", gemini_api_key=None, model="gemini-2.5-flash"):
    system_prompt = (
        "Tu es un traducteur expert spécialisé dans le doublage vidéo (YouTube, documentaires, tutoriels tech).\n"
        "\n"
        "Règles strictes :\n"
        "1. CONTEXTE & SENS : Traduis avec précision en tenant compte du contexte général. "
        "Exemple : 'trunks' pour des éléphants = 'trompes'.\n"
        "2. STYLE NATUREL : Utilise un français oral fluide et authentique, idéal pour être prononcé à voix haute.\n"
        "3. RYTHME & SYNCHRONISATION : La traduction doit avoir un débit et une durée équivalents à la phrase originale pour le doublage.\n"
        "4. FORMAT : Renvoie UNIQUEMENT la traduction en français. Aucun guillemet, aucune balise, aucune introduction ou commentaire."
    )

    # 1. Tentative avec Gemini si demandé
    if engine == "gemini":
        api_key = gemini_api_key or os.environ.get("GEMINI_API_KEY")
        if api_key:
            try:
                print(f"⏳ [Gemini] Envoi de la requête au modèle {model}...")
                from google import genai
                from google.genai import types
                client = genai.Client(api_key=api_key)
                response = client.models.generate_content(
                    model=model,
                    contents=text,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.3,
                    )
                )
                if response and response.text:
                    translated = response.text.strip()
                    translated = translated.strip('"\'«»')
                    print(f"✅ [Gemini] Traduction reçue : \"{translated}\"")
                    return translated
            except Exception as e:
                print(f"⚠️ [Gemini] Erreur ({e}), bascule automatique vers Ollama...")
        else:
            print("ℹ️ [Gemini] Aucune clé API détectée. Bascule sur Ollama local...")

    # 2. Utilisation ou Fallback vers Ollama local
    print("⏳ [Ollama] Envoi de la requête au modèle gemma4:e2b...")
    try:
        response = ollama.chat(model='gemma4:e2b', messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': text}
        ])
        translated = response['message']['content'].strip()
        translated = translated.strip('"\'«»')
        print(f"✅ [Ollama] Traduction reçue : \"{translated}\"")
        return translated
    except Exception as e:
        print(f"❌ [Ollama] Erreur de connexion ou de modèle : {e}")
        return text

def extract_reference_audio(input_audio, output_ref, start_time="00:00:01", duration=10):
    print(f"Extraction de la voix de référence ({duration} secondes)...")
    try:
        (
            ffmpeg
            .input(input_audio, ss=start_time)
            .output(output_ref, t=duration, acodec='pcm_s16le', ac=1, ar='24k')
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
        print("Voix de référence prête !")
    except ffmpeg.Error as e:
        print('Erreur FFmpeg (référence):', e.stderr.decode('utf8'))
        raise

_f5_model = None

def get_f5_model(device=None):
    """Charge le modèle F5-TTS en utilisant le device spécifié (ou auto-détection)."""
    global _f5_model
    if _f5_model is None:
        if device is None:
            device = get_optimal_device()
        device_str = str(device)
        print(f"Chargement du modèle de clonage vocal F5-TTS (sur {device_str})...")
        _f5_model = F5TTS(model="F5TTS_Base", device=device_str)
    return _f5_model

def synthesize_speech(ref_audio_path, ref_text, gen_text, output_path, device=None):
    """Synthétise la parole clonée en utilisant F5-TTS."""
    f5 = get_f5_model(device)
    print(f"🎙️ [F5-TTS] Génération audio vers {output_path}...")
    try:
        wav, sample_rate, _ = f5.infer(
            ref_file=ref_audio_path,
            ref_text=ref_text,
            gen_text=gen_text,
            nfe_step=32
        )
        sf.write(output_path, wav, sample_rate)
        print("✅ [F5-TTS] Fichier audio généré et sauvegardé avec succès !")
        return True
    except Exception as e:
        print(f"❌ [F5-TTS] Erreur lors du clonage vocal : {e}")
        return False

def assemble_final_video(video_input, segments_data, final_output_path):
    """Assemble les segments audio aux minutages exacts et les fusionne avec la vidéo."""
    print("\n🎬 Assemblage final de la vidéo doublée...")
    try:
        # Construction de la commande FFmpeg via subprocess pour un contrôle total
        # sur le filter_complex et les mappings
        cmd = ['ffmpeg', '-y', '-i', video_input]

        # Ajouter chaque segment audio comme input
        for seg_path, _ in segments_data:
            cmd.extend(['-i', seg_path])

        # Construire le filter_complex :
        # Chaque segment est retardé (adelay) pour correspondre à son minutage,
        # puis tous sont mixés ensemble avec amix.
        filter_parts = []
        for i, (_, start_sec) in enumerate(segments_data):
            delay_ms = int(start_sec * 1000)
            filter_parts.append(f"[{i + 1}:a]adelay={delay_ms}|{delay_ms}[a{i}]")

        mix_inputs = "".join([f"[a{i}]" for i in range(len(segments_data))])
        filter_parts.append(f"{mix_inputs}amix=inputs={len(segments_data)}:normalize=0[outa]")

        filter_string = ";".join(filter_parts)

        cmd.extend([
            '-filter_complex', filter_string,
            '-map', '0:v',
            '-map', '[outa]',
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-b:a', '192k',
            final_output_path
        ])

        print(f"Commande FFmpeg : {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            print("❌ Erreur FFmpeg détaillée :")
            print(result.stderr)
            raise RuntimeError(f"FFmpeg a échoué avec le code {result.returncode}")

        print(f"✅ Vidéo finale générée avec succès : {final_output_path}")
    except subprocess.SubprocessError as e:
        print(f"❌ Erreur lors de l'exécution de FFmpeg : {e}")
        raise