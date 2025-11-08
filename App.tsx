import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FileUpload } from './components/FileUpload';
import { Loader } from './components/Loader';
import { ResultsDisplay } from './components/ResultsDisplay';
import { markScript } from './services/geminiService';
import type { MarkingResult } from './types';

const PdfPreviewThumbnail: React.FC<{ file: File }> = ({ file }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = useState('');

    useEffect(() => {
        const renderPdf = async () => {
            if (!file || !canvasRef.current) return;

            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            if (!context) {
                setStatus('error');
                setError('Could not get canvas context.');
                return;
            }

            setStatus('loading');
            const fileReader = new FileReader();

            fileReader.onload = async function() {
                const typedarray = new Uint8Array(this.result as ArrayBuffer);
                try {
                    const pdfjsLib = await import('pdfjs-dist');
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    const page = await pdf.getPage(1);

                    const desiredWidth = 300; // Render at a higher resolution for clarity
                    const viewport = page.getViewport({ scale: 1 });
                    const scale = desiredWidth / viewport.width;
                    const scaledViewport = page.getViewport({ scale });
                    
                    canvas.width = scaledViewport.width;
                    canvas.height = scaledViewport.height;

                    const renderContext = {
                        canvasContext: context,
                        viewport: scaledViewport
                    };
                    await page.render(renderContext).promise;
                    setStatus('success');
                } catch (reason) {
                    console.error('Error rendering PDF preview:', reason);
                    setStatus('error');
                    setError('Could not render PDF preview.');
                }
            };

            fileReader.onerror = () => {
                 setStatus('error');
                 setError('Could not read file.');
            };

            fileReader.readAsArrayBuffer(file);
        };
        
        renderPdf();

    }, [file]);

    return (
        <div className="w-full h-full flex items-center justify-center bg-slate-200 rounded-md">
            {status === 'loading' && <p className="text-slate-500 text-sm">Loading Preview...</p>}
            {status === 'error' && <p className="text-red-500 text-sm p-2 text-center">{error}</p>}
            <canvas ref={canvasRef} className={`${status === 'success' ? 'block' : 'hidden'} w-full h-full object-contain`}></canvas>
        </div>
    );
};


const UploadPreview: React.FC<{file: File, url: string}> = ({ file, url }) => {
  if (file.type.startsWith('image/')) {
    return <img src={url} alt={`${file.name} preview`} className="rounded-md w-full h-full object-contain" />;
  }
  
  if (file.type === 'application/pdf') {
    return (
      <PdfPreviewThumbnail file={file} />
    )
  }

  return (
    <div className="flex flex-col items-center justify-center text-center p-4 bg-slate-100 rounded-lg w-full h-full">
        <p>Unsupported file type</p>
    </div>
  );
}

interface BatchResult {
  scriptFile: File;
  result: MarkingResult | null;
  error?: string;
}

const App: React.FC = () => {
  const [questionPaperFile, setQuestionPaperFile] = useState<File | null>(null);
  const [scriptFiles, setScriptFiles] = useState<File[]>([]);
  const [questionPaperPreviewUrl, setQuestionPaperPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingResults, setMarkingResults] = useState<BatchResult[]>([]);

  useEffect(() => {
    if (!questionPaperFile) {
      if (questionPaperPreviewUrl) {
        URL.revokeObjectURL(questionPaperPreviewUrl);
        setQuestionPaperPreviewUrl(null);
      }
      return;
    }
    const objectUrl = URL.createObjectURL(questionPaperFile);
    setQuestionPaperPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [questionPaperFile]);

  const handleQuestionPaperSelect = useCallback((files: File[]) => {
    setQuestionPaperFile(files[0] || null);
    setMarkingResults([]);
    setError(null);
  }, []);

  const handleScriptSelect = useCallback((files: File[]) => {
    setScriptFiles(files);
    setMarkingResults([]);
    setError(null);
  }, []);

  const handleReset = () => {
    setQuestionPaperFile(null);
    setScriptFiles([]);
    setMarkingResults([]);
    setError(null);
    setIsLoading(false);
  };

  const handleMarkScript = async () => {
    if (!questionPaperFile || scriptFiles.length === 0) return;

    setIsLoading(true);
    setError(null);
    setMarkingResults([]);

    try {
      const promises = scriptFiles.map(scriptFile => markScript(questionPaperFile, scriptFile));
      const settledResults = await Promise.allSettled(promises);

      const newResults: BatchResult[] = settledResults.map((res, index) => {
        const scriptFile = scriptFiles[index];
        if (res.status === 'fulfilled') {
          return { scriptFile, result: res.value, error: undefined };
        } else {
          console.error(`Marking failed for ${scriptFile.name}:`, res.reason);
          const errorMessage = res.reason instanceof Error ? res.reason.message : 'Marking failed for an unknown reason.';
          return { scriptFile, result: null, error: errorMessage };
        }
      });
      setMarkingResults(newResults);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during batch processing.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderUploadState = () => (
    <div className="flex flex-col items-center">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Question Paper Column */}
        <div className="flex flex-col items-center text-center">
          <h3 className="text-xl font-semibold mb-4 text-slate-700">
            1. Upload Question Paper
          </h3>
          {!questionPaperFile || !questionPaperPreviewUrl ? (
            <FileUpload 
              onFileSelect={handleQuestionPaperSelect} 
              disabled={isLoading}
              promptText={<span>Drop <strong>Question Paper</strong> here, or </span>}
            />
          ) : (
            <div className="w-full max-w-md">
              <div className="border-4 border-slate-200 rounded-lg p-1 mb-4 h-48 flex">
                <UploadPreview file={questionPaperFile} url={questionPaperPreviewUrl} />
              </div>
              <button
                onClick={() => setQuestionPaperFile(null)}
                className="px-6 py-2 bg-slate-500 text-white font-bold rounded-lg shadow-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-opacity-75"
              >
                Change Question Paper
              </button>
            </div>
          )}
        </div>

        {/* Answer Sheet Column */}
        <div className="flex flex-col items-center text-center">
          <h3 className="text-xl font-semibold mb-4 text-slate-700">
            2. Upload Answer Sheets
          </h3>
          {scriptFiles.length === 0 ? (
            <FileUpload 
              onFileSelect={handleScriptSelect} 
              disabled={isLoading || !questionPaperFile}
              promptText={<span>Drop one or more <strong>Answer Sheets</strong> here, or </span>}
              multiple={true}
            />
          ) : (
            <div className="w-full max-w-md">
              <div className="border-4 border-slate-200 rounded-lg p-2 mb-4 h-48">
                <div className="h-full overflow-y-auto pr-2">
                  {scriptFiles.map((file, index) => (
                    <div key={index} className="flex items-center bg-slate-100 rounded p-2 mb-2 text-left">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                       <p className="font-medium text-slate-700 text-sm truncate flex-grow" title={file.name}>{file.name}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setScriptFiles([])}
                className="px-6 py-2 bg-slate-500 text-white font-bold rounded-lg shadow-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-opacity-75"
              >
                Clear All Scripts
              </button>
            </div>
          )}
        </div>
      </div>
      
      {questionPaperFile && scriptFiles.length > 0 && (
        <div className="mt-10">
          <button
            onClick={handleMarkScript}
            disabled={isLoading}
            className="px-10 py-4 bg-indigo-600 text-white text-lg font-bold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-wait transition-transform transform hover:scale-105"
          >
            Mark {scriptFiles.length} {scriptFiles.length === 1 ? 'Script' : 'Scripts'} Now
          </button>
        </div>
      )}
    </div>
  );


  return (
    <div className="min-h-screen bg-slate-50/80 backdrop-blur-sm text-slate-900 p-4 sm:p-6 lg:p-8">
      <main className="container mx-auto">
        <header className="relative text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800">
            SA Grade 12 Script Marker
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Leverage AI to automatically mark learner scripts and get instant, detailed feedback.
          </p>
        </header>

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200">
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
          ) : markingResults.length > 0 && questionPaperPreviewUrl && questionPaperFile ? (
            <div>
              <ResultsDisplay 
                results={markingResults}
                questionPaperPreviewUrl={questionPaperPreviewUrl} 
                questionPaperFileType={questionPaperFile.type}
              />
              <div className="text-center mt-8">
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
                >
                  Mark More Scripts
                </button>
              </div>
            </div>
          ) : (
            renderUploadState()
          )}
        </div>
        <footer className="text-center mt-12 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} AI Script Marker. For educational purposes only.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;