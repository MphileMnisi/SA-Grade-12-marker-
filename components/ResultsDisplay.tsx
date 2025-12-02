import React, { useState, useMemo } from 'react';
import { MarkingResult } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DownloadIcon } from './icons/DownloadIcon';
import JSZip from 'jszip';
import { AnalyticsDashboard } from './AnalyticsDashboard';


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
  const [sortCriteria, setSortCriteria] = useState<'name' | 'score' | 'percentage'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const sortedResults = useMemo(() => {
    const items = [...results];
    
    return items.sort((a, b) => {
      // Always put errors at the bottom for score/percentage sorts
      if (sortCriteria !== 'name') {
        if (!a.result && !b.result) return 0;
        if (!a.result) return 1;
        if (!b.result) return -1;
      }

      let comparison = 0;
      
      switch (sortCriteria) {
        case 'name':
          comparison = a.scriptFile.name.localeCompare(b.scriptFile.name, undefined, { numeric: true, sensitivity: 'base' });
          break;
        case 'score':
          // We know result exists due to check above
          comparison = (a.result!.marksAwarded) - (b.result!.marksAwarded);
          break;
        case 'percentage':
          const pA = a.result!.marksAwarded / a.result!.totalMarksAvailable;
          const pB = b.result!.marksAwarded / b.result!.totalMarksAvailable;
          comparison = pA - pB;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [results, sortCriteria, sortDirection]);

  const handleDownloadAll = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Use sortedResults so the loop index matches the DOM IDs generated by the map function below
      const pdfPromises = sortedResults.map(async (item, index) => {
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

  const handleExportCSV = () => {
    if (sortedResults.length === 0) return;

    // Header row
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Script Name,Total Marks Awarded,Total Marks Available,Percentage,Overall Feedback\n";

    sortedResults.forEach(item => {
        if (item.result) {
            const percentage = ((item.result.marksAwarded / item.result.totalMarksAvailable) * 100).toFixed(1);
            // Escape commas in the feedback/name to avoid breaking CSV format
            const safeName = `"${item.scriptFile.name.replace(/"/g, '""')}"`;
            const safeFeedback = `"${item.result.overallFeedback.replace(/"/g, '""')}"`;
            
            csvContent += `${safeName},${item.result.marksAwarded},${item.result.totalMarksAvailable},${percentage}%,${safeFeedback}\n`;
        }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "class_marks_summary.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
       {/* New Analytics Dashboard */}
       {results.length > 0 && <AnalyticsDashboard results={results} />}

       <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-200 pt-8">
        <h2 className="text-2xl font-bold text-slate-800">
            Individual Scripts ({results.length})
        </h2>

        {results.length > 1 && (
            <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                <label htmlFor="sort-criteria" className="text-sm font-medium text-slate-600 pl-2">Sort by:</label>
                <select 
                    id="sort-criteria"
                    value={sortCriteria} 
                    onChange={(e) => setSortCriteria(e.target.value as any)}
                    className="border-slate-300 rounded-md text-slate-700 text-sm py-1.5 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer bg-slate-50"
                >
                    <option value="name">Script Name</option>
                    <option value="score">Score</option>
                    <option value="percentage">Percentage</option>
                </select>
                <button 
                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-600 transition-colors"
                    title={sortDirection === 'asc' ? "Ascending" : "Descending"}
                >
                     {sortDirection === 'asc' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
                        </svg>
                     ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
                        </svg>
                     )}
                </button>
            </div>
        )}

        {results.some(r => r.result && !r.error) && (
          <div className="flex gap-3">
             <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-75 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 18.375v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 18.375c0 .621.504 1.125 1.125 1.125" />
                </svg>
                Export CSV
            </button>
            <button
                onClick={handleDownloadAll}
                disabled={isZipping}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-wait transition-colors"
            >
                <DownloadIcon className="w-5 h-5" />
                {isZipping ? 'Zipping...' : 'Download ZIP'}
            </button>
          </div>
        )}
      </div>
      <div className="space-y-6">
        {sortedResults.map((item, index) => (
          <IndividualResultCard key={index} item={item} index={index} />
        ))}
      </div>
    </div>
  );
};