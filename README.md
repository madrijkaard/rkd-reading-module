# Reading Module

<p align="center">
  A focused desktop reader for DOCX documents, built for a clean and comfortable reading experience.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Electron-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/language-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/document-DOCX-2B579A?style=for-the-badge&logo=microsoftword&logoColor=white" alt="DOCX">
</p>

## ✨ About the project

Reading Module is a desktop application for loading, browsing, searching, and reading DOCX files. Documents are rendered locally in a simple two-pane interface: a document library on the left and the reading area on the right.

The application works entirely in memory during the current session. It does not require a backend, database, or account.

## 📚 Table of contents

- [Technologies](#-technologies)
- [Features](#-features)
- [Getting started](#-getting-started)
- [Project structure](#-project-structure)

## 🛠 Technologies

| Technology | Purpose |
| --- | --- |
| [Electron](https://www.electronjs.org/) | Desktop application runtime |
| HTML | User interface structure |
| CSS | Layout, styling, responsive behavior, and themes |
| JavaScript | Application logic and user interactions |
| [docx-preview](https://www.npmjs.com/package/docx-preview) | DOCX rendering in the reading area |
| Node.js / npm | Runtime and dependency management |

## 🚀 Features

### Document loading

- Load one or multiple `.docx` files at once.
- Load DOCX files from a selected folder.
- Ignore unsupported file formats and notify the user when an invalid file is selected.

### Document library

- View all loaded documents in a dedicated sidebar.
- See the document name, file type, thumbnail preview, and total document count.
- Open any document with a single click.
- Remove individual documents or clear the entire library.

### Reading experience

- Render DOCX content in the main reading area.
- Preserve the document's page breaks during rendering.
- Switch between light and dark themes.
- Toggle between the current zoom and a view fitted to the reading area's width.

### Content search

- Search for words or phrases across loaded documents.
- Highlight matching documents in the library.
- Highlight matching terms in the active document.
- Double-click selected text in the document to use it as a search term.

## 📁 Project structure

```text
├── electron/
│   └── main.cjs       # Electron main process
├── src/
│   ├── app.js         # Application logic and interactions
│   ├── index.html     # Main interface
│   └── styles.css     # Application styles
├── package.json       # Scripts and dependencies
└── README.md          # Project documentation
```

## 🧭 Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) installed.
- npm, usually included with Node.js.

### Installation

Clone or download the repository, then install its dependencies from the project root:

```bash
npm install
```

### Run the application

Start the desktop application with:

```bash
npm start
```

The development command is also available:

```bash
npm run dev
```

Once the application opens, use the file or folder selection buttons to load DOCX documents.

## 📄 License

This project is distributed under the terms described in [LICENSE](LICENSE).
