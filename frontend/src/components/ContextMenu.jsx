import React, { useEffect, useRef } from 'react';
import { FaEye, FaDownload, FaEdit, FaExchangeAlt, FaStar, FaTrashAlt } from 'react-icons/fa';

const ContextMenu = ({ x, y, isFavorite, onClose, onAction, isAdmin }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-40 w-48 p-1.5 rounded-2xl shadow-2xl border bg-white dark:bg-[#161F30] border-slate-200/80 dark:border-slate-800/80"
      style={{ top: `${y}px`, left: `${x}px` }}
    >
      <button
        onClick={() => {
          onAction('view');
          onClose();
        }}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <FaEye className="w-3.5 h-3.5 text-indigo-500" />
        View File
      </button>

      <button
        onClick={() => {
          onAction('download');
          onClose();
        }}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <FaDownload className="w-3.5 h-3.5 text-indigo-500" />
        Download File
      </button>

      <button
        onClick={() => {
          onAction('favorite');
          onClose();
        }}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <FaStar className={`w-3.5 h-3.5 ${isFavorite ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
        {isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
      </button>

      {isAdmin && (
        <>
          <div className="my-1 border-t border-slate-100 dark:border-slate-800/50" />

          <button
            onClick={() => {
              onAction('rename');
              onClose();
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <FaEdit className="w-3.5 h-3.5 text-blue-500" />
            Rename Display
          </button>

          <button
            onClick={() => {
              onAction('move');
              onClose();
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <FaExchangeAlt className="w-3.5 h-3.5 text-emerald-500" />
            Move File
          </button>

          <button
            onClick={() => {
              onAction('delete');
              onClose();
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs font-semibold rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
          >
            <FaTrashAlt className="w-3.5 h-3.5 text-rose-500" />
            Move to Trash
          </button>
        </>
      )}
    </div>
  );
};

export default ContextMenu;
