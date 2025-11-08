import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FileUpload } from './components/FileUpload';
import { Loader } from './components/Loader';
import { ResultsDisplay } from './components/ResultsDisplay';
import { MemoManager } from './components/CalibrationManager';
import { markScript } from './services/geminiService';
import { Stepper } from './components/Stepper';
import { HomePage } from './components/HomePage';
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

interface ScriptFileWithPreview {
  file: File;
  url: string;
}

const App: React.FC = () => {
  const [schoolInfo, setSchoolInfo] = useState<{name: string, emis: string} | null>(null);
  const [questionPaperFile, setQuestionPaperFile] = useState<File | null>(null);
  const [scriptFiles, setScriptFiles] = useState<ScriptFileWithPreview[]>([]);
  const [questionPaperPreviewUrl, setQuestionPaperPreviewUrl] = useState<string | null>(null);
  const [memoFile, setMemoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingResults, setMarkingResults] = useState<BatchResult[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!questionPaperFile) {
      setQuestionPaperPreviewUrl(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setQuestionPaperPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(questionPaperFile);
  }, [questionPaperFile]);

  const handleQuestionPaperSelect = useCallback((files: File[]) => {
    setQuestionPaperFile(files[0] || null);
    setMarkingResults([]);
    setError(null);
  }, []);

  const handleScriptSelect = useCallback(async (files: File[]) => {
    setMarkingResults([]);
    setError(null);

    if (files.length === 0) {
        setScriptFiles([]);
        return;
    }
    
    try {
        const previewPromises = files.map(file => {
            return new Promise<ScriptFileWithPreview>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve({ file, url: reader.result as string });
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });
        const filesWithUrls = await Promise.all(previewPromises);
        setScriptFiles(filesWithUrls);
    } catch (err) {
        console.error("Error generating file previews:", err);
        setError("Could not generate previews for some files. Please try again.");
        setScriptFiles([]);
    }
  }, []);

  const handleReset = () => {
    setQuestionPaperFile(null);
    setScriptFiles([]);
    setMarkingResults([]);
    setMemoFile(null);
    setError(null);
    setIsLoading(false);
    setCurrentStep(1);
  };
  
  const handleLogin = (name: string, emis: string) => {
    setSchoolInfo({ name, emis });
  };
  
  const handleLogout = () => {
    handleReset();
    setSchoolInfo(null);
  };

  const handleMarkScript = async () => {
    if (!questionPaperFile || scriptFiles.length === 0) return;

    setIsLoading(true);
    setError(null);
    setMarkingResults([]);

    try {
      const promises = scriptFiles.map(item => markScript(questionPaperFile, item.file, memoFile));
      const settledResults = await Promise.allSettled(promises);

      const newResults: BatchResult[] = settledResults.map((res, index) => {
        const scriptFile = scriptFiles[index].file;
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
  
  const stepComponents = {
    1: ( // Step 1: Upload Question Paper
      <div className="w-full flex flex-col items-center text-center">
        <h3 className="text-xl font-semibold mb-4 text-slate-700">
          Upload Question Paper
        </h3>
        {!questionPaperFile || !questionPaperPreviewUrl ? (
          <FileUpload 
            onFileSelect={handleQuestionPaperSelect} 
            disabled={isLoading}
            promptText={<span>Drop <strong>Question Paper</strong> here, or </span>}
          />
        ) : (
          <div className="w-full max-w-2xl mx-auto">
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
    ),
    2: ( // Step 2: Upload Memo
      <div className="w-full max-w-4xl mx-auto">
         <div className="text-center">
              <h3 className="text-xl font-semibold mb-4 text-slate-700">
              Upload a Memo
              </h3>
              <p className="text-sm text-slate-500 max-w-2xl mx-auto mb-4">
                  Upload the marking memo for the AI to use as a reference. This helps improve marking accuracy.
              </p>
         </div>
        <MemoManager 
          memoFile={memoFile}
          onMemoFileSelect={setMemoFile}
          disabled={isLoading}
        />
      </div>
    ),
    3: ( // Step 3: Upload Answer Sheets
      <div className="w-full flex flex-col items-center text-center">
        <h3 className="text-xl font-semibold mb-4 text-slate-700">
          Upload Answer Sheets
        </h3>
        {scriptFiles.length === 0 ? (
          <FileUpload 
            onFileSelect={handleScriptSelect} 
            disabled={isLoading}
            promptText={<span>Drop one or more <strong>Answer Sheets</strong> here, or </span>}
            multiple={true}
          />
        ) : (
          <div className="w-full max-w-2xl mx-auto">
            <div className="border-4 border-slate-200 rounded-lg p-2 mb-4 h-48">
              <div className="h-full overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {scriptFiles.map((item, index) => (
                  <div key={index} className="relative aspect-square bg-slate-100 rounded-md overflow-hidden group">
                     <UploadPreview file={item.file} url={item.url} />
                     <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center truncate transition-opacity opacity-0 group-hover:opacity-100" title={item.file.name}>
                      {item.file.name}
                     </div>
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
    ),
  };

  const renderUploadState = () => (
    <div className="flex flex-col items-center">
        <div className="w-full max-w-4xl mb-12">
            <Stepper 
                currentStep={currentStep}
                steps={['Question Paper', 'Marking Memo', 'Answer Sheets']}
            />
        </div>
        
        <div className="w-full">
            {stepComponents[currentStep as keyof typeof stepComponents]}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 w-full flex justify-center gap-4">
           {currentStep > 1 && (
                <button
                    onClick={() => setCurrentStep(s => s - 1)}
                    className="px-8 py-3 bg-slate-500 text-white text-lg font-bold rounded-lg shadow-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-opacity-75 disabled:opacity-50"
                >
                    Back
                </button>
           )}
           {currentStep < 3 && (
               <button
                    onClick={() => setCurrentStep(s => s + 1)}
                    disabled={!questionPaperFile}
                    className="px-8 py-3 bg-indigo-600 text-white text-lg font-bold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
           )}
           {currentStep === 3 && (
                 <button
                    onClick={handleMarkScript}
                    disabled={isLoading || scriptFiles.length === 0}
                    className="px-10 py-4 bg-indigo-600 text-white text-lg font-bold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-wait transition-transform transform hover:scale-105"
                >
                    Mark {scriptFiles.length} {scriptFiles.length === 1 ? 'Script' : 'Scripts'} Now
                </button>
           )}
        </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-slate-50/80 backdrop-blur-sm text-slate-900">
      {!schoolInfo ? (
        <HomePage onLogin={handleLogin} />
      ) : (
        <div className="p-4 sm:p-6 lg:p-8">
            <main className="container mx-auto">
            <header className="relative text-center mb-12">
                <div className="absolute top-0 right-0">
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        Logout
                    </button>
                </div>
                <img 
                    src="https://assitej.org.za/wp-content/uploads/2021/04/RSA-Basic-Education-LOGO.jpg" 
                    alt="Department of Basic Education Logo" 
                    className="h-20 mx-auto mb-6"
                />
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
                ) : markingResults.length > 0 ? (
                <div>
                    <ResultsDisplay 
                    results={markingResults}
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
                <p className="font-semibold">{schoolInfo.name} (EMIS: {schoolInfo.emis})</p>
                <p>&copy; {new Date().getFullYear()} AI Script Marker. For educational purposes only.</p>
            </footer>
            </main>
        </div>
      )}
    </div>
  );
};

export default App;