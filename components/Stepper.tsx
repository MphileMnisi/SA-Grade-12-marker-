import React from 'react';
import { CheckIcon } from './icons/CheckIcon';

interface StepperProps {
  currentStep: number;
  steps: string[];
}

export const Stepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step} className={`relative ${stepIdx !== steps.length - 1 ? 'flex-1' : ''}`}>
            {stepIdx < currentStep - 1 ? (
              // Completed Step
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-indigo-600" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600">
                  <CheckIcon className="h-5 w-5 text-white" />
                </div>
                <span className="sr-only">{step} - Completed</span>
              </>
            ) : stepIdx === currentStep - 1 ? (
              // Current Step
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-slate-200" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-white"
                  aria-current="step"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                </div>
                <span className="sr-only">{step} - Current</span>
              </>
            ) : (
              // Upcoming Step
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-slate-200" />
                </div>
                <div className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-300 bg-white">
                   <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                </div>
                <span className="sr-only">{step} - Upcoming</span>
              </>
            )}

            <div className="absolute top-10 w-max text-center" style={{ left: '50%', transform: 'translateX(-50%)' }}>
              <p className={`text-sm font-medium ${stepIdx <= currentStep - 1 ? 'text-indigo-600' : 'text-slate-500'}`}>
                {step}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};