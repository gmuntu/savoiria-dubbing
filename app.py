import gradio as gr
import os
import shutil
import base64
import pandas as pd
from utils import (
    get_optimal_device, extract_audio, download_youtube_video,
    translate_to_french, translate_batch_to_french, keep_awake,
    extract_reference_audio, synthesize_speech,
    assemble_final_video, parse_srt
)
from faster_whisper import WhisperModel

# Charger le logo en Base64 pour l'intégration HTML
def get_logo_base64():
    logo_path = os.path.join(os.path.dirname(__file__), "logo.jpg")
    if os.path.exists(logo_path):
        with open(logo_path, "rb") as f:
            return "data:image/jpeg;base64," + base64.b64encode(f.read()).decode('utf-8')
    return ""

LOGO_B64 = get_logo_base64()

# --- Styles CSS : Landing Page Indigo-Blue (Inspiré de l'image CS50X) ---
CUSTOM_CSS = """
/* ===== Polices Google ===== */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* ===== Reset & Fond Général ===== */
body, .gradio-container {
    background: linear-gradient(180deg, #dbe4ff 0%, #edf2ff 30%, #f8f9fa 60%, #ffffff 100%) !important;
    color: #212529 !important;
    font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
    min-height: 100vh;
}

.gradio-container {
    max-width: 1200px !important;
    margin: 0 auto !important;
}

/* ===== Barre de Navigation ===== */
.navbar-landing {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(222, 226, 230, 0.6);
    padding: 12px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 16px;
    margin-bottom: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.nav-brand {
    display: flex;
    align-items: center;
    gap: 12px;
}

.nav-logo-img {
    height: 48px;
    width: auto;
    object-fit: contain;
    border-radius: 8px;
}

.nav-title {
    font-size: 22px;
    font-weight: 800;
    color: #1e293b;
    letter-spacing: -0.03em;
}

.nav-title .accent {
    color: #2b8a3e; /* Vert du logo SavoirAI */
}

.nav-profile {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #495057;
    background: #f1f3f5;
    padding: 8px 16px;
    border-radius: 10px;
}

/* ===== Hero Section ===== */
.hero-section {
    text-align: center;
    padding: 48px 20px 32px;
    margin-bottom: 8px;
}

.hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #e7f5ff;
    color: #1c7ed6;
    font-size: 13.5px;
    font-weight: 600;
    padding: 8px 20px;
    border-radius: 50px;
    margin-bottom: 20px;
    border: 1px solid #d0ebff;
}

.hero-title {
    font-size: 44px;
    font-weight: 800;
    color: #212529;
    letter-spacing: -0.04em;
    line-height: 1.15;
    margin: 0 0 12px 0;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
}

.hero-title .highlight {
    color: #3b5bdb;
}

.hero-subtitle {
    font-size: 17px;
    color: #868e96;
    font-weight: 500;
    line-height: 1.5;
    max-width: 580px;
    margin: 0 auto 28px;
}

.hero-author {
    font-size: 13px;
    color: #adb5bd;
    font-weight: 500;
    margin-top: 8px;
}

/* ===== 4 Cartes Métriques ===== */
.metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 28px;
    padding: 0 4px;
}

@media (max-width: 768px) {
    .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

.metric-card {
    background: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 16px;
    padding: 22px 18px;
    text-align: center;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.metric-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    margin: 0 auto 12px;
}

.metric-icon-blue { background: #dbe4ff; color: #3b5bdb; }
.metric-icon-green { background: #d3f9d8; color: #2b8a3e; }
.metric-icon-amber { background: #fff3bf; color: #e67700; }
.metric-icon-purple { background: #e5dbff; color: #7048e8; }

.metric-value {
    font-size: 22px;
    font-weight: 800;
    color: #212529;
    margin: 0;
    letter-spacing: -0.02em;
}

.metric-label {
    font-size: 13px;
    color: #868e96;
    font-weight: 500;
    margin: 4px 0 0 0;
}

/* ===== Panneaux & Cartes Gradio ===== */
.gr-box, .gr-panel, .block {
    background: #ffffff !important;
    border: 1px solid #e9ecef !important;
    border-radius: 16px !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03) !important;
    padding: 20px !important;
}

/* ===== Titres de Section ===== */
h3, .gr-markdown h3 {
    font-size: 18px !important;
    font-weight: 700 !important;
    color: #212529 !important;
    margin-top: 14px !important;
    margin-bottom: 8px !important;
    letter-spacing: -0.01em !important;
}

/* ===== Labels ===== */
label, label span, .block span, .form span, .gr-label {
    color: #343a40 !important;
    font-weight: 600 !important;
    font-size: 13.5px !important;
}

/* ===== Champs de saisie ===== */
input[type="text"], input[type="password"], textarea, .gr-input {
    background-color: #ffffff !important;
    color: #212529 !important;
    border: 1.5px solid #dee2e6 !important;
    border-radius: 10px !important;
    font-size: 14px !important;
    padding: 11px 16px !important;
    transition: all 0.2s ease !important;
}

input:focus, textarea:focus {
    border-color: #3b5bdb !important;
    box-shadow: 0 0 0 3px rgba(59, 91, 219, 0.12) !important;
    outline: none !important;
}

/* ===== Radio Buttons (Sélection Moteur) ===== */
fieldset, .gr-radio, [data-testid="radio-group"] {
    background: transparent !important;
}

fieldset label, .gr-radio label, [data-testid="radio-group"] label, .wrap label, label:has(input[type="radio"]) {
    background-color: #f8f9fa !important;
    border: 1.5px solid #dee2e6 !important;
    border-radius: 12px !important;
    color: #343a40 !important;
    padding: 12px 18px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
}

fieldset label:hover {
    border-color: #3b5bdb !important;
    background-color: #edf2ff !important;
}

fieldset label:has(input:checked), .gr-radio label:has(input:checked), [data-testid="radio-group"] label:has(input:checked) {
    background: #edf2ff !important;
    border: 2px solid #3b5bdb !important;
    color: #3b5bdb !important;
    box-shadow: 0 2px 8px rgba(59, 91, 219, 0.12) !important;
}

fieldset label span, .gr-radio label span, [data-testid="radio-group"] label span {
    color: #343a40 !important;
    font-weight: 600 !important;
}

fieldset label:has(input:checked) span {
    color: #3b5bdb !important;
    font-weight: 700 !important;
}

/* ===== Zone d'Upload ===== */
.gr-file, .upload-container, [data-testid="dropzone"] {
    background-color: #f8f9fa !important;
    border: 2px dashed #ced4da !important;
    border-radius: 14px !important;
    color: #495057 !important;
}

[data-testid="dropzone"]:hover {
    border-color: #3b5bdb !important;
    background-color: #edf2ff !important;
}

/* ===== Correction des Boutons (Forçage de la couleur Indigo) ===== */
.btn-primary, .btn-primary button, button.primary {
    background: linear-gradient(135deg, #3b5bdb, #4c6ef5) !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    font-size: 15px !important;
    border: none !important;
    border-radius: 12px !important;
    padding: 14px 24px !important;
    box-shadow: 0 4px 12px rgba(59, 91, 219, 0.3) !important;
    transition: all 0.2s ease !important;
}

.btn-primary:hover, .btn-primary button:hover, button.primary:hover {
    background: linear-gradient(135deg, #364fc7, #3b5bdb) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 16px rgba(59, 91, 219, 0.4) !important;
}

.btn-outline, .btn-outline button, button.secondary {
    background: #ffffff !important;
    color: #343a40 !important;
    font-weight: 600 !important;
    font-size: 15px !important;
    border: 1.5px solid #dee2e6 !important;
    border-radius: 12px !important;
    padding: 14px 24px !important;
    transition: all 0.2s ease !important;
}

.btn-outline:hover, .btn-outline button:hover, button.secondary:hover {
    background: #f8f9fa !important;
    border-color: #adb5bd !important;
    transform: translateY(-1px) !important;
}

/* ===== Tableau d'Édition ===== */
.dataframe-table {
    border-radius: 12px !important;
    border: 1px solid #e9ecef !important;
    background: #ffffff !important;
}

.dataframe-table th {
    background: #f8f9fa !important;
    color: #495057 !important;
    font-weight: 700 !important;
    font-size: 13px !important;
    border-bottom: 1px solid #e9ecef !important;
    padding: 12px 14px !important;
    text-transform: uppercase !important;
    letter-spacing: 0.03em !important;
}

.dataframe-table td {
    color: #212529 !important;
    background: #ffffff !important;
    font-size: 13.5px !important;
    border-bottom: 1px solid #f1f3f5 !important;
    padding: 10px 14px !important;
}

.dataframe-table tr:nth-child(even) td {
    background: #fafafa !important;
}

/* ===== Console de Télémétrie Adoucie ===== */
.terminal-log textarea {
    font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace !important;
    font-size: 13.5px !important;
    background: #f8f9fa !important; /* Remplacé le noir par un gris ultra clair */
    color: #212529 !important; /* Texte sombre lisible */
    border: 1.5px solid #dee2e6 !important;
    border-radius: 12px !important;
    line-height: 1.65 !important;
    padding: 16px !important;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02) !important;
}

/* ===== Section Labels Conviviales ===== */
.section-divider {
    text-align: center;
    color: #adb5bd;
    font-size: 13px;
    font-weight: 500;
    padding: 4px 0;
}
"""


def prepare_directories():
    os.makedirs("input", exist_ok=True)
    os.makedirs("temp", exist_ok=True)
    os.makedirs("output", exist_ok=True)


def cleanup_previous_run():
    for f in ["temp/audio.wav", "temp/reference_voice.wav", "output/final_dubbed_video.mp4"]:
        if os.path.exists(f):
            try:
                os.remove(f)
            except Exception:
                pass
    if os.path.exists("output"):
        for f in os.listdir("output"):
            if f.startswith("segment_"):
                try:
                    os.remove(os.path.join("output", f))
                except Exception:
                    pass


# =====================================================================
# Étape 1 : Analyse & Traduction (avec Batch Optimisé)
# =====================================================================
def step1_analyze_and_translate(youtube_url, video_file, srt_file, engine_choice, gemini_api_key, progress=gr.Progress()):
    has_url = bool(youtube_url and youtube_url.strip())
    has_file = video_file is not None
    has_srt = srt_file is not None

    if not has_url and not has_file:
        yield "❌ Veuillez fournir une URL YouTube ou uploader un fichier vidéo.", None, None
        return

    with keep_awake():
        progress(0, desc="🚀 Démarrage de l'analyse...")
        logs = "🚀 DÉMARRAGE ÉTAPE 1 : ANALYSE & TRADUCTION\n"
        logs += "🔋 Mode veille désactivé pendant le traitement\n"
        logs += "—" * 50 + "\n"
        yield logs, None, None

        prepare_directories()
        cleanup_previous_run()

        video_input = "input/video_source.mp4"
        audio_temp = "temp/audio.wav"
        ref_audio = "temp/reference_voice.wav"

        # 1. Source vidéo
        if has_url:
            progress(0.1, desc="📥 Téléchargement de la vidéo...")
            url = youtube_url.strip()
            logs += f"📥 [YouTube] Téléchargement : {url}...\n"
            yield logs, None, None
            try:
                if os.path.exists(video_input):
                    os.remove(video_input)
                download_youtube_video(url, video_input)
                logs += "   ✅ Téléchargement YouTube terminé avec succès !\n"
                yield logs, None, None
            except Exception as e:
                logs += f"   ❌ Erreur de téléchargement : {e}\n"
                yield logs, None, None
                return
        else:
            progress(0.1, desc="📁 Copie de la vidéo locale...")
            logs += "📁 [Fichier local] Copie du fichier vidéo...\n"
            yield logs, None, None
            shutil.copy2(video_file, video_input)
            logs += "   ✅ Fichier vidéo prêt !\n"
            yield logs, None, None

        # 2. Extraction audio
        progress(0.3, desc="🎧 Extraction audio en cours...")
        logs += "\n🎧 [FFmpeg] Extraction de l'audio haute fidélité...\n"
        yield logs, None, None
        extract_audio(video_input, audio_temp)
        logs += "   ✅ Audio extrait avec succès !\n"
        yield logs, None, None

        # 3. Voix de référence
        progress(0.4, desc="🎤 Extraction de l'empreinte vocale...")
        logs += "\n🎤 [F5-TTS] Extraction de la voix de référence (10s)...\n"
        yield logs, None, None
        extract_reference_audio(audio_temp, ref_audio, start_time="00:00:01", duration=10)
        logs += "   ✅ Empreinte vocale de référence prête !\n"
        yield logs, None, None

        # 4. Transcription
        if has_srt:
            progress(0.5, desc="📄 Lecture des sous-titres (SRT)...")
            logs += f"\n📄 [SRT] Lecture du fichier de sous-titres...\n"
            yield logs, None, None
            try:
                srt_segments = parse_srt(srt_file)
                logs += f"   ✅ {len(srt_segments)} segments extraits du fichier SRT.\n"
                yield logs, None, None
            except Exception as e:
                logs += f"   ❌ Erreur de lecture SRT : {e}\n"
                yield logs, None, None
                return
        else:
            progress(0.5, desc="📝 Transcription vocale neuronale...")
            logs += "\n📝 [Faster-Whisper] Transcription neuronale en cours...\n"
            yield logs, None, None
            model = WhisperModel("small", device="cpu", compute_type="int8")
            segments, info = model.transcribe(audio_temp, language="en", word_timestamps=True)
            srt_segments = [(seg.start, seg.end, seg.text.strip()) for seg in segments if seg.text.strip()]
            logs += f"   ✅ {len(srt_segments)} segments transcrits par Whisper.\n"
            yield logs, None, None

        # 5. Traduction BATCH (optimisée !)
        progress(0.7, desc="🌐 Lancement de la traduction batch...")
        chosen_engine = "gemini" if "gemini" in engine_choice.lower() else "ollama"
        engine_name = "Gemini 2.5 Flash" if chosen_engine == "gemini" else "Ollama (Local gemma4)"
        logs += f"\n🌐 [Traduction Batch] Moteur actif : {engine_name}\n"
        logs += f"⚡ Mode optimisé : {len(srt_segments)} segments regroupés en batches de 20\n"
        yield logs, None, None

        # Préparer les textes pour la traduction batch
        texts_to_translate = [
            (i, text) for i, (start, end, text) in enumerate(srt_segments) if text.strip()
        ]

        def on_translation_progress(batch_num, total_batches):
            fraction = 0.7 + (0.25 * (batch_num / total_batches))
            progress(fraction, desc=f"⏳ Traduction : Batch {batch_num}/{total_batches}...")

        # Appel batch (au lieu de segment par segment)
        translations = translate_batch_to_french(
            texts_to_translate,
            engine=chosen_engine,
            gemini_api_key=gemini_api_key,
            progress_callback=on_translation_progress
        )

        progress(0.95, desc="✅ Traduction terminée, finalisation...")
        logs += f"   ✅ {len(translations)} traductions reçues !\n"
        yield logs, None, None

        # Construire le DataFrame
        rows = []
        for i, (start, end, original_text) in enumerate(srt_segments):
            if not original_text.strip():
                continue
            translated_text = translations.get(i, original_text)
            logs += f"   [{start:.1f}s → {end:.1f}s] {original_text[:35]}... → {translated_text[:35]}...\n"
            rows.append({
                "ID": i,
                "Début (s)": round(start, 2),
                "Fin (s)": round(end, 2),
                "Anglais (Original)": original_text,
                "Français (Traduction éditable)": translated_text
            })

        df = pd.DataFrame(rows)
        progress(1.0, desc="✨ Analyse et Traduction terminées !")
        logs += "\n" + "—" * 50 + "\n"
        logs += f"✨ ÉTAPE 1 TERMINÉE : {len(rows)} segments prêts pour révision !\n"
        logs += "👉 Modifiez la colonne 'Français' dans le tableau, puis lancez l'Étape 2.\n"

        yield logs, df, None


# =====================================================================
# Étape 2 : Synthèse Vocale & Assemblage
# =====================================================================
def step2_synthesize_and_assemble(df_data, progress=gr.Progress()):
    if df_data is None:
        yield "❌ Aucun tableau de segments disponible. Veuillez d'abord lancer l'Étape 1.", None
        return

    if not isinstance(df_data, pd.DataFrame):
        try:
            df = pd.DataFrame(df_data)
        except Exception as e:
            yield f"❌ Format de données invalide : {e}", None
            return
    else:
        df = df_data

    if df.empty:
        yield "❌ Le tableau de segments est vide.", None
        return

    with keep_awake():
        progress(0, desc="🎙️ Démarrage de la synthèse vocale...")
        logs = "🎙️ DÉMARRAGE ÉTAPE 2 : CLONAGE VOCAL & ASSEMBLAGE FINAL\n"
        logs += "🔋 Mode veille désactivé pendant le traitement\n"
        logs += "—" * 50 + "\n"
        yield logs, None

        video_input = "input/video_source.mp4"
        ref_audio = "temp/reference_voice.wav"
        final_output = "output/final_dubbed_video.mp4"

        device = get_optimal_device()
        logs += f"⚙️ Accélération matérielle : {device}\n"
        yield logs, None

        segments_data = []
        total_segments = len(df)

        for i, (idx, row) in enumerate(df.iterrows()):
            seg_id = int(row.get("ID", idx))
            start_sec = float(row.get("Début (s)", 0.0))
            ref_text = str(row.get("Anglais (Original)", "")).strip()
            gen_text = str(row.get("Français (Traduction éditable)", "")).strip()

            if not gen_text:
                continue

            fraction = (i / total_segments) * 0.8
            progress(fraction, desc=f"🎙️ Génération voix : segment {i+1}/{total_segments}...")

            segment_output = f"output/segment_{seg_id}.wav"
            logs += f"🎙️ [{seg_id + 1}/{total_segments}] Synthèse vocale : \"{gen_text[:40]}...\"\n"
            yield logs, None

            success = synthesize_speech(
                ref_audio_path=ref_audio,
                ref_text=ref_text,
                gen_text=gen_text,
                output_path=segment_output,
                device=device
            )

            if success:
                segments_data.append((segment_output, start_sec))
                logs += f"   ✅ Segment audio {seg_id} prêt !\n"
                yield logs, None
            else:
                logs += f"   ⚠️ Segment {seg_id} échoué, ignoré.\n"
                yield logs, None

        if not segments_data:
            progress(1.0, desc="❌ Échec : aucun segment généré")
            logs += "\n❌ Aucun segment audio n'a pu être généré. Abandon.\n"
            yield logs, None
            return

        # Assemblage vidéo final avec FFmpeg
        progress(0.85, desc="🎬 Assemblage vidéo avec FFmpeg en cours...")
        logs += f"\n🎬 [FFmpeg] Assemblage vidéo et mixage de {len(segments_data)} segments...\n"
        yield logs, None

        try:
            assemble_final_video(video_input, segments_data, final_output)
            progress(1.0, desc="🎉 Doublage terminé avec succès !")
            logs += "\n" + "—" * 50 + "\n"
            logs += f"🎉 DOUBLAGE TERMINÉ À 100% !\nVidéo disponible : {final_output}\n"
            yield logs, final_output
        except Exception as e:
            progress(1.0, desc="❌ Erreur d'assemblage")
            logs += f"\n❌ Erreur lors de l'assemblage : {e}\n"
            yield logs, None


# =====================================================================
# Workflow Tout-en-un Automatique (Express)
# =====================================================================
def run_all_express(youtube_url, video_file, srt_file, engine_choice, gemini_api_key, progress=gr.Progress()):
    last_df = None
    for logs_step1, df, _ in step1_analyze_and_translate(youtube_url, video_file, srt_file, engine_choice, gemini_api_key, progress=progress):
        last_df = df
        yield logs_step1, df, None

    if last_df is None or last_df.empty:
        return

    for logs_step2, video_path in step2_synthesize_and_assemble(last_df, progress=progress):
        yield logs_step2, last_df, video_path


# =====================================================================
# Interface Utilisateur Gradio (Style Landing Page Indigo-Blue)
# =====================================================================
# Utilisation d'un thème neutre pour éviter que Gradio n'écrase notre CSS avec de l'orange
theme = gr.themes.Soft(primary_hue="indigo", secondary_hue="blue")

with gr.Blocks(title="SavoirIA Dubbing — Créé par Ghislain Muntu", theme=theme) as app:

    # ─── 1. Barre de Navigation ───
    gr.HTML(f"""
        <div class="navbar-landing">
            <div class="nav-brand">
                <img src="{LOGO_B64}" class="nav-logo-img" alt="SavoirAI Logo" />
                <div class="nav-title">SavoirIA <span class="accent">Dubbing</span></div>
            </div>
            <div class="nav-profile">
                👤 Ghislain Muntu
            </div>
        </div>
    """)

    # ─── 2. Hero Section ───
    gr.HTML("""
        <div class="hero-section">
            <div class="hero-badge">
                ✨ Doublage Vidéo par Intelligence Artificielle
            </div>
            <h1 class="hero-title">
                Traduisez et Doublez<br>
                vos Vidéos avec <span class="highlight">l'IA</span>
            </h1>
            <p class="hero-subtitle">
                Traduction contextuelle, clonage vocal émotionnel et assemblage automatique.
                Du contenu anglais au français en quelques clics.
            </p>
            <p class="hero-author">Créé par Ghislain Muntu</p>
        </div>
    """)

    # ─── 3. Cartes Métriques ───
    gr.HTML("""
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-icon metric-icon-blue">🧠</div>
                <p class="metric-value">Gemini 2.5</p>
                <p class="metric-label">Traduction Contextuelle</p>
            </div>
            <div class="metric-card">
                <div class="metric-icon metric-icon-green">🎙️</div>
                <p class="metric-value">Whisper</p>
                <p class="metric-label">Transcription Neuronale</p>
            </div>
            <div class="metric-card">
                <div class="metric-icon metric-icon-amber">🗣️</div>
                <p class="metric-value">F5-TTS</p>
                <p class="metric-label">Clonage Vocal</p>
            </div>
            <div class="metric-card">
                <div class="metric-icon metric-icon-purple">⚡</div>
                <p class="metric-value">Apple Silicon</p>
                <p class="metric-label">Accélération MPS</p>
            </div>
        </div>
    """)

    # ─── 4. Corps Principal en 2 Colonnes ───
    with gr.Row():
        # --- Colonne Gauche : Paramètres & Actions ---
        with gr.Column(scale=4):
            gr.Markdown("### 📥 Source Vidéo")
            youtube_input = gr.Textbox(
                label="Lien YouTube",
                placeholder="https://www.youtube.com/watch?v=...",
                lines=1
            )
            gr.HTML('<div class="section-divider">— OU —</div>')
            video_upload = gr.File(
                label="Fichier Vidéo Local",
                file_types=["video"]
            )

            gr.Markdown("### 📄 Sous-titres (Optionnel)")
            srt_upload = gr.File(
                label="Fichier SRT existant (évite la transcription)",
                file_types=[".srt"]
            )

            gr.Markdown("### 🧠 Moteur de Traduction")
            engine_choice = gr.Radio(
                choices=["Gemini (Cloud — Recommandé)", "Ollama (Local gemma4:e2b)"],
                value="Gemini (Cloud — Recommandé)",
                label="Sélection du Modèle"
            )
            gemini_key_input = gr.Textbox(
                label="Clé API Gemini (optionnel si dans GEMINI_API_KEY)",
                placeholder="AIzaSy...",
                type="password",
                lines=1
            )

            gr.Markdown("### ⚡ Actions")
            with gr.Row():
                step1_btn = gr.Button(
                    "🔍 1. Analyser & Traduire",
                    variant="primary",
                    elem_classes=["btn-primary"]
                )
                step2_btn = gr.Button(
                    "🎙️ 2. Générer Voix & Assembler",
                    variant="secondary",
                    elem_classes=["btn-outline"]
                )

            express_btn = gr.Button(
                "🚀 Tout-en-Un Express (Sans Pause)",
                variant="primary",
                elem_classes=["btn-primary"]
            )

        # --- Colonne Droite : Édition Manuelle & Résultat ---
        with gr.Column(scale=6):
            gr.Markdown("### 📝 Relecture & Correction Manuelle")
            gr.Markdown(
                "<span style='color: #868e96; font-size: 13.5px;'>"
                "Modifiez directement le texte dans la colonne <b>'Français (Traduction éditable)'</b> "
                "avant de lancer l'étape 2."
                "</span>"
            )
            segments_table = gr.Dataframe(
                headers=["ID", "Début (s)", "Fin (s)", "Anglais (Original)", "Français (Traduction éditable)"],
                datatype=["number", "number", "number", "str", "str"],
                column_count=(5, "fixed"),
                interactive=True,
                wrap=True,
                elem_classes=["dataframe-table"]
            )

            gr.Markdown("### 🎥 Vidéo Finale Doublée")
            video_output = gr.Video(label="Résultat assemblé")

    # ─── 5. Console de Télémétrie ───
    gr.Markdown("### 📋 Console de Télémétrie")
    log_output = gr.Textbox(
        label="Journal d'exécution en direct",
        lines=10,
        max_lines=25,
        interactive=False,
        elem_classes=["terminal-log"]
    )

    # ─── Événements des Boutons ───
    step1_btn.click(
        fn=step1_analyze_and_translate,
        inputs=[youtube_input, video_upload, srt_upload, engine_choice, gemini_key_input],
        outputs=[log_output, segments_table, video_output]
    )

    step2_btn.click(
        fn=step2_synthesize_and_assemble,
        inputs=[segments_table],
        outputs=[log_output, video_output]
    )

    express_btn.click(
        fn=run_all_express,
        inputs=[youtube_input, video_upload, srt_upload, engine_choice, gemini_key_input],
        outputs=[log_output, segments_table, video_output]
    )

if __name__ == "__main__":
    app.launch(inbrowser=True, css=CUSTOM_CSS)
