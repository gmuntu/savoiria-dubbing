import os
import glob
from utils import translate_to_french, synthesize_speech, assemble_final_video
import ffmpeg

def time_to_seconds(time_str):
    """Convertit un format HH:MM:SS,mmm en secondes."""
    time_str = time_str.replace(',', '.')
    parts = time_str.split(':')
    if len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
    elif len(parts) == 2:
        return int(parts[0]) * 60 + float(parts[1])
    return 0.0

def parse_srt(srt_path):
    """Parse un fichier SRT pour extraire les blocs temporels et textuels."""
    segments = []
    with open(srt_path, 'r', encoding='utf-8') as f:
        content = f.read().split('\n\n')
        for block in content:
            lines = block.strip().split('\n')
            if len(lines) >= 3:
                times = lines[1].split(' --> ')
                start_sec = time_to_seconds(times[0])
                text = " ".join(lines[2:])
                segments.append((start_sec, text))
    return segments

def run_batch_pipeline(input_dir="lectures_input", output_dir="lectures_output"):
    os.makedirs(input_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs("temp", exist_ok=True)
    
    video_files = glob.glob(os.path.join(input_dir, "*.mp4"))
    
    if not video_files:
        print(f"Aucune vidéo trouvée dans le dossier '{input_dir}/'. Veuillez y placer vos fichiers sources.")
        return

    for video_path in video_files:
        base_name = os.path.splitext(os.path.basename(video_path))[0]
        srt_path = os.path.join(input_dir, f"{base_name}.srt")
        
        print(f"\n======================================")
        print(f"Traitement du module : {base_name}")
        print(f"======================================")
        
        if not os.path.exists(srt_path):
            print(f"⚠️ Transcript SRT introuvable pour {base_name} ({srt_path}), module ignoré.")
            continue
            
        segments = parse_srt(srt_path)
        segments_data = []
        
        module_output_dir = os.path.join(output_dir, base_name)
        os.makedirs(module_output_dir, exist_ok=True)
        
        ref_audio = "temp/reference_voice.wav"
        if not os.path.exists(ref_audio):
            print("Extraction de la voix de référence...")
            (
                ffmpeg
                .input(video_path, ss="00:00:01")
                .output(ref_audio, t=10, acodec='pcm_s16le', ac=1, ar='24k')
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )

        for i, (start_sec, original_text) in enumerate(segments):
            original_text = original_text.strip()
            if not original_text:
                continue
                
            print(f"\n[{start_sec:.2f}s] EN : {original_text}")
            translated_text = translate_to_french(original_text)
            print(f"FR : {translated_text}")
            
            segment_output = os.path.join(module_output_dir, f"segment_{i}.wav")
            
            success = synthesize_speech(
                ref_audio_path=ref_audio,
                ref_text=original_text,
                gen_text=translated_text,
                output_path=segment_output
            )
            
            if success:
                segments_data.append((segment_output, start_sec))
        
        if segments_data:
            final_output = os.path.join(module_output_dir, f"{base_name}_dubbed.mp4")
            assemble_final_video(video_path, segments_data, final_output)
            print(f"✅ Module {base_name} entièrement finalisé !")

if __name__ == "__main__":
    run_batch_pipeline()