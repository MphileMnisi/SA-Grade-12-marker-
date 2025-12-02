# SA Grade 12 Script Marker

An AI-powered web application designed to assist South African teachers in automatically marking Grade 12 learner scripts. By leveraging the Google Gemini API, this tool analyzes handwritten answers against a provided question paper and marking memo, generating detailed feedback, marks, and class analytics.

![App Screenshot Placeholder](https://via.placeholder.com/800x400?text=SA+Grade+12+Script+Marker)

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
*   **School Authentication**: Secure sign-up and login for schools using Firebase (with LocalStorage fallback for demo purposes).
*   **Dark Mode**: Fully accessible UI with light/dark theme toggling.
*   **AI Assistant**: Built-in chatbot to answer questions about the app or the curriculum.

## 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS
*   **AI Model**: Google Gemini API (`@google/genai`)
*   **Database/Auth**: Firebase Firestore (optional, falls back to LocalStorage)
*   **PDF Handling**: `jspdf`, `html2canvas`, `pdfjs-dist`
*   **Build Tool**: Vite (recommended for local development)

## 🚀 Getting Started

### Prerequisites

1.  **Node.js** (v18 or higher)
2.  **Google Gemini API Key**: Get one at [aistudio.google.com](https://aistudio.google.com).
3.  **Firebase Project** (Optional): Create a project at [console.firebase.google.com](https://console.firebase.google.com).

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/sa-script-marker.git
    cd sa-script-marker
    ```

2.  **Install dependencies**
    *Note: The current source uses ES Modules via CDN in `index.html`. To run locally with a build step, install equivalent packages:*
    ```bash
    npm install react react-dom @google/genai jspdf html2canvas jszip firebase
    npm install -D tailwindcss postcss autoprefixer vite
    ```

3.  **Configuration**

    This application requires an API Key to function.

    *   **Option A (Environment Variable)**: Create a `.env` file in the root directory:
        ```env
        API_KEY=your_google_gemini_api_key_here
        ```
    *   **Option B (Firebase)**: Update `services/firebase.ts` with your Firebase config object to enable cloud persistence.

4.  **Run the Application**

    ```bash
    npm run dev
    ```

## 📖 Usage Guide

1.  **Register/Login**: Enter your School Name and EMIS number.
2.  **Upload Question Paper**: Drag and drop the PDF or Image of the blank question paper.
3.  **Upload Memo**: (Optional but Recommended) Upload the teacher's marking guideline.
4.  **Upload Scripts**: Select one or multiple student answer sheets (Images or PDFs).
5.  **Mark**: Click "Mark Scripts". The AI will process them in parallel.
6.  **Analyze**:
    *   Review individual scripts.
    *   Check the "Analytics Dashboard" for class performance.
    *   Download results as a ZIP or CSV.

## 🔒 Privacy & Security

*   **Data Processing**: Student scripts are sent to the Google Gemini API for analysis. Ensure you comply with your school's data privacy policies regarding student work.
*   **Authentication**: Default storage is local. For production use, ensure Firebase security rules are configured correctly.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
*Disclaimer: This tool is designed to assist teachers, not replace them. Always review AI-generated marks for accuracy before finalizing grades.*
