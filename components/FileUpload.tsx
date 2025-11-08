import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  disabled: boolean;
  promptText: React.ReactNode;
  multiple?: boolean;
}

// Define constants for validation
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const SUPPORTED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];


export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled, promptText, multiple = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const validateAndSelectFiles = (files: FileList | null) => {
    setUploadError(null);
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);
    const validationErrors: string[] = [];

    for (const file of selectedFiles) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        validationErrors.push(`'${file.name}' is too large (max ${MAX_FILE_SIZE_MB}MB).`);
      }
      if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
        validationErrors.push(`'${file.name}' has an unsupported type.`);
      }
    }

    if (validationErrors.length > 0) {
      setUploadError(validationErrors.join(' '));
      return;
    }

    onFileSelect(selectedFiles);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndSelectFiles(e.target.files);
     // Reset the input value to allow re-selecting the same file(s)
    e.target.value = '';
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setUploadError(null);
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled) {
      validateAndSelectFiles(e.dataTransfer.files);
    }
  }, [disabled, onFileSelect]);

  const hasError = uploadError !== null;
  const borderClasses = hasError 
    ? 'border-red-500' 
    : isDragging 
    ? 'border-indigo-600' 
    : 'border-slate-300';
    
  const backgroundClasses = hasError 
    ? 'bg-red-50' 
    : isDragging 
    ? 'bg-indigo-50' 
    : 'bg-white';
    
  const interactionClasses = disabled 
    ? 'opacity-50 cursor-not-allowed' 
    : 'cursor-pointer hover:border-slate-400';

  return (
    <div className="w-full max-w-2xl mx-auto">
      <label
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex justify-center w-full h-48 px-4 transition ${backgroundClasses} border-2 ${borderClasses} border-dashed rounded-md appearance-none ${interactionClasses}`}
      >
        <span className="flex items-center space-x-2 text-center">
            {hasError ? (
                <span className="font-medium text-red-600">{uploadError}</span>
            ) : (
                <>
                    <UploadIcon className="w-8 h-8 text-slate-500" />
                    <span className="font-medium text-slate-600">
                        {promptText}
                        <span className="text-indigo-600 underline">browse</span>
                    </span>
                </>
            )}
        </span>
        <input
          type="file"
          name="file_upload"
          className="hidden"
          accept="image/png, image/jpeg, image/webp, application/pdf"
          onChange={handleFileChange}
          disabled={disabled}
          multiple={multiple}
        />
      </label>
    </div>
  );
};