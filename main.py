from utils import (
    get_optimal_device, extract_audio, download_youtube_video, 
    translate_to_french, extract_reference_audio, synthesize_speech,
    assemble_final_video, parse_srt
)
from faster_whisper import WhisperModel
import argparse
import os

def main():
    parser = argparse.ArgumentParser(
        description="🎬 Pipeline de doublage automatique EN → FR"
    )
    parser.add_argument(
        "source",
        nargs="?",
        default="https://www.youtube.com/watch?v=jNQXAC9IVRw",
        help="URL YouTube ou chemin vers un fichier vidéo local"
    )
    parser.add_argument(
        "--srt",
        help="Fichier SRT avec les sous-titres originaux (évite la transcription Whisper)"
    )
    args = parser.parse_args()
    source = args.source

    print(f"Démarrage du pipeline de doublage complet...")
    print(f"Source : {source}")
    if args.srt:
        print(f"Sous-titres : {args.srt}")
    device = get_optimal_device()
    
    # Déterminer si c'est une URL ou un fichier local
    is_url = source.startswith("http")
    
    if is_url:
        video_input = "input/video_source.mp4"
    else:
        # Fichier local : on l'utilise directement
        if not os.path.exists(source):
            print(f"❌ Fichier vidéo introuvable : {source}")
            return
        video_input = source

    audio_temp = "temp/audio.wav"
    ref_audio = "temp/reference_voice.wav" 
    final_output = "output/final_dubbed_video.mp4"
    
    os.makedirs("input", exist_ok=True)
    os.makedirs("temp", exist_ok=True)
    os.makedirs("output", exist_ok=True)

    if is_url:
        if not os.path.exists(video_input):
            try:
                download_youtube_video(source, video_input)
            except Exception as e:
                print(f"❌ Échec du téléchargement YouTube : {e}")
                return
    
    if not os.path.exists(video_input):
        print(f"❌ Fichier vidéo introuvable : {video_input}")
        return

    if not os.path.exists(audio_temp):
        extract_audio(video_input, audio_temp)
        
    if not os.path.exists(ref_audio):
        extract_reference_audio(audio_temp, ref_audio, start_time="00:00:01", duration=10)
    
    # --- Transcription : SRT ou Whisper ---
    if args.srt:
        # Utiliser le fichier SRT fourni
        if not os.path.exists(args.srt):
            print(f"❌ Fichier SRT introuvable : {args.srt}")
            return
        print(f"\n📄 Lecture du fichier SRT : {args.srt}")
        srt_segments = parse_srt(args.srt)
        print(f"   ✅ {len(srt_segments)} segment(s) trouvé(s) dans le SRT")
    else:
        # Transcription automatique avec Whisper
        print("\nChargement du modèle d'écoute (Faster-Whisper)...")
        model = WhisperModel("small", device="cpu", compute_type="int8")
        print("Écoute et transcription en cours...")
        segments, info = model.transcribe(audio_temp, language="en", word_timestamps=True)
        srt_segments = [(seg.start, seg.end, seg.text.strip()) for seg in segments if seg.text.strip()]
        print(f"   ✅ {len(srt_segments)} segment(s) transcrits par Whisper")
    
    print("\n--- Traitement des segments (Traduction & Clonage) ---")
    segments_data = []
    
    for i, (start, end, original_text) in enumerate(srt_segments):
        if not original_text:
            continue
            
        print(f"\n[{start:.2f}s -> {end:.2f}s]")
        print(f"EN : {original_text}")
        
        translated_text = translate_to_french(original_text)
        print(f"FR : {translated_text}")
        
        segment_output = f"output/segment_{i}.wav"
        
        success = synthesize_speech(
            ref_audio_path=ref_audio,
            ref_text=original_text,
            gen_text=translated_text,
            output_path=segment_output,
            device=device
        )
        
        if success:
            segments_data.append((segment_output, start))
            print(f"Fichier prêt : {segment_output}")

    # Lancement de l'assemblage final vidéo + audio synchronisé
    if segments_data:
        assemble_final_video(video_input, segments_data, final_output)

    print("\nPipeline de doublage et d'assemblage terminé à 100% !")

if __name__ == "__main__":
    main()