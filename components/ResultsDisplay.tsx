import React, { useState } from 'react';
import { MarkingResult } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DownloadIcon } from './icons/DownloadIcon';
import JSZip from 'jszip';


interface ResultsDisplayProps {
  results: Array<{ 
    scriptFile: File; 
    result: MarkingResult | null; 
    error?: string 
  }>;
}

const ScoreCard: React.FC<{ title: string; value: string; className?: string }> = ({ title, value, className }) => (
  <div className={`bg-slate-100 p-4 rounded-lg text-center ${className}`}>
    <p className="text-sm font-medium text-slate-500">{title}</p>
    <p className="text-3xl font-bold text-slate-800">{value}</p>
  </div>
);

const getPercentageColor = (p: number) => {
    if (p >= 80) return 'text-emerald-500';
    if (p >= 50) return 'text-amber-500';
    return 'text-red-500';
};


const IndividualResultCard: React.FC<{
  item: { scriptFile: File; result: MarkingResult | null; error?: string };
  index: number;
}> = ({ item, index }) => {
  const { scriptFile, result, error } = item;
  const [isExporting, setIsExporting] = useState(false);
  const elementId = `result-card-to-export-${index}`;

  const handleExportPDF = async () => {
    const resultsElement = document.getElementById(elementId);
    if (!resultsElement) {
        console.error("Could not find element to export.");
        return;
    }
    setIsExporting(true);

    try {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = await html2canvas(resultsElement, { 
            scale: 2, 
            useCORS: true,
            backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgRatio = imgProps.height / imgProps.width;
        
        let imgWidth = pdfWidth - 20;
        let imgHeight = imgWidth * imgRatio;

        if (imgHeight > pdfHeight - 20) {
            imgHeight = pdfHeight - 20;
            imgWidth = imgHeight / imgRatio;
        }

        const x = (pdfWidth - imgWidth) / 2;
        const y = 10;

        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`${scriptFile.name.replace(/\.[^/.]+$/, "")}-results.pdf`);

    } catch (error) {
        console.error("Failed to export PDF:", error);
        alert("Sorry, there was an error creating the PDF. Please try again.");
    } finally {
        setIsExporting(false);
    }
  };

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
        <h4 className="font-bold text-slate-800 truncate">{scriptFile.name}</h4>
        <p className="text-red-600 mt-2 font-medium">Error: {error}</p>
      </div>
    );
  }

  if (!result) return null;

  const percentage = result.totalMarksAvailable > 0
    ? ((result.marksAwarded / result.totalMarksAvailable) * 100).toFixed(1)
    : "0";

  return (
    <div className="bg-white p-6 rounded-lg shadow-md transition-shadow hover:shadow-xl border border-slate-200">
        <div className="flex justify-between items-start mb-4">
            <h4 className="text-xl font-bold text-slate-800 truncate pr-4">{scriptFile.name}</h4>
            <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-wait transition-colors flex-shrink-0"
            >
                <DownloadIcon className="w-5 h-5" />
                {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
        </div>
        <div id={elementId} className="space-y-6 bg-white p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ScoreCard title="Score" value={`${result.marksAwarded} / ${result.totalMarksAvailable}`} />
                <ScoreCard title="Percentage" value={`${percentage}%`} className={getPercentageColor(Number(percentage))} />
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-slate-700 mb-2">Overall Feedback</h3>
                <p className="text-slate-600 text-sm">{result.overallFeedback}</p>
            </div>
            <div>
                <h3 className="text-md font-semibold text-slate-700 mb-3">Question Breakdown</h3>
                <div className="space-y-3">
                    {result.questions.map((q, index) => (
                    <div key={index} className="bg-slate-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                            <p className="font-bold text-slate-700 text-sm">Question {q.questionNumber}</p>
                            <p className="font-semibold text-indigo-600 bg-indigo-100 px-2.5 py-0.5 rounded-full text-xs">
                                {q.marksAwarded} / {q.maxMarks}
                            </p>
                        </div>
                        <p className="text-xs text-slate-600">{q.feedback}</p>
                    </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  const [isZipping, setIsZipping] = useState(false);

  const handleDownloadAll = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      const pdfPromises = results.map(async (item, index) => {
        if (!item.result || item.error) return null;

        const element = document.getElementById(`result-card-to-export-${index}`);
        if (!element) return null;

        await new Promise(resolve => setTimeout(resolve, 50));

        const canvas = await html2canvas(element, { 
            scale: 2, 
            useCORS: true,
            backgroundColor: '#ffffff' 
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgRatio = imgProps.height / imgProps.width;
        
        let imgWidth = pdfWidth - 20;
        let imgHeight = imgWidth * imgRatio;

        if (imgHeight > pdfHeight - 20) {
            imgHeight = pdfHeight - 20;
            imgWidth = imgHeight / imgRatio;
        }
        
        const x = (pdfWidth - imgWidth) / 2;
        const y = 10;
        
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        
        const pdfBlob = pdf.output('blob');
        const fileName = `${item.scriptFile.name.replace(/\.[^/.]+$/, "")}-results.pdf`;
        
        return { fileName, pdfBlob };
      });

      const generatedPdfs = (await Promise.all(pdfPromises)).filter(p => p !== null) as { fileName: string, pdfBlob: Blob }[];

      if (generatedPdfs.length === 0) {
        alert("No successful results to download.");
        return;
      }

      for (const pdfData of generatedPdfs) {
        zip.file(pdfData.fileName, pdfData.pdfBlob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = 'All-Script-Results.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error("Failed to create ZIP archive:", error);
      alert("Sorry, there was an error creating the ZIP file. Please try again.");
    } finally {
      setIsZipping(false);
    }
  };


  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">
            Marking Results ({results.length} {results.length === 1 ? 'Script' : 'Scripts'})
        </h2>
        {results.some(r => r.result && !r.error) && (
          <button
            onClick={handleDownloadAll}
            disabled={isZipping}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-wait transition-colors"
          >
            <DownloadIcon className="w-5 h-5" />
            {isZipping ? 'Zipping...' : 'Download All Results'}
          </button>
        )}
      </div>
      <div className="space-y-6">
        {results.map((item, index) => (
          <IndividualResultCard key={index} item={item} index={index} />
        ))}
      </div>
    </div>
  );
};