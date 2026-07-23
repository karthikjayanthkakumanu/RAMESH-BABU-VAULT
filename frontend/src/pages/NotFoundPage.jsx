import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 p-4 font-sans select-none">
      <div className="text-center max-w-sm space-y-6">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-3xl w-16 h-16 flex items-center justify-center mx-auto">
          <FaExclamationTriangle className="w-8 h-8" />
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-500 dark:text-indigo-400 uppercase">Error Code 404</span>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mt-1">Access Restrained</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            The vault coordinate you specified does not exist or has been relocated by security protocols.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center gap-2 mx-auto px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
        >
          <FaArrowLeft className="w-3 h-3" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
