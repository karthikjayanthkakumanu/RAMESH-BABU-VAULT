import React, { useState, useEffect } from 'react';
import { FaTimes, FaDownload, FaFileAlt, FaFileWord, FaFileExcel, FaFilePowerpoint, FaFileArchive } from 'react-icons/fa';
import api, { getBaseUrl } from '../services/api';

const PreviewModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [fileId, setFileId] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [previewBlobUrl, setPreviewBlobUrl] = useState('');

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  // Listen for global custom events to trigger preview from anywhere
  useEffect(() => {
    const handleOpenPreview = async (event) => {
      const id = event.detail;
      if (id) {
        setFileId(id);
        setIsOpen(true);
        setLoading(true);
        setTextContent('');
        
        setPreviewBlobUrl(prevUrl => {
          if (prevUrl) URL.revokeObjectURL(prevUrl);
          return '';
        });

        try {
          // Find file in DB to get metadata
          const filesRes = await api.get(`/files?isDeleted=false`);
          const matched = filesRes.data.files.find(f => f._id === id);
          if (matched) {
            setFile(matched);
            
            // If text file, fetch its raw content for preview
            if (matched.fileType === 'text') {
              const textRes = await api.get(`/files/${id}/view`, { responseType: 'text' });
              setTextContent(textRes.data);
            } else if (['pdf', 'image', 'video', 'audio'].includes(matched.fileType)) {
              // Fetch file as blob via authenticated request
              const response = await api.get(`/files/${id}/view`, { responseType: 'blob' });
              const blob = new Blob([response.data], { type: matched.mimeType });
              const blobUrl = URL.createObjectURL(blob);
              
              setIsOpen(stillOpen => {
                if (stillOpen) {
                  setPreviewBlobUrl(blobUrl);
                } else {
                  URL.revokeObjectURL(blobUrl);
                }
                return stillOpen;
              });
            }
          }
        } catch (err) {
          console.error('Failed to load file details for preview:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    window.addEventListener('previewFile', handleOpenPreview);
    return () => window.removeEventListener('previewFile', handleOpenPreview);
  }, []);

  const handleClose = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl('');
    }
    setIsOpen(false);
    setFile(null);
    setFileId(null);
  };

  const handleDownload = () => {
    if (!file) return;
    const token = localStorage.getItem('token');
    const baseUrl = getBaseUrl();
    window.open(`${baseUrl}/api/files/${file._id}/download?token=${token}`, '_blank');
  };

  if (!isOpen) return null;

  const renderPreviewContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-12">
          <div className="w-10 h-10 border-4 border-indigo-100 rounded-full dark:border-slate-800 animate-spin border-t-indigo-500" />
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-mono">Loading Preview...</span>
        </div>
      );
    }

    if (!file) {
      return (
        <div className="text-center p-8 text-sm text-slate-400">
          File details could not be found.
        </div>
      );
    }

    switch (file.fileType) {
      case 'pdf':
        return (
          <iframe
            src={previewBlobUrl ? `${previewBlobUrl}#toolbar=0` : ''}
            title={file.displayName}
            className="w-full h-[75vh] border-0 rounded-2xl bg-white"
          />
        );
      case 'image':
        return (
          <div className="flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl max-h-[75vh] overflow-hidden">
            <img
              src={previewBlobUrl}
              alt={file.displayName}
              className="max-w-full max-h-[70vh] rounded-xl object-contain shadow-md"
            />
          </div>
        );
      case 'video':
        return (
          <div className="p-2 bg-black rounded-2xl">
            <video src={previewBlobUrl} controls className="w-full max-h-[70vh] rounded-xl outline-none" />
          </div>
        );
      case 'audio':
        return (
          <div className="p-8 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center">
            <audio src={previewBlobUrl} controls className="w-full max-w-md outline-none" />
          </div>
        );
      case 'text':
        return (
          <pre className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl font-mono text-xs text-slate-700 dark:text-slate-350 border border-slate-150 dark:border-slate-800/40 overflow-auto max-h-[65vh]">
            {textContent || 'No text content available.'}
          </pre>
        );
      case 'document':
      case 'spreadsheet':
      case 'presentation':
      case 'archive':
      case 'other':
      default:
        // Fallback info card for Office docs & archives
        const getFallbackIcon = () => {
          if (file.fileType === 'spreadsheet') return <FaFileExcel className="w-16 h-16 text-emerald-500" />;
          if (file.fileType === 'presentation') return <FaFilePowerpoint className="w-16 h-16 text-orange-500" />;
          if (file.fileType === 'archive') return <FaFileArchive className="w-16 h-16 text-yellow-600" />;
          return <FaFileWord className="w-16 h-16 text-blue-500" />;
        };

        return (
          <div className="flex flex-col items-center justify-center p-10 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-150 dark:border-slate-800/40 text-center">
            {getFallbackIcon()}
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mt-4">{file.displayName}</h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
              In-browser preview is not supported for {file.fileType} format. Please download the document to view its full contents.
            </p>
            <button
              onClick={handleDownload}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all"
            >
              <FaDownload className="w-3.5 h-3.5" />
              Download {file.originalFilename.split('.').pop().toUpperCase()}
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm transition-opacity duration-300">
      <div className="w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]
        bg-white dark:bg-[#161F30] border-slate-200/85 dark:border-slate-800/85"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-[#161F30]">
          <div className="flex items-center gap-2.5 truncate">
            <FaFileAlt className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-white truncate">
              {file ? file.displayName : 'File Preview'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {file && (
              <button
                onClick={handleDownload}
                title="Download file"
                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800"
              >
                <FaDownload className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/20"
            >
              <FaTimes className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 p-5 overflow-y-auto">
          {renderPreviewContent()}
        </div>

        {/* Meta Stats Footer */}
        {file && !loading && (
          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/10 text-[10px] text-slate-400 font-mono flex flex-wrap gap-x-6 gap-y-1.5 justify-center">
            <span>Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</span>
            <span>Uploaded: {new Date(file.createdAt).toLocaleDateString()}</span>
            <span>By: {file.uploadedBy?.name || 'Admin'}</span>
            <span>Format: {file.mimeType}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewModal;
