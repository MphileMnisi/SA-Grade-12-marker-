import React, { useState } from 'react';

interface HomePageProps {
  onLogin: (schoolName: string, emisNumber: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onLogin }) => {
  const [schoolName, setSchoolName] = useState('');
  const [emisNumber, setEmisNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim() || !emisNumber.trim()) {
      setError('Both School Name and EMIS Number are required.');
      return;
    }
    setError('');
    onLogin(schoolName.trim(), emisNumber.trim());
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200">
        <div className="text-center">
            <img 
                src="https://assitej.org.za/wp-content/uploads/2021/04/RSA-Basic-Education-LOGO.jpg" 
                alt="Department of Basic Education Logo" 
                className="h-20 mx-auto mb-6"
            />
            <h1 className="text-3xl font-extrabold text-slate-800">
                Welcome to the AI Script Marker
            </h1>
            <p className="mt-2 text-slate-600">
                Please enter your school's details to proceed.
            </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="schoolName" className="block text-sm font-medium text-slate-700">
              School Name
            </label>
            <div className="mt-1">
              <input
                id="schoolName"
                name="schoolName"
                type="text"
                autoComplete="organization"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="block w-full px-3 py-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="emisNumber" className="block text-sm font-medium text-slate-700">
              EMIS Number
            </label>
            <div className="mt-1">
              <input
                id="emisNumber"
                name="emisNumber"
                type="text"
                required
                value={emisNumber}
                onChange={(e) => setEmisNumber(e.target.value)}
                className="block w-full px-3 py-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
                {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="flex justify-center w-full px-4 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Proceed to Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};