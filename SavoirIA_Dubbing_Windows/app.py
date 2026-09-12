import gradio as gr
import os
import shutil
import pandas as pd
from utils import (
    get_optimal_device, extract_audio, download_youtube_video,
    translate_to_french, extract_reference_audio, synthesize_speech,
    assemble_final_video, parse_srt
)
from faster_whisper import WhisperModel

# --- Styles CSS Inspirés du Design CS50X Francophone (Light Theme & Bleu Royal) ---
CUSTOM_CSS = """
/* Fond Général Lumineux & Épuré */
body, .gradio-container {
    background-color: #f8fafc !important;
    color: #0f172a !important;
    font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
}

/* Barre de Navigation Supérieure (Style CS50X) */
.cs50-navbar {
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: 14px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 14px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.cs50-logo-group {
    display: flex;
    align-items: center;
    gap: 12px;
}

.cs50-icon-badge {
    width: 40px;
    height: 40px;
    background: #1d63ed;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
    box-shadow: 0 2px 8px rgba(29, 99, 237, 0.3);
}

.cs50-app-title {
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
}

.cs50-app-title span {
    color: #1d63ed;
}

.cs50-nav-tabs {
    display: flex;
    align-items: center;
    gap: 8px;
}

.cs50-tab-active {
    background: #1d63ed !important;
    color: #ffffff !important;
    padding: 8px 18px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 13.5px;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 2px 6px rgba(29, 99, 237, 0.25);
}

.cs50-user-profile {
    font-size: 14px;
    font-weight: 600;
    color: #334155;
    display: flex;
    align-items: center;
    gap: 6px;
}

/* Titre d'Accueil "Bienvenue, Ghislain Muntu" */
.welcome-hero {
    margin-bottom: 24px;
    padding: 4px 4px;
}

.welcome-title {
    font-size: 32px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.03em;
    margin: 0;
}

.welcome-title .user-highlight {
    color: #1d63ed;
}

.welcome-subtitle {
    font-size: 15px;
    color: #64748b;
    margin-top: 6px;
    font-weight: 500;
}

/* Grille de 4 Cartes de Statut (comme dans l'image) */
.stat-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-bottom: 28px;
}

.stat-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.stat-icon-wrapper {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.stat-icon-blue { background: #eff6ff; color: #1d63ed; }
.stat-icon-green { background: #f0fdf4; color: #16a34a; }
.stat-icon-amber { background: #fefce8; color: #ca8a04; }
.stat-icon-purple { background: #faf5ff; color: #9333ea; }

.stat-card-title {
    font-size: 17px;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
}

.stat-card-subtitle {
    font-size: 12.5px;
    color: #64748b;
    margin: 2px 0 0 0;
}

/* Cartes & Panneaux Principaux */
.gr-box, .gr-panel, .block {
    background: #ffffff !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 16px !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04) !important;
    padding: 18px !important;
}

/* Titres H3 Nets & Professionnels */
h3, .gr-markdown h3 {
    font-size: 18px !important;
    font-weight: 700 !important;
    color: #0f172a !important;
    margin-top: 14px !important;
    margin-bottom: 8px !important;
    letter-spacing: -0.01em !important;
}

/* Labels de champs en ardoise sombre très lisible */
label, label span, .block span, .form span, .gr-label {
    color: #1e293b !important;
    font-weight: 600 !important;
    font-size: 13.5px !important;
}

/* Champs de texte et zones de saisie */
input[type="text"], input[type="password"], textarea, .gr-input {
    background-color: #ffffff !important;
    color: #0f172a !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 8px !important;
    font-size: 14px !important;
    padding: 10px 14px !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
}

input:focus, textarea:focus {
    border-color: #1d63ed !important;
    box-shadow: 0 0 0 3px rgba(29, 99, 237, 0.15) !important;
    outline: none !important;
}

/* Boutons Radio (Sélection du Moteur) */
fieldset, .gr-radio, [data-testid="radio-group"] {
    background: transparent !important;
}

fieldset label, .gr-radio label, [data-testid="radio-group"] label, .wrap label, label:has(input[type="radio"]) {
    background-color: #f8fafc !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 10px !important;
    color: #1e293b !important;
    padding: 10px 16px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
}

fieldset label:hover {
    border-color: #1d63ed !important;
    background-color: #f0f7ff !important;
}

/* Option radio sélectionnée */
fieldset label:has(input:checked), .gr-radio label:has(input:checked), [data-testid="radio-group"] label:has(input:checked) {
    background: #eff6ff !important;
    border: 1.5px solid #1d63ed !important;
    color: #1d63ed !important;
    box-shadow: 0 2px 6px rgba(29, 99, 237, 0.1) !important;
}

fieldset label span, .gr-radio label span, [data-testid="radio-group"] label span {
    color: #0f172a !important;
    font-weight: 600 !important;
}

fieldset label:has(input:checked) span {
    color: #1d63ed !important;
    font-weight: 700 !important;
}

/* Zone d'Upload de Fichiers */
.gr-file, .upload-container, [data-testid="dropzone"] {
    background-color: #f8fafc !important;
    border: 2px dashed #cbd5e1 !important;
    border-radius: 12px !important;
    color: #334155 !important;
}

[data-testid="dropzone"]:hover {
    border-color: #1d63ed !important;
    background-color: #f0f7ff !important;
}

/* Boutons Bleu Royal (Style "Accéder au Tuteur") */
.btn-royal button {
    background: #1d63ed !important;
    color: #ffffff !important;
    font-weight: 600 !important;
    font-size: 14.5px !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 12px 20px !important;
    box-shadow: 0 2px 4px rgba(29, 99, 237, 0.25) !important;
    transition: background 0.15s ease, transform 0.1s ease !important;
}

.btn-royal button:hover {
    background: #174ecc !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 8px rgba(29, 99, 237, 0.35) !important;
}

/* Bouton Secondaire Épuré */
.btn-secondary button {
    background: #ffffff !important;
    color: #0f172a !important;
    font-weight: 600 !important;
    font-size: 14.5px !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 8px !important;
    padding: 12px 20px !important;
    transition: all 0.15s ease !important;
}

.btn-secondary button:hover {
    background: #f8fafc !important;
    border-color: #94a3b8 !important;
}

/* Tableau d'Édition Lumineux */
.dataframe-table {
    border-radius: 10px !important;
    border: 1px solid #e2e8f0 !important;
    background: #ffffff !important;
}

.dataframe-table th {
    background: #f8fafc !important;
    color: #334155 !important;
    font-weight: 700 !important;
    font-size: 13.5px !important;
    border-bottom: 1px solid #e2e8f0 !important;
    padding: 10px 14px !important;
}

.dataframe-table td {
    color: #0f172a !important;
    background: #ffffff !important;
    font-size: 13.5px !important;
    border-bottom: 1px solid #f1f5f9 !important;
    padding: 10px 14px !important;
}

.dataframe-table tr:nth-child(even) td {
    background: #fafafa !important;
}

/* Terminal de Progression Élégant */
.terminal-log textarea {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 13px !important;
    background: #0f172a !important;
    color: #38bdf8 !important;
    border: 1px solid #1e293b !important;
    border-radius: 10px !important;
    line-height: 1.6 !important;
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
# Étape 1 : Analyse & Traduction
# =====================================================================
def step1_analyze_and_translate(youtube_url, video_file, srt_file, engine_choice, gemini_api_key):
    has_url = bool(youtube_url and youtube_url.strip())
    has_file = video_file is not None
    has_srt = srt_file is not None

    if not has_url and not has_file:
        yield "❌ Veuillez fournir une URL YouTube ou uploader un fichier vidéo.", None, None
        return

    logs = "🚀 DÉMARRAGE ÉTAPE 1 : ANALYSE & TRADUCTION\n" + "—" * 50 + "\n"
    yield logs, None, None

    prepare_directories()
    cleanup_previous_run()

    video_input = "input/video_source.mp4"
    audio_temp = "temp/audio.wav"
    ref_audio = "temp/reference_voice.wav"

    # 1. Source vidéo
    if has_url:
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
        logs += "📁 [Fichier local] Copie du fichier vidéo...\n"
        yield logs, None, None
        shutil.copy2(video_file, video_input)
        logs += "   ✅ Fichier vidéo prêt !\n"
        yield logs, None, None

    # 2. Extraction audio
    logs += "\n🎧 [FFmpeg] Extraction de l'audio haute fidélité...\n"
    yield logs, None, None
    extract_audio(video_input, audio_temp)
    logs += "   ✅ Audio extrait avec succès !\n"
    yield logs, None, None

    # 3. Voix de référence
    logs += "\n🎤 [F5-TTS] Extraction de la voix de référence (10s)...\n"
    yield logs, None, None
    extract_reference_audio(audio_temp, ref_audio, start_time="00:00:01", duration=10)
    logs += "   ✅ Empreinte vocale de référence prête !\n"
    yield logs, None, None

    # 4. Transcription
    if has_srt:
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
        logs += "\n📝 [Faster-Whisper] Transcription neuronale en cours...\n"
        yield logs, None, None
        model = WhisperModel("small", device="cpu", compute_type="int8")
        segments, info = model.transcribe(audio_temp, language="en", word_timestamps=True)
        srt_segments = [(seg.start, seg.end, seg.text.strip()) for seg in segments if seg.text.strip()]
        logs += f"   ✅ {len(srt_segments)} segments transcrits par Whisper.\n"
        yield logs, None, None

    # 5. Traduction
    chosen_engine = "gemini" if "gemini" in engine_choice.lower() else "ollama"
    engine_name = "Gemini 2.5 Flash" if chosen_engine == "gemini" else "Ollama (Local gemma4)"
    logs += f"\n🌐 [Traduction] Moteur actif : {engine_name}\n"
    yield logs, None, None

    rows = []
    for i, (start, end, original_text) in enumerate(srt_segments):
        if not original_text:
            continue
        logs += f"   [{start:.1f}s → {end:.1f}s] EN: {original_text[:45]}...\n"
        yield logs, None, None

        translated_text = translate_to_french(
            original_text,
            engine=chosen_engine,
            gemini_api_key=gemini_api_key
        )
        logs += f"   ↳ FR: {translated_text}\n\n"
        yield logs, None, None

        rows.append({
            "ID": i,
            "Début (s)": round(start, 2),
            "Fin (s)": round(end, 2),
            "Anglais (Original)": original_text,
            "Français (Traduction éditable)": translated_text
        })

    df = pd.DataFrame(rows)
    logs += "\n" + "—" * 50 + "\n"
    logs += f"✨ ÉTAPE 1 TERMINÉE : {len(rows)} segments prêts pour révision !\n"
    logs += "👉 Vous pouvez maintenant relire et modifier la colonne 'Français' dans le tableau ci-contre.\n"
    logs += "👉 Cliquez ensuite sur 'Étape 2 : Générer les Voix & Assembler' pour finaliser !"

    yield logs, df, None


# =====================================================================
# Étape 2 : Synthèse Vocale & Assemblage
# =====================================================================
def step2_synthesize_and_assemble(df_data):
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

    logs = "🎙️ DÉMARRAGE ÉTAPE 2 : CLONAGE VOCAL & ASSEMBLAGE FINAL\n" + "—" * 50 + "\n"
    yield logs, None

    video_input = "input/video_source.mp4"
    ref_audio = "temp/reference_voice.wav"
    final_output = "output/final_dubbed_video.mp4"

    device = get_optimal_device()
    logs += f"⚙️ Accélération matérielle : {device}\n"
    yield logs, None

    segments_data = []
    total_segments = len(df)

    for idx, row in df.iterrows():
        seg_id = int(row.get("ID", idx))
        start_sec = float(row.get("Début (s)", 0.0))
        ref_text = str(row.get("Anglais (Original)", "")).strip()
        gen_text = str(row.get("Français (Traduction éditable)", "")).strip()

        if not gen_text:
            continue

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
        logs += "\n❌ Aucun segment audio n'a pu être généré. Abandon.\n"
        yield logs, None
        return

    # Assemblage vidéo final avec FFmpeg
    logs += f"\n🎬 [FFmpeg] Assemblage vidéo et mixage de {len(segments_data)} segments...\n"
    yield logs, None

    try:
        assemble_final_video(video_input, segments_data, final_output)
        logs += "\n" + "—" * 50 + "\n"
        logs += f"🎉 DOUBLAGE TERMINÉ À 100% !\nVidéo disponible : {final_output}\n"
        yield logs, final_output
    except Exception as e:
        logs += f"\n❌ Erreur lors de l'assemblage : {e}\n"
        yield logs, None


# =====================================================================
# Workflow Tout-en-un Automatique (Express)
# =====================================================================
def run_all_express(youtube_url, video_file, srt_file, engine_choice, gemini_api_key):
    last_df = None
    for logs_step1, df, _ in step1_analyze_and_translate(youtube_url, video_file, srt_file, engine_choice, gemini_api_key):
        last_df = df
        yield logs_step1, df, None

    if last_df is None or last_df.empty:
        return

    for logs_step2, video_path in step2_synthesize_and_assemble(last_df):
        yield logs_step2, last_df, video_path


# =====================================================================
# Interface Utilisateur Gradio Studio (Style CS50X Francophone)
# =====================================================================
with gr.Blocks(title="SavoirIA Dubbing - Créé par Ghislain Muntu", css=CUSTOM_CSS) as app:
    # 1. Barre de Navigation Supérieure
    gr.HTML(
        """
        <div class="cs50-navbar">
            <div class="cs50-logo-group">
                <div class="cs50-icon-badge">🎬</div>
                <div class="cs50-app-title">SavoirIA <span>Dubbing</span></div>
            </div>
            <div class="cs50-nav-tabs">
                <div class="cs50-tab-active">📊 Tableau de bord</div>
            </div>
            <div class="cs50-user-profile">
                👤 Ghislain Muntu
            </div>
        </div>
        """
    )

    # 2. Section d'Accueil "Bienvenue, Ghislain Muntu"
    gr.HTML(
        """
        <div class="welcome-hero">
            <h1 class="welcome-title">Bienvenue, <span class="user-highlight">Ghislain Muntu</span></h1>
            <p class="welcome-subtitle">Votre tableau de bord intelligent pour le doublage vidéo et l'apprentissage IA</p>
        </div>
        """
    )

    # 3. Les 4 Cartes Métriques / Indicateurs (inspirées de l'image)
    gr.HTML(
        """
        <div class="stat-cards-grid">
            <div class="stat-card">
                <div class="stat-icon-wrapper stat-icon-blue">🧠</div>
                <div>
                    <div class="stat-card-title">Gemini 2.5 Flash</div>
                    <div class="stat-card-subtitle">Traduction Contextuelle</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon-wrapper stat-icon-green">🎙️</div>
                <div>
                    <div class="stat-card-title">Whisper Large-v3</div>
                    <div class="stat-card-subtitle">Transcription Neuronale</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon-wrapper stat-icon-amber">🗣️</div>
                <div>
                    <div class="stat-card-title">F5-TTS Studio</div>
                    <div class="stat-card-subtitle">Clonage Vocal Émotionnel</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon-wrapper stat-icon-purple">⚡</div>
                <div>
                    <div class="stat-card-title">Apple Silicon MPS</div>
                    <div class="stat-card-subtitle">Accélération Matérielle</div>
                </div>
            </div>
        </div>
        """
    )

    # 4. Corps Principal en 2 Colonnes
    with gr.Row():
        # --- Colonne Gauche : Paramètres & Actions ---
        with gr.Column(scale=4):
            gr.Markdown("### 📥 Source Vidéo")
            youtube_input = gr.Textbox(
                label="Lien YouTube",
                placeholder="https://www.youtube.com/watch?v=...",
                lines=1
            )
            gr.Markdown("<center style='color: #64748b; font-size: 13px;'>— OU —</center>")
            video_upload = gr.File(
                label="Fichier Vidéo Local",
                file_types=["video"]
            )

            gr.Markdown("### 📄 Sous-titres Originaux (Optionnel)")
            srt_upload = gr.File(
                label="Fichier SRT existant (évite la transcription)",
                file_types=[".srt"]
            )

            gr.Markdown("### 🧠 Moteur d'IA pour la Traduction")
            engine_choice = gr.Radio(
                choices=["Gemini (Cloud - Recommandé)", "Ollama (Local gemma4:e2b)"],
                value="Gemini (Cloud - Recommandé)",
                label="Sélection du Modèle de Traduction"
            )
            gemini_key_input = gr.Textbox(
                label="Clé API Gemini (Optionnel si configurée dans GEMINI_API_KEY)",
                placeholder="AIzaSy...",
                type="password",
                lines=1
            )

            gr.Markdown("### ⚡ Actions")
            with gr.Row():
                step1_btn = gr.Button("🔍 1. Analyser & Traduire", variant="primary", elem_classes=["btn-royal"])
                step2_btn = gr.Button("🎙️ 2. Générer Voix & Assembler", variant="secondary", elem_classes=["btn-secondary"])

            express_btn = gr.Button("🚀 Tout-en-Un (Express sans pause)", variant="primary", elem_classes=["btn-royal"])

        # --- Colonne Droite : Édition Manuelle & Résultat ---
        with gr.Column(scale=6):
            gr.Markdown("### 📝 Relecture & Correction Manuelle des Textes")
            gr.Markdown(
                "<span style='color: #64748b; font-size: 13.5px;'>"
                "Modifiez directement le texte dans la colonne <b>'Français (Traduction éditable)'</b> ci-dessous avant de lancer l'étape 2."
                "</span>"
            )
            segments_table = gr.Dataframe(
                headers=["ID", "Début (s)", "Fin (s)", "Anglais (Original)", "Français (Traduction éditable)"],
                datatype=["number", "number", "number", "str", "str"],
                col_count=(5, "fixed"),
                interactive=True,
                wrap=True,
                elem_classes=["dataframe-table"]
            )

            gr.Markdown("### 🎥 Vidéo Finale Doublée")
            video_output = gr.Video(label="Résultat assemblé")

    # 5. Zone Inférieure : Console de Télémétrie
    gr.Markdown("### 📋 Console de Télémétrie en Direct")
    log_output = gr.Textbox(
        label="Journal d'exécution",
        lines=10,
        max_lines=25,
        interactive=False,
        elem_classes=["terminal-log"]
    )

    # --- Événements des Boutons ---
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
    app.launch(inbrowser=True)
