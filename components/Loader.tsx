import React from 'react';

const messages = [
  "Analyzing script structure...",
  "Identifying questions and answers...",
  "Consulting the curriculum...",
  "Marking with an expert eye...",
  "Calculating the final score...",
  "Generating constructive feedback...",
  "Finalizing the report...",
];

export const Loader: React.FC = () => {
    const [message, setMessage] = React.useState(messages[0]);

    React.useEffect(() => {
        const intervalId = setInterval(() => {
            setMessage(prev => {
                const currentIndex = messages.indexOf(prev);
                const nextIndex = (currentIndex + 1) % messages.length;
                return messages[nextIndex];
            });
        }, 2500);

        return () => clearInterval(intervalId);
    }, []);


  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-600"></div>
      <p className="text-lg font-medium text-slate-700 text-center transition-opacity duration-500">{message}</p>
    </div>
  );
};