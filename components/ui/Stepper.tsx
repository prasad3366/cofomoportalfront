import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ApplicationStatus } from '../../types';

interface StepperProps {
  status: ApplicationStatus;
}

const STEPS = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.REVIEWING,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.INTERVIEW_SCHEDULED,
  ApplicationStatus.DOCUMENTS_REQUESTED,
  ApplicationStatus.OFFERED,
  ApplicationStatus.HIRED
];

export const Stepper: React.FC<StepperProps> = ({ status }) => {
  let activeIndex = STEPS.indexOf(status);
  
  // Handle edge cases
  if (status === ApplicationStatus.DOCUMENTS_SUBMITTED) {
      activeIndex = STEPS.indexOf(ApplicationStatus.DOCUMENTS_REQUESTED);
  }
  if (status === ApplicationStatus.REJECTED) {
      activeIndex = 0; // Or handle as a specific rejected state
  }

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center min-w-max">
        {STEPS.map((step, idx) => {
           const isActive = idx <= activeIndex;
           const isLast = idx === STEPS.length - 1;
           const label = step.replace('_', ' ').replace('REQUESTED', '').toLowerCase();

           return (
             <React.Fragment key={step}>
               <div className="flex flex-col items-center group relative">
               <div className={`
                    z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-500
                    ${isActive ? 'border-indigo-500 bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_10px_24px_rgba(99,102,241,0.22)]' : 'border-white/60 bg-white/85 text-slate-300 shadow-[0_8px_18px_rgba(15,23,42,0.05)]'}
                 `}>
                   {idx < activeIndex ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                 </div>
                 <div className={`mt-2 text-center text-[10px] font-medium uppercase tracking-[0.18em] transition-colors ${isActive ? 'text-indigo-700' : 'text-slate-400'}`}>
                    {label}
                 </div>
               </div>
               
               {!isLast && (
                 <div className="relative mx-2 h-1 w-16 flex-1 overflow-hidden rounded-full bg-slate-100/80">
                    <div 
                        className={`absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out ${idx < activeIndex ? 'w-full' : 'w-0'}`} 
                    />
                 </div>
               )}
             </React.Fragment>
           )
        })}
      </div>
    </div>
  );
};
