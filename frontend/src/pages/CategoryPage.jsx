import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Breadcrumbs from '../components/Breadcrumbs';
import UploadModal from '../components/UploadModal';
import ContextMenu from '../components/ContextMenu';
import {
  FaFolder,
  FaFileAlt,
  FaFilePdf,
  FaFileImage,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileAudio,
  FaFileVideo,
  FaFileArchive,
  FaUpload,
  FaThLarge,
  FaList,
  FaSortAmountDown,
  FaFilter,
  FaStar,
  FaTrashAlt,
  FaDownload,
  FaEye,
  FaCheckSquare,
  FaSquare,
  FaChevronRight,
  FaPlus,
  FaTimes,
  FaFolderOpen
} from 'react-icons/fa';
import api, { getBaseUrl } from '../services/api';
import Swal from 'sweetalert2';

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const CategoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Layout and view configurations
  const [isGridView, setIsGridView] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [filterType, setFilterType] = useState('all');

  // File Upload states
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Context Menu states
  const [contextMenu, setContextMenu] = useState(null);
  const [activeFile, setActiveFile] = useState(null);

  // Selection/Bulk operation states
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Fetch Category info & its files
  const loadCategoryData = async () => {
    try {
      setLoading(true);
      const catRes = await api.get('/categories');
      if (catRes.data.success) {
        const found = catRes.data.categories.find((c) => c._id === id);
        if (found) {
          setCategory(found);
          setSubcategories(found.subcategories || []);
        } else {
          navigate('/dashboard');
          return;
        }
      }

      // Fetch files under category and optional subcategory
      let fileUrl = `/files?category=${id}&isDeleted=false&sortBy=${sortBy}`;
      if (selectedSubCategory) {
        fileUrl += `&subCategory=${selectedSubCategory._id}`;
      } else if (found?.subcategories?.length > 0) {
        // If has predefined subfolders, and none is selected, files directly under category will load
        fileUrl += `&subCategory=null`;
      }
      
      // Filter by type
      if (filterType !== 'all') {
        if (filterType === 'pdf') fileUrl += '&fileType=pdf';
        else if (filterType === 'images') fileUrl += '&fileType=image';
        else if (filterType === 'documents') fileUrl += '&fileType=document,spreadsheet,presentation,text';
        else if (filterType === 'videos') fileUrl += '&fileType=video';
        else if (filterType === 'audio') fileUrl += '&fileType=audio';
        else if (filterType === 'others') fileUrl += '&fileType=archive,other';
      }

      const filesRes = await api.get(fileUrl);
      if (filesRes.data.success) {
        setFiles(filesRes.data.files);
      }
    } catch (err) {
      console.error('Failed to load category files:', err);
    } finally {
      setLoading(false);
      setSelectedFiles([]); // Reset bulk selection on load
    }
  };

  useEffect(() => {
    setSelectedSubCategory(null); // Reset subcategory when category changes
  }, [id]);

  useEffect(() => {
    if (id) {
      loadCategoryData();
    }
  }, [id, selectedSubCategory, sortBy, filterType]);

  // Context Menu trigger
  const handleContextMenu = (e, file) => {
    e.preventDefault();
    setActiveFile(file);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      isFavorite: file.isFavorite,
    });
  };

  const handleContextAction = async (action) => {
    if (!activeFile) return;

    if (action === 'view') {
      const previewEvent = new CustomEvent('previewFile', { detail: activeFile._id });
      window.dispatchEvent(previewEvent);
    } else if (action === 'download') {
      const token = localStorage.getItem('token');
      const baseUrl = getBaseUrl();
      window.open(`${baseUrl}/api/files/${activeFile._id}/download?token=${token}`, '_blank');
    } else if (action === 'favorite') {
      try {
        const res = await api.put(`/files/${activeFile._id}/favorite`);
        if (res.data.success) {
          loadCategoryData();
        }
      } catch (err) {
        console.error('Favorite action failed:', err);
      }
    } else if (action === 'delete') {
      Swal.fire({
        title: 'Move file to Trash?',
        text: `"${activeFile.displayName}" will be moved to the Trash bin. Admins can restore it later.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, move to trash',
        confirmButtonColor: '#e11d48',
        cancelButtonText: 'Cancel',
        background: document.documentElement.classList.contains('dark') ? '#161F30' : '#FFFFFF',
        color: document.documentElement.classList.contains('dark') ? '#F1F5F9' : '#1E293B',
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const res = await api.delete(`/files/${activeFile._id}`);
            if (res.data.success) {
              Swal.fire({
                title: 'Moved to Trash!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                background: document.documentElement.classList.contains('dark') ? '#161F30' : '#FFFFFF',
                color: document.documentElement.classList.contains('dark') ? '#F1F5F9' : '#1E293B',
              });
              loadCategoryData();
            }
          } catch (err) {
            Swal.fire('Error', 'Failed to delete file', 'error');
          }
        }
      });
    } else if (action === 'rename') {
      const { value: formValues } = await Swal.fire({
        title: 'Rename File Details',
        html: `
          <div class="flex flex-col gap-4 text-left">
            <div>
              <label class="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-1">Display Name</label>
              <input id="swal-rename-display" class="swal2-input w-full m-0 text-xs font-sans rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200" value="${activeFile.displayName}" />
            </div>
            <div>
              <label class="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-1">Filename</label>
              <input id="swal-rename-filename" class="swal2-input w-full m-0 text-xs font-sans rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200" value="${activeFile.originalFilename}" />
            </div>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Rename',
        confirmButtonColor: '#4c6ef5',
        background: document.documentElement.classList.contains('dark') ? '#161F30' : '#FFFFFF',
        color: document.documentElement.classList.contains('dark') ? '#F1F5F9' : '#1E293B',
        preConfirm: () => {
          const displayName = document.getElementById('swal-rename-display').value.trim();
          const filename = document.getElementById('swal-rename-filename').value.trim();
          if (!displayName) {
            Swal.showValidationMessage('Display name cannot be empty');
            return false;
          }
          if (!filename) {
            Swal.showValidationMessage('Filename cannot be empty');
            return false;
          }
          return { displayName, filename };
        }
      });

      if (formValues) {
        const { displayName, filename } = formValues;
        if (displayName !== activeFile.displayName || filename !== activeFile.originalFilename) {
          try {
            const res = await api.put(`/files/${activeFile._id}/rename`, { displayName, filename });
            if (res.data.success) {
              loadCategoryData();
            }
          } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed to rename file', 'error');
          }
        }
      }
    } else if (action === 'move') {
      handleMoveFile(activeFile);
    }
  };

  const handleMoveFile = async (fileToMove) => {
    // Load categories list for select menu
    const catRes = await api.get('/categories');
    const categories = catRes.data.categories;

    // Build standard select menu
    let optionsHtml = '';
    categories.forEach(cat => {
      optionsHtml += `<optgroup label="${cat.name}">`;
      optionsHtml += `<option value="${cat._id}">${cat.name.replace(/\(.*?\)/g, '')} (Main Folder)</option>`;
      cat.subcategories.forEach(sub => {
        optionsHtml += `<option value="${cat._id}:${sub._id}">${cat.name.replace(/\(.*?\)/g, '')} → ${sub.name}</option>`;
      });
      optionsHtml += `</optgroup>`;
    });

    const { value: moveDest } = await Swal.fire({
      title: 'Move File to Folder',
      html: `<select id="swal-move-select" class="swal2-input text-xs font-sans rounded-xl w-full">${optionsHtml}</select>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Move File',
      confirmButtonColor: '#4c6ef5',
      background: document.documentElement.classList.contains('dark') ? '#161F30' : '#FFFFFF',
      color: document.documentElement.classList.contains('dark') ? '#F1F5F9' : '#1E293B',
      preConfirm: () => {
        return document.getElementById('swal-move-select').value;
      }
    });

    if (moveDest) {
      const parts = moveDest.split(':');
      const categoryId = parts[0];
      const subCategoryId = parts[1] || null;

      try {
        const res = await api.put(`/files/${fileToMove._id}/move`, {
          category: categoryId,
          subCategory: subCategoryId,
        });
        if (res.data.success) {
          Swal.fire({
            title: 'File Moved!',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: document.documentElement.classList.contains('dark') ? '#161F30' : '#FFFFFF',
            color: document.documentElement.classList.contains('dark') ? '#F1F5F9' : '#1E293B',
          });
          loadCategoryData();
        }
      } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Move failed', 'error');
      }
    }
  };

  // Bulk Operations
  const handleToggleSelectFile = (fileId) => {
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

  const handleBulkDelete = () => {
    if (selectedFiles.length === 0) return;
    Swal.fire({
      title: `Delete ${selectedFiles.length} file(s)?`,
      text: 'Selected files will be moved to the Trash bin.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, move to trash',
      confirmButtonColor: '#e11d48',
      cancelButtonText: 'Cancel',
      background: document.documentElement.classList.contains('dark') ? '#161F30' : '#FFFFFF',
      color: document.documentElement.classList.contains('dark') ? '#F1F5F9' : '#1E293B',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await api.post('/files/bulk', {
            fileIds: selectedFiles,
            action: 'delete',
          });
          if (res.data.success) {
            Swal.fire('Moved!', 'Files moved to Trash', 'success');
            loadCategoryData();
          }
        } catch (err) {
          Swal.fire('Error', 'Bulk delete failed', 'error');
        }
      }
    });
  };

  const handleBulkMove = async () => {
    if (selectedFiles.length === 0) return;

    const catRes = await api.get('/categories');
    const categories = catRes.data.categories;

    let optionsHtml = '';
    categories.forEach(cat => {
      optionsHtml += `<optgroup label="${cat.name}">`;
      optionsHtml += `<option value="${cat._id}">${cat.name.replace(/\(.*?\)/g, '')} (Main Folder)</option>`;
      cat.subcategories.forEach(sub => {
        optionsHtml += `<option value="${cat._id}:${sub._id}">${cat.name.replace(/\(.*?\)/g, '')} → ${sub.name}</option>`;
      });
      optionsHtml += `</optgroup>`;
    });

    const { value: moveDest } = await Swal.fire({
      title: `Bulk Move ${selectedFiles.length} File(s)`,
      html: `<select id="swal-bulk-move-select" class="swal2-input text-xs font-sans rounded-xl w-full">${optionsHtml}</select>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Move Files',
      confirmButtonColor: '#4c6ef5',
      background: document.documentElement.classList.contains('dark') ? '#161F30' : '#FFFFFF',
      color: document.documentElement.classList.contains('dark') ? '#F1F5F9' : '#1E293B',
      preConfirm: () => {
        return document.getElementById('swal-bulk-move-select').value;
      }
    });

    if (moveDest) {
      const parts = moveDest.split(':');
      const categoryId = parts[0];
      const subCategoryId = parts[1] || null;

      try {
        const res = await api.post('/files/bulk', {
          fileIds: selectedFiles,
          action: 'move',
          targetCategory: categoryId,
          targetSubCategory: subCategoryId,
        });
        if (res.data.success) {
          Swal.fire('Moved!', `${selectedFiles.length} file(s) moved successfully`, 'success');
          loadCategoryData();
        }
      } catch (err) {
        Swal.fire('Error', 'Bulk move failed', 'error');
      }
    }
  };

  const handleBulkDownload = () => {
    if (selectedFiles.length === 0) return;
    const token = localStorage.getItem('token');
    const baseUrl = getBaseUrl();
    // Client-side batch downloads by opening tabs sequentially
    selectedFiles.forEach((fileId, idx) => {
      setTimeout(() => {
        window.open(`${baseUrl}/api/files/${fileId}/download?token=${token}`, '_blank');
      }, idx * 600); // offset triggers to avoid browser download blocking
    });
    setSelectedFiles([]);
  };

  const getFileIconComponent = (type) => {
    if (type === 'pdf') return <FaFilePdf className="w-10 h-10 text-rose-500" />;
    if (type === 'image') return <FaFileImage className="w-10 h-10 text-emerald-500" />;
    if (type === 'spreadsheet') return <FaFileExcel className="w-10 h-10 text-green-600" />;
    if (type === 'presentation') return <FaFilePowerpoint className="w-10 h-10 text-orange-500" />;
    if (type === 'archive') return <FaFileArchive className="w-10 h-10 text-yellow-600" />;
    if (type === 'audio') return <FaFileAudio className="w-10 h-10 text-violet-500" />;
    if (type === 'video') return <FaFileVideo className="w-10 h-10 text-pink-500" />;
    if (type === 'document') return <FaFileWord className="w-10 h-10 text-blue-500" />;
    return <FaFileAlt className="w-10 h-10 text-slate-400" />;
  };

  // Breadcrumbs path assembly
  const breadcrumbItems = [
    { label: category ? category.name.replace(/\(.*?\)/g, '') : 'Category' }
  ];
  if (selectedSubCategory) {
    breadcrumbItems.push({ label: selectedSubCategory.name });
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Directory Folder Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/50 pb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-tight">
            {selectedSubCategory ? selectedSubCategory.name : category?.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {category?.description || `Documents archive inside ${category?.name}. Right-click any file to trigger metadata options.`}
          </p>
        </div>

        {/* Upload Action */}
        {isAdmin && (
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-500/20 transform hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <FaPlus className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {/* Predefined Subfolders (if none is selected) */}
      {!selectedSubCategory && subcategories.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sub-Folders</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {subcategories.map((sub) => (
              <div
                key={sub._id}
                onClick={() => setSelectedSubCategory(sub)}
                className="flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer select-none transition-all duration-200
                  bg-white dark:bg-darkBg-card border-slate-200/50 dark:border-slate-850/50 hover:shadow-md hover:border-slate-350 dark:hover:border-slate-700"
              >
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500">
                  <FaFolder className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 truncate">{sub.name}</h4>
                  <span className="text-[9px] font-mono text-indigo-400 mt-0.5 block uppercase tracking-wider font-semibold">Open Folder</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sorting, Layout view and Filtering controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3">
        {/* Subcategory level back key */}
        {selectedSubCategory && (
          <button
            onClick={() => setSelectedSubCategory(null)}
            className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
          >
            ← Back to Category Root
          </button>
        )}
        {!selectedSubCategory && <div />}

        <div className="flex flex-wrap items-center gap-3">
          {/* File extension Filter */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-darkBg-card border border-slate-200/60 dark:border-slate-850/60 rounded-xl text-xs">
            <FaFilter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent border-none outline-none font-semibold text-slate-600 dark:text-slate-300"
            >
              <option value="all">All File Formats</option>
              <option value="pdf">PDF Readers</option>
              <option value="images">Photos & Images</option>
              <option value="documents">Word/Excel/PowerPoint/Text</option>
              <option value="videos">Videos</option>
              <option value="audio">Audios</option>
              <option value="others">ZIPs & Others</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-darkBg-card border border-slate-200/60 dark:border-slate-850/60 rounded-xl text-xs">
            <FaSortAmountDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none outline-none font-semibold text-slate-600 dark:text-slate-300"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="size_desc">File Size (Max)</option>
              <option value="size_asc">File Size (Min)</option>
            </select>
          </div>

          {/* Grid/List toggles */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border dark:border-slate-800">
            <button
              onClick={() => setIsGridView(true)}
              className={`p-1.5 rounded-lg transition-all ${isGridView ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-500' : 'text-slate-400'}`}
            >
              <FaThLarge className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsGridView(false)}
              className={`p-1.5 rounded-lg transition-all ${!isGridView ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-500' : 'text-slate-400'}`}
            >
              <FaList className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Select Select-All bar */}
      {files.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 hover:text-slate-600 dark:hover:text-slate-200 transition-colors font-medium cursor-pointer"
          >
            {selectedFiles.length === files.length ? <FaCheckSquare className="w-4 h-4 text-indigo-500" /> : <FaSquare className="w-4 h-4" />}
            <span>{selectedFiles.length === files.length ? 'Deselect All' : 'Select All Files'}</span>
          </button>
          <span>Showing {files.length} file(s)</span>
        </div>
      )}

      {/* Files rendering container */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 rounded-3xl bg-slate-200/50 dark:bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      ) : files.length > 0 ? (
        isGridView ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {files.map((file) => {
              const isSelected = selectedFiles.includes(file._id);
              return (
                <div
                  key={file._id}
                  onContextMenu={(e) => handleContextMenu(e, file)}
                  className={`group relative p-4 rounded-3xl border select-none transition-all duration-350 flex flex-col justify-between h-[170px]
                    bg-white dark:bg-darkBg-card border-slate-200/50 dark:border-slate-850/50 hover:shadow-lg
                    ${isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-950/40'
                      : 'hover:border-slate-350 dark:hover:border-slate-700'
                    }`}
                >
                  {/* Select Checkbox (visible on hover or if selected) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelectFile(file._id);
                    }}
                    className={`absolute top-4 left-4 z-10 transition-opacity p-0.5 rounded
                      ${isSelected ? 'opacity-100 text-indigo-500' : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                  >
                    {isSelected ? <FaCheckSquare className="w-4.5 h-4.5" /> : <FaSquare className="w-4.5 h-4.5 bg-white dark:bg-slate-900 rounded" />}
                  </button>

                  {/* Favorite Indicator */}
                  {file.isFavorite && (
                    <FaStar className="absolute top-4 right-4 text-amber-500 w-4 h-4" />
                  )}

                  {/* File Metadata click area */}
                  <div
                    onClick={() => {
                      const previewEvent = new CustomEvent('previewFile', { detail: file._id });
                      window.dispatchEvent(previewEvent);
                    }}
                    className="flex flex-col items-center justify-center text-center flex-1 cursor-pointer pt-4"
                  >
                    {getFileIconComponent(file.fileType)}
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate w-full mt-3 px-2" title={file.displayName}>
                      {file.displayName}
                    </h4>
                  </div>

                  {/* File Size and Info footer */}
                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono mt-3 border-t border-slate-100 dark:border-slate-800/40 pt-2 px-1">
                    <span>{formatBytes(file.size)}</span>
                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="border rounded-3xl overflow-hidden bg-white dark:bg-darkBg-card border-slate-200/50 dark:border-slate-850/50 shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/10 text-slate-400 select-none">
                  <th className="p-4 w-12"></th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Uploaded By</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => {
                  const isSelected = selectedFiles.includes(file._id);
                  return (
                    <tr
                      key={file._id}
                      onContextMenu={(e) => handleContextMenu(e, file)}
                      onClick={() => {
                        const previewEvent = new CustomEvent('previewFile', { detail: file._id });
                        window.dispatchEvent(previewEvent);
                      }}
                      className={`border-b border-slate-100 dark:border-slate-800/20 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 cursor-pointer select-none
                        ${isSelected ? 'bg-indigo-50/30 dark:bg-indigo-950/10' : ''}`}
                    >
                      {/* Checkbox select */}
                      <td className="p-4 w-12" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleSelectFile(file._id)}
                          className={`${isSelected ? 'text-indigo-500' : 'text-slate-350 hover:text-slate-500'}`}
                        >
                          {isSelected ? <FaCheckSquare className="w-4 h-4" /> : <FaSquare className="w-4 h-4 bg-white dark:bg-slate-900 rounded" />}
                        </button>
                      </td>

                      {/* File Name */}
                      <td className="p-4 font-bold text-slate-700 dark:text-slate-200">
                        <div className="flex items-center gap-2 max-w-[250px] md:max-w-[400px] truncate">
                          {file.isFavorite && <FaStar className="text-amber-500 w-3.5 h-3.5 flex-shrink-0" />}
                          <span className="truncate">{file.displayName}</span>
                        </div>
                      </td>

                      {/* File Size */}
                      <td className="p-4 font-mono text-slate-500">{formatBytes(file.size)}</td>

                      {/* Uploaded By */}
                      <td className="p-4 text-slate-500">{file.uploadedBy?.name || 'Admin'}</td>

                      {/* Date */}
                      <td className="p-4 text-slate-500">{new Date(file.createdAt).toLocaleDateString()}</td>

                      {/* Quick Actions (View / Download) */}
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Quick View"
                            onClick={() => {
                              const previewEvent = new CustomEvent('previewFile', { detail: file._id });
                              window.dispatchEvent(previewEvent);
                            }}
                            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl"
                          >
                            <FaEye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Download File"
                            onClick={() => {
                              const token = localStorage.getItem('token');
                              const baseUrl = getBaseUrl();
                              window.open(`${baseUrl}/api/files/${file._id}/download?token=${token}`, '_blank');
                            }}
                            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl"
                          >
                            <FaDownload className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Empty category details info */
        <div className="text-center p-16 border border-dashed rounded-3xl bg-slate-50/50 dark:bg-slate-900/10 text-slate-400 border-slate-200 dark:border-slate-800">
          <FaFolderOpen className="w-12 h-12 mx-auto text-slate-350 dark:text-slate-700 mb-3" />
          <h4 className="text-sm font-bold text-slate-600 dark:text-slate-350">This folder is empty</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
            There are no documents uploaded here yet. Use the upload action to store files.
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
              onClick={handleBulkDownload}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <FaDownload className="w-3 h-3" />
              <span>Download</span>
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={handleBulkMove}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-755 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <span>Move</span>
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <FaTrashAlt className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </>
            )}

            <button
              onClick={() => setSelectedFiles([])}
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        categoryId={id}
        subCategoryId={selectedSubCategory ? selectedSubCategory._id : null}
        onUploadSuccess={loadCategoryData}
      />

      {/* Right-click Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isFavorite={contextMenu.isFavorite}
          onClose={() => setContextMenu(null)}
          onAction={handleContextAction}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

export default CategoryPage;
