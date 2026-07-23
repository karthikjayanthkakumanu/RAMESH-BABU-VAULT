import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Breadcrumbs from '../components/Breadcrumbs';
import { FaStar, FaFileAlt, FaFilePdf, FaFileImage, FaFileWord, FaFileExcel, FaFilePowerpoint, FaFileAudio, FaFileVideo, FaFileArchive, FaEye, FaDownload, FaTimes } from 'react-icons/fa';
import api from '../services/api';
import Swal from 'sweetalert2';

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const FavoritesPage = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await api.get('/files?isFavorite=true&isDeleted=false');
      if (res.data.success) {
        setFiles(res.data.files);
      }
    } catch (err) {
      console.error('Failed to fetch favorite files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleUnfavorite = async (e, fileId) => {
    e.stopPropagation();
    try {
      const res = await api.put(`/files/${fileId}/favorite`);
      if (res.data.success) {
        setFiles((prev) => prev.filter((f) => f._id !== fileId));
      }
    } catch (err) {
      console.error('Failed to unfavorite:', err);
    }
  };

  const getFileIconComponent = (type) => {
    if (type === 'pdf') return <FaFilePdf className="w-9 h-9 text-rose-500" />;
    if (type === 'image') return <FaFileImage className="w-9 h-9 text-emerald-500" />;
    if (type === 'spreadsheet') return <FaFileExcel className="w-9 h-9 text-green-600" />;
    if (type === 'presentation') return <FaFilePowerpoint className="w-9 h-9 text-orange-500" />;
    if (type === 'archive') return <FaFileArchive className="w-9 h-9 text-yellow-600" />;
    if (type === 'audio') return <FaFileAudio className="w-9 h-9 text-violet-500" />;
    if (type === 'video') return <FaFileVideo className="w-9 h-9 text-pink-500" />;
    if (type === 'document') return <FaFileWord className="w-9 h-9 text-blue-500" />;
    return <FaFileAlt className="w-9 h-9 text-slate-400" />;
  };

  return (
    <div className="space-y-6 select-none">
      <Breadcrumbs items={[{ label: 'Favorites' }]} />

      <div className="border-b border-slate-200/50 dark:border-slate-800/50 pb-5">
        <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-tight flex items-center gap-2">
          <FaStar className="text-amber-500 w-6 h-6 fill-amber-500" />
          <span>Starred Files</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          Quickly access documents you have marked as favorites across all folders.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 rounded-3xl bg-slate-200/50 dark:bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      ) : files.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {files.map((file) => (
            <div
              key={file._id}
              onClick={() => {
                const previewEvent = new CustomEvent('previewFile', { detail: file._id });
                window.dispatchEvent(previewEvent);
              }}
              className="group relative p-4 rounded-3xl border select-none cursor-pointer transition-all duration-200 flex flex-col justify-between h-[160px]
                bg-white dark:bg-darkBg-card border-slate-200/50 dark:border-slate-850/50 hover:shadow-md hover:border-slate-350 dark:hover:border-slate-700"
            >
              {/* Unfavorite cross */}
              <button
                onClick={(e) => handleUnfavorite(e, file._id)}
                title="Remove from favorites"
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>

              <div className="flex flex-col items-center justify-center text-center flex-1 pt-4">
                {getFileIconComponent(file.fileType)}
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate w-full mt-3 px-2" title={file.displayName}>
                  {file.displayName}
                </h4>
                <span className="text-[9px] text-indigo-400 uppercase tracking-wider mt-0.5 block font-bold">
                  {file.category?.name?.replace(/\(.*?\)/g, '') || 'Others'}
                </span>
              </div>

              <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono mt-3 border-t border-slate-100 dark:border-slate-800/40 pt-2 px-1">
                <span>{formatBytes(file.size)}</span>
                <span>{new Date(file.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-16 border border-dashed rounded-3xl bg-slate-50/50 dark:bg-slate-900/10 text-slate-400 border-slate-200 dark:border-slate-800">
          <FaStar className="w-12 h-12 mx-auto text-slate-350 dark:text-slate-700 mb-3" />
          <h4 className="text-sm font-bold text-slate-600 dark:text-slate-350">No favorites yet</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
            Right-click files in folders and choose "Mark Favorite" to pin them here.
          </p>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
