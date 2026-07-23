import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaFolder,
  FaFileAlt,
  FaFilePdf,
  FaFileImage,
  FaDatabase,
  FaUpload,
  FaHistory,
  FaDownload,
  FaEye,
  FaArrowRight,
  FaKeyboard,
  FaChevronRight,
  FaLock,
  FaInfoCircle
} from 'react-icons/fa';
import api from '../services/api';
import { motion } from 'framer-motion';

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalCategories: 0,
    totalFiles: 0,
    pdfCount: 0,
    imageCount: 0,
    documentCount: 0,
    otherCount: 0,
    storageUsed: 0,
  });
  const [recentFiles, setRecentFiles] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showKeyboardModal, setShowKeyboardModal] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, filesRes, activityRes] = await Promise.all([
        api.get('/files/stats'),
        api.get('/files?isDeleted=false&sortBy=newest'),
        api.get('/files/activity'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (filesRes.data.success) setRecentFiles(filesRes.data.files.slice(0, 5));
      if (activityRes.data.success) setActivities(activityRes.data.logs.slice(0, 6));
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen to keyboard shortcut event "?"
    const handleKeyDown = (e) => {
      if (e.key === '?') {
        setShowKeyboardModal(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowKeyboardModal(false);
      }
      // Focus search shortcut "/"
      if (e.key === '/') {
        const searchInput = document.querySelector('input[placeholder*="Search files"]');
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getFileIcon = (type) => {
    if (type === 'pdf') return <FaFilePdf className="w-8 h-8 text-rose-500" />;
    if (type === 'image') return <FaFileImage className="w-8 h-8 text-emerald-500" />;
    return <FaFileAlt className="w-8 h-8 text-indigo-400" />;
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'UPLOAD_FILE':
        return <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"><FaUpload className="w-3.5 h-3.5" /></div>;
      case 'DOWNLOAD_FILE':
        return <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"><FaDownload className="w-3.5 h-3.5" /></div>;
      case 'VIEW_FILE':
        return <div className="p-1.5 rounded-full bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400"><FaEye className="w-3.5 h-3.5" /></div>;
      default:
        return <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"><FaHistory className="w-3.5 h-3.5" /></div>;
    }
  };

  // Storage Used Limit: say 10GB for this family vault demo
  const STORAGE_LIMIT = 10 * 1024 * 1024 * 1024; // 10 GB
  const storagePercentage = Math.min(((stats.storageUsed / STORAGE_LIMIT) * 100), 100).toFixed(1);

  return (
    <div className="space-y-8 select-none">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-none">
            Welcome back, {user?.name || 'Family Member'}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Access secure archives & manage private assets. Today is {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
          </p>
        </div>

        {/* Dashboard Quick Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowKeyboardModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border transition-all
              bg-white border-slate-200 text-slate-600 hover:bg-slate-50
              dark:bg-slate-900/50 dark:border-slate-850 dark:text-slate-350 dark:hover:bg-slate-900"
          >
            <FaKeyboard className="w-3.5 h-3.5" />
            <span>Shortcuts</span>
          </button>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Folders */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-3xl border glass-panel border-slate-200/50 dark:border-slate-800/40 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-300">Total Folders</span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1.5">{stats.totalCategories}</h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-2xl">
              <FaFolder className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-300 mt-3 font-semibold flex items-center gap-1">
            <FaInfoCircle className="w-3 h-3 text-indigo-400" />
            <span>Click sidebar to browse folders</span>
          </div>
        </motion.div>

        {/* Total Files */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-3xl border glass-panel border-slate-200/50 dark:border-slate-800/40 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-300">Total Files</span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1.5">{stats.totalFiles}</h3>
            </div>
            <div className="p-3 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-500 rounded-2xl">
              <FaFileAlt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-300 mt-3 font-semibold">
            {stats.pdfCount} PDFs • {stats.imageCount} Images • {stats.documentCount} Docs
          </p>
        </motion.div>

        {/* PDFs & Images Breakdown */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-3xl border glass-panel border-slate-200/50 dark:border-slate-800/40 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-300">Media Files</span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1.5">{stats.pdfCount + stats.imageCount}</h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-2xl">
              <FaFileImage className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-300 mt-3 font-semibold">
            PDFs: {stats.pdfCount} files / Images: {stats.imageCount} files
          </p>
        </motion.div>

        {/* Storage Used */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-3xl border glass-panel border-slate-200/50 dark:border-slate-800/40 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-300">Storage Used</span>
              <h3 className="text-sm font-black text-slate-800 dark:text-white mt-1.5">{formatBytes(stats.storageUsed)}</h3>
            </div>
            <div className="p-2.5 bg-violet-50 dark:bg-violet-950/20 text-violet-500 rounded-2xl">
              <FaDatabase className="w-4 h-4" />
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${storagePercentage}%` }} />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-300 mt-1.5 font-semibold">
            <span>{storagePercentage}% of Limit</span>
            <span>Limit: {formatBytes(STORAGE_LIMIT)}</span>
          </div>
        </motion.div>
      </div>

      {/* Main dashboard widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Uploads */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Recently Uploaded Files</h3>
            <span className="text-[10px] font-medium text-slate-400">Newest arrivals</span>
          </div>

          <div className="space-y-3">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-slate-200/50 dark:bg-slate-800/40 animate-pulse" />
              ))
            ) : recentFiles.length > 0 ? (
              recentFiles.map((file) => (
                <div
                  key={file._id}
                  onClick={() => {
                    const previewEvent = new CustomEvent('previewFile', { detail: file._id });
                    window.dispatchEvent(previewEvent);
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer hover:shadow-md transition-all duration-200
                    bg-white dark:bg-darkBg-card border-slate-200/50 dark:border-slate-850/50 hover:border-slate-350 dark:hover:border-slate-700"
                >
                  <div className="flex items-center gap-3.5 truncate">
                    {getFileIcon(file.fileType)}
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">
                        {file.displayName}
                      </h4>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5 font-mono">
                        <span>{formatBytes(file.size)}</span>
                        <span>•</span>
                        <span>{file.category?.name?.replace(/\(.*?\)/g, '') || 'Others'}</span>
                      </div>
                    </div>
                  </div>
                  <FaChevronRight className="w-3 h-3 text-slate-400" />
                </div>
              ))
            ) : (
              <div className="text-center p-8 border rounded-2xl bg-slate-50/50 dark:bg-slate-900/10 text-slate-400 border-dashed border-slate-200 dark:border-slate-800">
                No documents uploaded yet. Go into a category folder to upload documents!
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Activity Timeline */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Security & Audit logs</h3>
            <span className="text-[10px] font-medium text-slate-400">Activity Timeline</span>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-200/50 dark:bg-slate-800/40 animate-pulse" />
              ))
            ) : activities.length > 0 ? (
              activities.map((log) => (
                <div key={log._id} className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(log.action)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-tight">
                      <span className="font-bold text-slate-800 dark:text-white">{log.user?.name || 'Admin'}</span>{' '}
                      {log.details}
                    </p>
                    <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                      {new Date(log.createdAt).toLocaleDateString()} at{' '}
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
                No activity logged yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border shadow-2xl p-6 bg-white dark:bg-[#161F30] border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/50 mb-4">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowKeyboardModal(false)}
                className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 text-xs font-bold"
              >
                Esc
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Search Vault</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border rounded font-mono text-[10px] shadow-sm">/</kbd>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Show Shortcuts Menu</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border rounded font-mono text-[10px] shadow-sm">?</kbd>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Go to Dashboard</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border rounded font-mono text-[10px] shadow-sm">g + d</kbd>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Go to Favorites</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border rounded font-mono text-[10px] shadow-sm">g + f</kbd>
              </div>
              {isAdmin && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Go to Trash Bin</span>
                  <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border rounded font-mono text-[10px] shadow-sm">g + t</kbd>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
