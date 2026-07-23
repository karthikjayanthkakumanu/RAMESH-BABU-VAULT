import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';
import {
  FaTrashAlt,
  FaFileAlt,
  FaFilePdf,
  FaFileImage,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileAudio,
  FaFileVideo,
  FaFileArchive,
  FaUndo,
  FaTrash,
  FaTimes,
  FaCheckSquare,
  FaSquare,
  FaFolderOpen
} from 'react-icons/fa';
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

const TrashPage = () => {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const fetchTrash = async () => {
    try {
      setLoading(true);
      const res = await api.get('/files?isDeleted=true');
      if (res.data.success) {
        setFiles(res.data.files);
      }
    } catch (err) {
      console.error('Failed to fetch trash bin files:', err);
    } finally {
      setLoading(false);
      setSelectedFiles([]);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (file) => {
    try {
      const res = await api.put(`/files/${file._id}/restore`);
      if (res.data.success) {
        Swal.fire({
          title: 'Restored!',
          text: `"${file.displayName}" has been restored to its folder.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: document.documentElement.classList.contains('dark') ? '#161F30' : '#FFFFFF',
          color: document.documentElement.classList.contains('dark') ? '#F1F5F9' : '#1E293B',
        });
        fetchTrash();
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Restore failed', 'error');
    }
  };

  const handlePermanentDelete = (file) => {
    Swal.fire({
      title: 'Permanently delete file?',
      text: `"${file.displayName}" will be physically erased from server storage. This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, permanently delete',
      confirmButtonColor: '#e11d48',
      cancelButtonText: 'Cancel',
      background: document.documentElement.classList.contains('dark') ? '#161F30' : '#FFFFFF',
      color: document.documentElement.classList.contains('dark') ? '#F1F5F9' : '#1E293B',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await api.delete(`/files/${file._id}/permanent`);
          if (res.data.success) {
            Swal.fire({
              title: 'Deleted Permanently!',
              icon: 'success',
              timer: 1200,
              showConfirmButton: false,
              background: document.documentElement.classList.contains('dark') ? '#161F30' : '#FFFFFF',
              color: document.documentElement.classList.contains('dark') ? '#F1F5F9' : '#1E293B',
            });
            fetchTrash();
          }
        } catch (err) {
          Swal.fire('Error', 'Permanent delete failed', 'error');
        }
      }
    });
  };

  // Bulk Operations
  const handleToggleSelect = (fileId) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map((f) => f._id));
    }
  };

  const handleBulkRestore = async () => {
    if (selectedFiles.length === 0) return;
    try {
      const res = await api.post('/files/bulk', {
        fileIds: selectedFiles,
        action: 'restore',
      });
      if (res.data.success) {
        Swal.fire('Restored!', `${selectedFiles.length} file(s) restored successfully.`, 'success');
        fetchTrash();
      }
    } catch (err) {
      Swal.fire('Error', 'Bulk restore failed', 'error');
    }
  };

  const handleBulkPermanentDelete = () => {
    if (selectedFiles.length === 0) return;
    Swal.fire({
      title: `Permanently erase ${selectedFiles.length} file(s)?`,
      text: 'Files will be physical deleted. This action is final.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, erase them',
      confirmButtonColor: '#e11d48',
      cancelButtonText: 'Cancel',
      background: document.documentElement.classList.contains('dark') ? '#161F30' : '#FFFFFF',
      color: document.documentElement.classList.contains('dark') ? '#F1F5F9' : '#1E293B',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await api.post('/files/bulk', {
            fileIds: selectedFiles,
            action: 'permanent_delete',
          });
          if (res.data.success) {
            Swal.fire('Erased!', 'Selected files deleted from server disk.', 'success');
            fetchTrash();
          }
        } catch (err) {
          Swal.fire('Error', 'Bulk permanent delete failed', 'error');
        }
      }
    });
  };

  const getFileIconComponent = (type) => {
    if (type === 'pdf') return <FaFilePdf className="w-8 h-8 text-rose-500" />;
    if (type === 'image') return <FaFileImage className="w-8 h-8 text-emerald-500" />;
    if (type === 'spreadsheet') return <FaFileExcel className="w-8 h-8 text-green-600" />;
    if (type === 'presentation') return <FaFilePowerpoint className="w-8 h-8 text-orange-500" />;
    if (type === 'archive') return <FaFileArchive className="w-8 h-8 text-yellow-600" />;
    if (type === 'audio') return <FaFileAudio className="w-8 h-8 text-violet-500" />;
    if (type === 'video') return <FaFileVideo className="w-8 h-8 text-pink-500" />;
    if (type === 'document') return <FaFileWord className="w-8 h-8 text-blue-500" />;
    return <FaFileAlt className="w-8 h-8 text-slate-400" />;
  };

  return (
    <div className="space-y-6 select-none">
      <Breadcrumbs items={[{ label: 'Trash Bin' }]} />

      <div className="border-b border-slate-200/50 dark:border-slate-800/50 pb-5">
        <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-tight flex items-center gap-2">
          <FaTrashAlt className="text-rose-500 w-5 h-5" />
          <span>Trash Bin</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          View deleted documents. Restore them to their folders or purge them permanently.
        </p>
      </div>

      {files.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 hover:text-slate-600 dark:hover:text-slate-200 transition-colors font-medium cursor-pointer"
          >
            {selectedFiles.length === files.length ? <FaCheckSquare className="w-4 h-4 text-indigo-500" /> : <FaSquare className="w-4 h-4" />}
            <span>{selectedFiles.length === files.length ? 'Deselect All' : 'Select All Files'}</span>
          </button>
          <span>{files.length} deleted file(s) in bin</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-200/50 dark:bg-slate-850/40 animate-pulse" />
          ))}
        </div>
      ) : files.length > 0 ? (
        <div className="border rounded-3xl overflow-hidden bg-white dark:bg-darkBg-card border-slate-200/50 dark:border-slate-850/50 shadow-sm">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/10 text-slate-400 select-none">
                <th className="p-4 w-12"></th>
                <th className="p-4">Name</th>
                <th className="p-4">Size</th>
                <th className="p-4">Original Folder</th>
                <th className="p-4">Deleted At</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => {
                const isSelected = selectedFiles.includes(file._id);
                return (
                  <tr
                    key={file._id}
                    className={`border-b border-slate-100 dark:border-slate-800/20 hover:bg-slate-50/50 dark:hover:bg-slate-900/20
                      ${isSelected ? 'bg-indigo-50/30 dark:bg-indigo-950/10' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="p-4 w-12">
                      <button
                        onClick={() => handleToggleSelect(file._id)}
                        className={`${isSelected ? 'text-indigo-500' : 'text-slate-350 hover:text-slate-500'}`}
                      >
                        {isSelected ? <FaCheckSquare className="w-4.5 h-4.5" /> : <FaSquare className="w-4.5 h-4.5 bg-white dark:bg-slate-900 rounded" />}
                      </button>
                    </td>

                    {/* File Name */}
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-200">
                      <div className="flex items-center gap-3 truncate max-w-[200px] md:max-w-[300px]">
                        {getFileIconComponent(file.fileType)}
                        <div className="truncate">
                          <span className="truncate block">{file.displayName}</span>
                          <span className="text-[9px] text-slate-400 truncate block font-mono">{file.originalFilename}</span>
                        </div>
                      </div>
                    </td>

                    {/* File Size */}
                    <td className="p-4 font-mono text-slate-500">{formatBytes(file.size)}</td>

                    {/* Original Category */}
                    <td className="p-4 text-slate-500">
                      {file.category?.name?.replace(/\(.*?\)/g, '') || 'Others'}
                    </td>

                    {/* Deleted Date */}
                    <td className="p-4 text-slate-500 font-mono">
                      {file.deletedAt ? new Date(file.deletedAt).toLocaleDateString() : 'N/A'}
                    </td>

                    {/* Quick actions (Restore, Permanent Delete) */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          title="Restore file"
                          onClick={() => handleRestore(file)}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl"
                        >
                          <FaUndo className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Delete permanently"
                          onClick={() => handlePermanentDelete(file)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl"
                        >
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center p-16 border border-dashed rounded-3xl bg-slate-50/50 dark:bg-slate-900/10 text-slate-400 border-slate-200 dark:border-slate-800">
          <FaFolderOpen className="w-12 h-12 mx-auto text-slate-350 dark:text-slate-700 mb-3" />
          <h4 className="text-sm font-bold text-slate-600 dark:text-slate-350">Trash bin is empty</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
            There are no deleted documents. Only files deleted in folders appear here.
          </p>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedFiles.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 flex items-center gap-6 px-6 py-4 rounded-2xl shadow-2xl border
          bg-slate-900 text-white border-slate-800 backdrop-blur-md"
        >
          <span className="text-xs font-bold text-slate-300">
            {selectedFiles.length} file(s) selected
          </span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkRestore}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <FaUndo className="w-3 h-3" />
              <span>Restore</span>
            </button>
            
            <button
              onClick={handleBulkPermanentDelete}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <FaTrash className="w-3.5 h-3.5" />
              <span>Erase Permanently</span>
            </button>

            <button
              onClick={() => setSelectedFiles([])}
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrashPage;
