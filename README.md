# SA Grade 12 Script Marker

An AI-powered web application designed to assist South African teachers in automatically marking Grade 12 learner scripts. By leveraging the Google Gemini API, this tool analyzes handwritten answers against a provided question paper and marking memo, generating detailed feedback, marks, and class analytics.

## 🌟 Key Features

*   **AI-Powered Marking**: Uses `gemini-2.5-flash` to analyze student scripts (PDF or Images) against question papers.
*   **Marking Memos**: Upload official marking memos (ground truth) to significantly increase accuracy.
*   **Batch Processing**: Upload and mark multiple scripts simultaneously.
*   **Class Analytics**:
    *   View class averages, pass rates, and top scores.
    *   Identify "Hardest" and "Easiest" questions to guide remedial teaching.
*   **Results Management**:
    *   **Export PDF**: Download marked scripts with annotated feedback.
    *   **Export CSV**: Download a spreadsheet of class marks for administrative systems (e.g., SASAMS).
    *   **Sorting**: Sort results by Name, Score, or Percentage.
*   **AI Assistant**: Built-in chatbot to answer questions about the app or the curriculum.

## 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS
*   **AI Model**: Google Gemini API (`@google/genai`)
*   **PDF Handling**: `jspdf`, `html2canvas`, `pdfjs-dist`
*   **Build Tool**: Vite (recommended for local development)

## 🚀 Getting Started

### Prerequisites

1.  **Node.js** (v18 or higher)
2.  **Google Gemini API Key**: Get one at [aistudio.google.com](https://aistudio.google.com).

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/sa-script-marker.git
    cd sa-script-marker
    ```

2.  **Install dependencies**
    ```bash
    npm install react react-dom @google/genai jspdf html2canvas jszip
    ```

3.  **Configuration**
    This application requires an API Key to function. Set the `API_KEY` environment variable or use the AI Studio key selection dialog if integrated.

4.  **Run the Application**
    ```bash
    npm run dev
    ```

## 📖 Usage Guide

1.  **Upload Question Paper**: Drag and drop the PDF or Image of the blank question paper.
2.  **Upload Memo**: (Optional but Recommended) Upload the teacher's marking guideline.
3.  **Upload Scripts**: Select one or multiple student answer sheets (Images or PDFs).
4.  **Mark**: Click "Mark Scripts". The AI will process them in parallel.
5.  **Analyze**:
    *   Review individual scripts.
    *   Check the "Analytics Dashboard" for class performance.
    *   Download results as a ZIP or CSV.

---
*Disclaimer: This tool is designed to assist teachers, not replace them. Always review AI-generated marks for accuracy before finalizing grades.*