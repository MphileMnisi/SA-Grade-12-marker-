import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FileUpload } from './FileUpload';

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

interface MemoManagerProps {
  memoFile: File | null;
  onMemoFileSelect: (file: File | null) => void;
  disabled: boolean;
}

export const MemoManager: React.FC<MemoManagerProps> = ({ memoFile, onMemoFileSelect, disabled }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!memoFile) {
            setPreviewUrl(null);
            return;
        }
        // Create a new URL if the file changes
        const url = URL.createObjectURL(memoFile);
        setPreviewUrl(url);

        // Clean up the object URL when the component unmounts or the file changes
        return () => URL.revokeObjectURL(url);
    }, [memoFile]);

    const handleFileSelect = useCallback((files: File[]) => {
        onMemoFileSelect(files[0] || null);
    }, [onMemoFileSelect]);

    return (
        <div className="w-full flex flex-col items-center text-center">
            {!memoFile || !previewUrl ? (
                <FileUpload 
                    onFileSelect={handleFileSelect} 
                    disabled={disabled}
                    promptText={<span>Drop <strong>Marking Memo</strong> here, or </span>}
                />
            ) : (
                <div className="w-full max-w-2xl mx-auto">
                    <div className="border-4 border-slate-200 rounded-lg p-1 mb-4 h-48 flex">
                        <UploadPreview file={memoFile} url={previewUrl} />
                    </div>
                    <button
                        onClick={() => onMemoFileSelect(null)}
                        className="px-6 py-2 bg-slate-500 text-white font-bold rounded-lg shadow-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-opacity-75"
                    >
                        Change Memo
                    </button>
                </div>
            )}
        </div>
    );
};
