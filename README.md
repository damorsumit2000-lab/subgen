# 🎬 SubtitleAI — Groq Whisper Subtitle Generator

A beautiful, fully client-side subtitle generation web app powered by **Groq Whisper AI**.

## ✨ Features

- 🎤 **AI Transcription** via Groq Whisper large-v3
- 🌐 **20+ Languages** — Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu, Odia, Assamese, English, French, Spanish, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Arabic, Turkish
- ✏️ **Live Subtitle Editor** — double-click any subtitle to edit, delete, or add new ones
- 🎨 **Style Customizer** — font, size, color, background opacity, position
- 🌍 **AI Translation** using Groq LLaMA3-70B (batch translated)
- 📥 **Download Video** with burnt-in subtitles (WebM)
- 📄 **Export SRT / VTT** subtitle files
- 📁 Supports up to **25MB** videos (MP4, WebM, MOV, AVI)

---

## 🚀 Deploy to Cloudflare Pages

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/subtitleai.git
git push -u origin main
```

### 2. Deploy on Cloudflare Pages
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages**
2. Click **Create a project** → **Connect to Git**
3. Select your GitHub repository
4. **Build settings:**
   - Build command: *(leave empty)*
   - Build output directory: `.`
5. Click **Save and Deploy** ✅

### 3. Done!
Your app will be live at `https://your-project.pages.dev`

---

## 🔑 API Key

Your Groq API key is pre-filled. You can change it anytime in the app's Settings panel.

Get a free Groq API key at: https://console.groq.com

---

## 🛠 Tech Stack

- **Pure HTML/CSS/JS** — no build step, no dependencies
- **Groq Whisper large-v3** — for transcription
- **Groq LLaMA3-70B** — for translation
- **Canvas API + MediaRecorder** — for video rendering with subtitles
- **Cloudflare Pages** — for hosting

---

## 📁 Project Structure

```
subtitleai/
├── index.html        # The entire app (single file)
├── _headers          # Cloudflare security headers (needed for SharedArrayBuffer)
└── README.md         # This file
```
