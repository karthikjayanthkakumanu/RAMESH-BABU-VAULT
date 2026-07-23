import React, { useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaCloudUploadAlt, FaTimes, FaFileAlt, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import api from '../services/api';
import axios from 'axios';

const UploadModal = ({ isOpen, onClose, categoryId, subCategoryId, onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  
  // Axios cancel token ref to allow cancelling upload
  const cancelSourceRef = useRef(null);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setUploading(false);
      setProgress(0);
      setError(null);
    }
  }, [isOpen]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      // Form file objects with metadata and editable display names
      const fileObjects = acceptedFiles.map((file) => {
        // Default display name is original filename minus extension
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        return {
          file,
          displayName: baseName,
          originalName: file.name,
          size: file.size,
        };
      });
      setFiles((prev) => [...prev, ...fileObjects]);
    },
  });

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRenameFile = (index, value) => {
    setFiles((prev) => {
      const updated = [...prev];
      updated[index].displayName = value;
      return updated;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    setProgress(0);

    // Create cancel token
    cancelSourceRef.current = axios.CancelToken.source();

    const formData = new FormData();
    formData.append('category', categoryId);
    if (subCategoryId) {
      formData.append('subCategory', subCategoryId);
    }

    // Append files and their customized display names
    const displayNames = [];
    files.forEach((fileObj) => {
      formData.append('files', fileObj.file);
      displayNames.push(fileObj.displayName);
    });
    formData.append('displayNames', JSON.stringify(displayNames));

    try {
      const res = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        cancelToken: cancelSourceRef.current.token,
        onUploadProgress: (progressEvent) => {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentage);
        },
      });

      if (res.data.success) {
        setUploading(false);
        setFiles([]);
        if (onUploadSuccess) onUploadSuccess();
        onClose();
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        setError('Upload cancelled by user.');
      } else {
        const msg = err.response?.data?.message || 'Upload failed. Check file sizes or name duplicates.';
        setError(msg);
      }
      setUploading(false);
    }
  };

  const handleCancelUpload = () => {
    if (cancelSourceRef.current) {
      cancelSourceRef.current.cancel('Upload cancelled.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="w-full max-w-xl rounded-3xl border shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]
        bg-white dark:bg-[#161F30] border-slate-200/80 dark:border-slate-800/80"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/50">
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Upload Documents</h3>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <FaTimes className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <FaExclamationCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Drag & Drop Area */}
        {!uploading && (
          <div
            {...getRootProps()}
            className={`mt-4 border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors duration-200
              ${isDragActive
                ? 'border-indigo-500 bg-indigo-50/30 dark:border-indigo-400 dark:bg-indigo-950/10'
                : 'border-slate-200 hover:border-indigo-400 dark:border-slate-800 dark:hover:border-indigo-500'
              }`}
          >
            <input {...getInputProps()} />
            <FaCloudUploadAlt className="w-12 h-12 text-indigo-500 mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Drag & drop files here, or <span className="text-indigo-500">browse</span>
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
              Supports PDF, Images, Word, Excel, PPT, Text, Audio, Video, ZIP up to 100MB
            </p>
          </div>
        )}

        {/* Selected Files List */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3">
          {files.map((fileObj, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/40"
            >
              <FaFileAlt className="w-8 h-8 text-indigo-500/80 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  disabled={uploading}
                  value={fileObj.displayName}
                  onChange={(e) => handleRenameFile(idx, e.target.value)}
                  placeholder="Enter custom name"
                  className="w-full text-xs font-bold bg-transparent outline-none border-b border-transparent focus:border-indigo-500 text-slate-800 dark:text-white"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-0.5">
                  <span className="truncate max-w-[200px]">{fileObj.originalName}</span>
                  <span className="font-mono">{(fileObj.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>
              {!uploading && (
                <button
                  onClick={() => handleRemoveFile(idx)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="mt-4 p-4 border rounded-2xl bg-indigo-50/10 border-indigo-500/20">
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              <span>Uploading {files.length} file(s)...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-end mt-3">
              <button
                onClick={handleCancelUpload}
                className="text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
              >
                Cancel Upload
              </button>
            </div>
          </div>
        )}

        {/* Actions Footer */}
        {!uploading && (
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={files.length === 0}
              className={`px-4 py-2 text-xs font-semibold rounded-xl text-white transition-all
                ${files.length > 0
                  ? 'bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 cursor-pointer'
                  : 'bg-indigo-300 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed'
                }`}
            >
              Upload {files.length > 0 ? `(${files.length})` : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
