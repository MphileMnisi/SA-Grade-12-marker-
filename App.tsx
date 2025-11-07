import React, { useState, useCallback, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { Loader } from './components/Loader';
import { ResultsDisplay } from './components/ResultsDisplay';
import { markScript } from './services/geminiService';
import type { MarkingResult } from './types';
import { ThemeToggle } from './components/ThemeToggle';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedPrefs = window.localStorage.getItem('theme');
      if (typeof storedPrefs === 'string') {
        return storedPrefs as 'light' | 'dark';
      }
      const userMedia = window.matchMedia('(prefers-color-scheme: dark)');
      if (userMedia.matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark';

    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(theme);

    localStorage.setItem('theme', theme);
  }, [theme]);

  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingResult, setMarkingResult] = useState<MarkingResult | null>(null);

  useEffect(() => {
    if (!scriptFile) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      return;
    }
    const objectUrl = URL.createObjectURL(scriptFile);
    setPreviewUrl(objectUrl);

    // Cleanup function
    return () => URL.revokeObjectURL(objectUrl);
  }, [scriptFile, previewUrl]);

  const handleFileSelect = useCallback((file: File) => {
    setScriptFile(file);
    setMarkingResult(null);
    setError(null);
  }, []);

  const handleReset = () => {
    setScriptFile(null);
    setPreviewUrl(null);
    setMarkingResult(null);
    setError(null);
    setIsLoading(false);
  };

  const handleMarkScript = async () => {
    if (!scriptFile) return;

    setIsLoading(true);
    setError(null);
    setMarkingResult(null);

    try {
      const result = await markScript(scriptFile);
      setMarkingResult(result);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      <main className="container mx-auto">
        <header className="relative text-center mb-12">
          <div className="absolute top-0 right-0 z-10">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 dark:text-slate-100">
            SA Grade 12 Script Marker
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Leverage AI to automatically mark learner scripts and get instant, detailed feedback.
          </p>
        </header>

        <div className="bg-white dark:bg-slate-800/50 p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
          {isLoading ? (
            <Loader />
          ) : error ? (
            <div className="text-center p-8">
              <p className="text-red-500 font-semibold mb-4">{error}</p>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
              >
                Try Again
              </button>
            </div>
          ) : markingResult && previewUrl ? (
            <div>
              <ResultsDisplay result={markingResult} scriptPreviewUrl={previewUrl} />
              <div className="text-center mt-8">
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
                >
                  Mark Another Script
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-6">
              {!scriptFile && (
                <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />
              )}
              {scriptFile && previewUrl && (
                <div className="text-center w-full max-w-lg">
                  <h3 className="text-lg font-semibold mb-2">Script Preview</h3>
                  <div className="border-4 border-slate-200 dark:border-slate-700 rounded-lg p-1">
                    <img src={previewUrl} alt="Script preview" className="rounded-md w-full" />
                  </div>
                  <div className="mt-6 flex justify-center items-center gap-4">
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 bg-slate-500 text-white font-bold rounded-lg shadow-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-opacity-75"
                    >
                      Change File
                    </button>
                    <button
                      onClick={handleMarkScript}
                      className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
                    >
                      Mark Script
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <footer className="text-center mt-12 text-sm text-slate-500 dark:text-slate-400">
          <p>&copy; {new Date().getFullYear()} AI Script Marker. For educational purposes only.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
