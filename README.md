<p align="center"><img src="assets/logo.png" alt="Firefly Module logo" width="160"></p>

# Firefly Module

<p align="center">
  <img src="https://img.shields.io/badge/platform-Electron-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/runtime-Node.js-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/tool-npm-CB3837?style=for-the-badge&logo=npm&logoColor=white" alt="npm">
  <img src="https://img.shields.io/badge/language-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/language-HTML-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML">
  <img src="https://img.shields.io/badge/language-CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS">
  <img src="https://img.shields.io/badge/library-docx--preview-2B579A?style=for-the-badge" alt="docx-preview">
  <img src="https://img.shields.io/badge/library-PDF.js-B7472A?style=for-the-badge" alt="PDF.js">
  <img src="https://img.shields.io/badge/library-SheetJS-217346?style=for-the-badge" alt="SheetJS">
  <img src="https://img.shields.io/badge/library-marked-333333?style=for-the-badge" alt="marked">
  <img src="https://img.shields.io/badge/library-DOMPurify-4B5563?style=for-the-badge" alt="DOMPurify">
  <img src="https://img.shields.io/badge/document-DOCX-2B579A?style=for-the-badge&logo=microsoftword&logoColor=white" alt="DOCX">
  <img src="https://img.shields.io/badge/document-PDF-EC1C24?style=for-the-badge&logo=adobeacrobatreader&logoColor=white" alt="PDF">
  <img src="https://img.shields.io/badge/document-XLSX-217346?style=for-the-badge&logo=microsoftexcel&logoColor=white" alt="XLSX">
  <img src="https://img.shields.io/badge/document-Markdown-083FA1?style=for-the-badge&logo=markdown&logoColor=white" alt="Markdown">
</p>

## ✨ About the project

Firefly Module is a read-only desktop document reader built with Electron. It loads DOCX, PDF, XLSX, Markdown and HTML files, lists them in a library sidebar with thumbnails, and renders the selected one in a reading area on the right, with content search, three zoom levels and light/dark themes.

Documents are handled in memory during the session: the application has no backend, database or account, and does not save anything between runs. HTML files are rendered inside a sandboxed frame with network access blocked, and their scripts only run if the user explicitly turns on the interactive mode for that document. The user interface text is in Portuguese (pt-BR).

## 🛠️ Technologies used

| Technology | What it is used for |
| --- | --- |
| Electron 36 | Desktop runtime: creates the app window (`electron/main.cjs`), opens external links in the system browser and denies permission requests, downloads and `<webview>` attachments |
| Node.js / npm | Installs the dependencies and runs the `start` / `dev` scripts defined in `package.json` |
| JavaScript (ES modules) | All application logic: `src/app.js` orchestrates the UI and each feature lives in its own file under `src/use_case/` |
| HTML | Application interface (`src/index.html`) and the format of the local HTML documents the app can read |
| CSS | Layout, thumbnails, zoom levels, light and dark themes (`src/styles.css`, `src/light-theme.css`) |
| docx-preview | Renders DOCX documents in the reading area (loaded from the jsDelivr CDN at runtime) |
| PDF.js (`pdfjs-dist`) | Renders PDF pages as canvases, extracts the text used by the library search and draws PDF thumbnails |
| SheetJS (`xlsx`) | Parses XLSX workbooks inside a Web Worker (`src/xlsx-worker.js`) so large files do not freeze the interface |
| marked | Converts Markdown files to HTML |
| DOMPurify | Sanitizes the HTML generated from Markdown before it is shown |
| DOCX | File format loaded and rendered by the app |
| PDF | File format loaded and rendered by the app |
| XLSX | File format loaded and rendered as a virtualized table with worksheet tabs |
| Markdown | File format (`.md`, `.markdown`) loaded and rendered by the app |

## 📋 Mapped features

There are no automated tests in this repository (there is no test script and no test files). Because `COMPLETE` requires passing tests that cover the feature, every implemented feature is marked `PARTIAL`.

| Feature | What it does | Status |
| --- | --- | --- |
| Load files | Selects one or many `.docx`, `.pdf`, `.xlsx`, `.md`, `.markdown`, `.html` or `.htm` files at once and shows a message when an unsupported format is chosen | PARTIAL |
| Load a folder | Selects a folder and loads every supported file inside it; local images, styles, fonts and scripts referenced by HTML files in the folder are resolved from it | PARTIAL |
| Document library | Lists the loaded documents with name, type and total count; opens a document with a click, removes one document or clears the whole list, and collapses the sidebar | PARTIAL |
| Thumbnails | Shows a preview of each document in the list; PDF, Markdown, XLSX and HTML thumbnails are generated one at a time in the background (with a type label while pending) and DOCX uses a scaled copy of its content | PARTIAL |
| DOCX reading | Renders DOCX files with `docx-preview`, keeping page layout | PARTIAL |
| PDF reading | Renders every PDF page as a canvas and extracts the text used by the search | PARTIAL |
| XLSX reading | Parses workbooks in a background worker with progress feedback, switches between worksheet tabs and draws large sheets with virtualized rows | PARTIAL |
| Markdown reading | Renders Markdown files as styled HTML after sanitizing them | PARTIAL |
| Static HTML reading | Renders local HTML files faithfully in a sandboxed frame: detects the file encoding, removes scripts, blocks all network access with a Content Security Policy and inlines local images, CSS and fonts as `data:` URLs | PARTIAL |
| Interactive HTML mode | For HTML files that contain scripts, an opt-in "Interativo" button runs the page's JavaScript in an isolated frame (opaque origin, no internet, viewport-sized with its own scroll, follows the app's dark mode) | PARTIAL |
| External link confirmation | In interactive mode, links to `http(s)` addresses show a confirmation bar with the real URL before opening in the system browser; links in static HTML open in the system browser directly | PARTIAL |
| Content search | Filters the library to the documents containing a term, highlights the term in the open document (DOCX, XLSX, Markdown and HTML, including text generated by interactive pages; PDF pages are matched in the library but not highlighted) and accepts a double-clicked word as the search term | PARTIAL |
| Zoom | Cycles through three zoom levels (100%, 125%, 150%) and keeps the horizontal scroll centered at the larger levels | PARTIAL |
| Light and dark themes | Toggles between a light and a dark interface and reading area | PARTIAL |
| Electron hardening | Denies all permission requests, downloads and `<webview>` attachments, disables non-proxied WebRTC, and blocks navigation of the app window and of iframes | PARTIAL |

## 🚀 How to run the project

### Requirements

- [Node.js](https://nodejs.org/) with npm. The minimum version is Not defined yet (no `engines` field in `package.json`); the project was verified with Node.js 20.19.2 and npm 9.2.0.
- [Git](https://git-scm.com/), to clone the repository (or download it as a ZIP instead).
- A desktop environment that can open an Electron window. Electron itself is installed by npm as a dev dependency, so nothing else needs to be installed first.
- Internet access: `npm install` downloads the dependencies, and DOCX files are rendered with `docx-preview`, which the app loads from `https://cdn.jsdelivr.net` when it starts. Because this module is imported when `src/app.js` loads, the app needs internet access every time it starts; without it the interface does not work.

### Steps

1. Clone the repository and enter its folder:

   ```bash
   git clone https://github.com/madrijkaard/rkd-firefly-module.git
   cd rkd-firefly-module
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Start the application:

   ```bash
   npm start
   ```

   `npm run dev` runs the same command (`electron .`).

4. In the app window, use **Selecionar arquivos** or **Selecionar pasta** to load DOCX, PDF, XLSX, Markdown or HTML documents. For an HTML file that contains scripts, click **▶ Interativo** to run them.

### Configuration

No configuration is required: there are no environment variables, `.env` files or settings files to edit. Packaging and distribution (installers, builds) are Not defined yet. There is no test command because the project has no tests yet.
