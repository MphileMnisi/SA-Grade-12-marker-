import React, { useState } from 'react';
import { MarkingResult } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DownloadIcon } from './icons/DownloadIcon';

interface ResultsDisplayProps {
  result: MarkingResult;
  scriptPreviewUrl: string;
}

const ScoreCard: React.FC<{ title: string; value: string; className?: string }> = ({ title, value, className }) => (
  <div className={`bg-slate-100 dark:bg-slate-700 p-4 rounded-lg text-center ${className}`}>
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
  </div>
);

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, scriptPreviewUrl }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    const resultsElement = document.getElementById('results-to-export');
    if (!resultsElement) {
        console.error("Could not find element to export.");
        return;
    }
    setIsExporting(true);

    // Force light mode styles for a print-friendly PDF
    const wasDarkMode = document.documentElement.classList.contains('dark');
    if (wasDarkMode) {
      document.documentElement.classList.remove('dark');
    }

    try {
        // Allow time for styles to update before capturing
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(resultsElement, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgRatio = imgProps.height / imgProps.width;
        
        let imgWidth = pdfWidth - 20; // 10mm margin on each side
        let imgHeight = imgWidth * imgRatio;

        // If the content is taller than the page, scale it down to fit.
        if (imgHeight > pdfHeight - 20) {
            imgHeight = pdfHeight - 20;
            imgWidth = imgHeight / imgRatio;
        }

        const x = (pdfWidth - imgWidth) / 2; // Center the image horizontally
        const y = 10; // 10mm top margin

        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save('script-marking-results.pdf');

    } catch (error) {
        console.error("Failed to export PDF:", error);
        alert("Sorry, there was an error creating the PDF. Please try again.");
    } finally {
        // Restore dark mode if it was enabled
        if (wasDarkMode) {
            document.documentElement.classList.add('dark');
        }
        setIsExporting(false);
    }
  };


  const percentage = result.totalMarksAvailable > 0
    ? ((result.marksAwarded / result.totalMarksAvailable) * 100).toFixed(1)
    : 0;

  const getPercentageColor = (p: number) => {
    if (p >= 80) return 'text-emerald-500';
    if (p >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">Submitted Script</h2>
        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-md">
            <img src={scriptPreviewUrl} alt="Submitted script" className="rounded-md w-full" />
        </div>
      </div>
      <div className="lg:col-span-3">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Marking Results</h2>
            <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-wait transition-colors"
            >
                <DownloadIcon className="w-5 h-5" />
                {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
        </div>
        
        <div id="results-to-export" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ScoreCard title="Score" value={`${result.marksAwarded} / ${result.totalMarksAvailable}`} />
                <ScoreCard title="Percentage" value={`${percentage}%`} className={getPercentageColor(Number(percentage))} />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Overall Feedback</h3>
                <p className="text-slate-600 dark:text-slate-300">{result.overallFeedback}</p>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">Question Breakdown</h3>
                <div className="space-y-4">
                    {result.questions.map((q, index) => (
                    <div key={index} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md transition hover:shadow-lg">
                        <div className="flex justify-between items-center mb-2">
                        <p className="font-bold text-slate-700 dark:text-slate-200">Question {q.questionNumber}</p>
                        <p className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-3 py-1 rounded-full text-sm">
                            {q.marksAwarded} / {q.maxMarks}
                        </p>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{q.feedback}</p>
                    </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};