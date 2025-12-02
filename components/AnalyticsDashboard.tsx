import React, { useMemo } from 'react';
import { MarkingResult } from '../types';

interface AnalyticsDashboardProps {
  results: Array<{ scriptFile: File; result: MarkingResult | null }>;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ results }) => {
  const stats = useMemo(() => {
    const validResults = results
      .map(r => r.result)
      .filter((r): r is MarkingResult => r !== null);

    if (validResults.length === 0) return null;

    // 1. General Stats
    const totalScripts = validResults.length;
    const totalAvailableMarks = validResults[0].totalMarksAvailable || 100; // Assume consistent papers
    const totalMarksAchieved = validResults.reduce((sum, r) => sum + r.marksAwarded, 0);
    const averageScore = totalMarksAchieved / totalScripts;
    const averagePercentage = (averageScore / totalAvailableMarks) * 100;

    const passCount = validResults.filter(r => (r.marksAwarded / r.totalMarksAvailable) >= 0.5).length;
    const passRate = (passCount / totalScripts) * 100;

    const sortedScores = [...validResults].sort((a, b) => b.marksAwarded - a.marksAwarded);
    const highestScore = sortedScores[0].marksAwarded;
    const lowestScore = sortedScores[sortedScores.length - 1].marksAwarded;

    // 2. Question Analysis
    // Map question numbers to accumulators
    const questionStats = new Map<string, { totalAwarded: number; max: number; count: number }>();

    validResults.forEach(script => {
      script.questions.forEach(q => {
        const key = q.questionNumber;
        const current = questionStats.get(key) || { totalAwarded: 0, max: q.maxMarks, count: 0 };
        current.totalAwarded += q.marksAwarded;
        current.count += 1;
        // Ensure we capture the max marks if not set correctly initially
        if (current.max === 0) current.max = q.maxMarks; 
        questionStats.set(key, current);
      });
    });

    const questionPerformance = Array.from(questionStats.entries()).map(([qNum, data]) => {
      const avg = data.totalAwarded / data.count;
      const percentage = (avg / data.max) * 100;
      return { qNum, percentage, avg, max: data.max };
    });

    // Sort by difficulty (percentage)
    questionPerformance.sort((a, b) => a.percentage - b.percentage);

    const hardestQuestions = questionPerformance.slice(0, 3);
    const easiestQuestions = questionPerformance.slice(-3).reverse();

    return {
      totalScripts,
      averageScore,
      averagePercentage,
      passRate,
      highestScore,
      lowestScore,
      totalAvailableMarks,
      hardestQuestions,
      easiestQuestions
    };
  }, [results]);

  if (!stats) return null;

  return (
    <div className="space-y-6 mb-8">
      {/* High Level Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Average</p>
            <p className={`text-2xl font-bold mt-1 ${stats.averagePercentage >= 50 ? 'text-indigo-600' : 'text-red-500'}`}>
                {stats.averagePercentage.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-400 mt-1">{stats.averageScore.toFixed(1)} / {stats.totalAvailableMarks}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pass Rate</p>
            <p className={`text-2xl font-bold mt-1 ${stats.passRate >= 80 ? 'text-emerald-500' : stats.passRate >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                {stats.passRate.toFixed(0)}%
            </p>
            <p className="text-xs text-slate-400 mt-1">{Math.round((stats.passRate/100) * stats.totalScripts)} passed</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Highest Score</p>
            <p className="text-2xl font-bold mt-1 text-slate-700">
                {stats.highestScore}
            </p>
            <p className="text-xs text-slate-400 mt-1">out of {stats.totalAvailableMarks}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lowest Score</p>
            <p className="text-2xl font-bold mt-1 text-slate-700">
                {stats.lowestScore}
            </p>
            <p className="text-xs text-slate-400 mt-1">out of {stats.totalAvailableMarks}</p>
        </div>
      </div>

      {/* Deep Dive Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Struggle Areas */}
        <div className="bg-red-50 rounded-xl p-5 border border-red-100">
            <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Most Difficult Questions
            </h4>
            <div className="space-y-3">
                {stats.hardestQuestions.map((q, i) => (
                    <div key={i} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                        <div>
                            <span className="font-bold text-slate-700">Question {q.qNum}</span>
                            <span className="text-xs text-slate-500 block">Avg: {q.avg.toFixed(1)} / {q.max}</span>
                        </div>
                        <div className="text-right">
                            <span className="font-bold text-red-600">{q.percentage.toFixed(0)}%</span>
                        </div>
                    </div>
                ))}
            </div>
             <p className="text-xs text-red-600 mt-3 italic">Tip: Consider reviewing these topics in class.</p>
        </div>

        {/* Success Areas */}
        <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
            <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Best Performed Questions
            </h4>
            <div className="space-y-3">
                {stats.easiestQuestions.map((q, i) => (
                    <div key={i} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                        <div>
                            <span className="font-bold text-slate-700">Question {q.qNum}</span>
                            <span className="text-xs text-slate-500 block">Avg: {q.avg.toFixed(1)} / {q.max}</span>
                        </div>
                        <div className="text-right">
                            <span className="font-bold text-emerald-600">{q.percentage.toFixed(0)}%</span>
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-xs text-emerald-700 mt-3 italic">Great job! The class has mastered these concepts.</p>
        </div>
      </div>
    </div>
  );
};
