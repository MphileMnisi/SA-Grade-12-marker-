import React, { useState } from 'react';
import { getSchoolUsers, saveSchoolUser } from '../utils/auth';

interface SignUpPageProps {
  onSwitchToLogin: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onSwitchToLogin }) => {
  const [schoolName, setSchoolName] = useState('');
  const [emisNumber, setEmisNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSchoolName = schoolName.trim();
    const trimmedEmisNumber = emisNumber.trim();

    // --- Validation ---
    if (!trimmedSchoolName || !trimmedEmisNumber || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    const emisRegex = /^\d{9}$/;
    if (!emisRegex.test(trimmedEmisNumber)) {
      setError('Invalid EMIS Number. It must be a 9-digit number.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    // --- Check for existing user ---
    const users = getSchoolUsers();
    if (users.some(u => u.emisNumber === trimmedEmisNumber)) {
        setError('An account with this EMIS Number already exists.');
        return;
    }

    // --- Save user and switch to login ---
    try {
        saveSchoolUser({ schoolName: trimmedSchoolName, emisNumber: trimmedEmisNumber, password });
        setError('');
        alert('Sign up successful! Please log in to continue.');
        onSwitchToLogin();
    } catch (e) {
        setError('Could not save your details. Please try again.');
        console.error(e);
    }
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
                Create a School Account
            </h1>
            <p className="mt-2 text-slate-600">
                Register your school to start marking scripts.
            </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="schoolName" className="block text-sm font-medium text-slate-700">
              School Name
            </label>
            <input
              id="schoolName"
              type="text"
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="emisNumber" className="block text-sm font-medium text-slate-700">
              EMIS Number
            </label>
            <input
              id="emisNumber"
              type="text"
              required
              value={emisNumber}
              onChange={(e) => setEmisNumber(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 sm:text-sm"
            />
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
              Sign Up
            </button>
          </div>
        </form>
         <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline">
              Log in here
            </button>
        </p>
      </div>
    </div>
  );
};
