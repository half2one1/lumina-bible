# Lumina Bible

**Lumina Bible** is a premium, multi-language scripture study application. It is designed to bridge the gap between original biblical languages (Hebrew, Aramaic, Greek) and modern translations, providing a seamless, high-performance interface for scholars and seekers alike.

![Home Page](public/screenshots/01_home_view.png)

## ✨ Key Features

- **Multi-Source Display**: Parallel viewing of original texts alongside English (KJV) and Korean (KRV) translations.
- **Global Streaming Search**: High-speed, across-all-books search that streams results in real-time. Supports Unicode (Hebrew/Arabic/Greek) and translation queries.
- **Smart Navigation**: Instant book and chapter selection with category grouping (Torah, Prophets, NT).
- **Interactive Reading**:
  - Independent **Font Size Cycling** for original and translation text (Tap to cycle).
  - **Auto-Scroll & Highlighting**: Perfectly locatable verses when navigating from search.
  - **Word Selection**: Full support for text selection and copy/lookup while maintaining interactive tap controls.
- **Smart Persistence**: 
  - **Search Caching**: Remembers your last search query and results for instant recall.
  - **Verse Tracking**: Automatically remembers and resumes from the exact verse you were last reading.
- **Cross-Platform**: Built with React and Tauri for Web, Desktop (Windows/Mac/Linux), and Mobile.

## 🚀 Getting Started

### Prerequisites

- **Node.js**: (LTS recommended)
- **Git**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/half2one1/lumina-bible.git
   cd lumina-bible
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Initialize Bible Data**:
   Lumina uses local JSON data for maximum performance. Download the scripture sets:
   ```bash
   npm run download-bible        # Downloads original texts
   npm run download-translations # Downloads EN/KR translations
   ```

4. **Launch the application**:
   ```bash
   npm run dev
   ```
   *The app will be available at `http://localhost:3000`.*

## 📖 User Manual

For a detailed guide on how to navigate, search, and customize your experience, see the [**HOWTOUSE.md**](HOWTOUSE.md) guide.

## 🛠 Tech Stack

- **Frontend**: React (Hooks, Context API)
- **Styling**: Tailwind CSS v4
- **Animations**: Motion (Framer Motion)
- **Desktop/Mobile Layer**: Tauri v2
- **Build Tool**: Vite
- **Data Source**: Custom Bible Service (Local JSON streaming)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<p align="center">Made with ❤️ for scripture study.</p>
