import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  FaSearch,
  FaBell,
  FaSun,
  FaMoon,
  FaSignOutAlt,
  FaUserCircle,
  FaFileAlt,
  FaFolder,
  FaTimes,
  FaShieldAlt
} from 'react-icons/fa';
import api from '../services/api';

const Navbar = ({ onSearchTrigger }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search results on query input
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults(null);
        return;
      }
      try {
        const res = await api.get(`/files/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.data.success) {
          setSearchResults(res.data);
        }
      } catch (err) {
        console.error('Global search error:', err);
      }
    };

    const delayDebounce = setTimeout(() => {
      performSearch();
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Fetch recent uploads for notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/files/activity');
      if (res.data.success) {
        // filter upload activities as notification messages
        const uploads = res.data.logs
          .filter(log => log.action === 'UPLOAD_FILE')
          .slice(0, 10);
        setNotifications(uploads);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // refresh notifications every 30s
    return () => clearInterval(interval);
  }, []);

  const handleResultClick = (type, id) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    if (type === 'file') {
      // Trigger file preview event or download
      const previewEvent = new CustomEvent('previewFile', { detail: id });
      window.dispatchEvent(previewEvent);
    } else if (type === 'category') {
      navigate(`/category/${id}`);
    }
  };

  return (
    <nav className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 border-b shadow-sm transition-colors duration-300
      bg-white/80 dark:bg-[#0B0F19]/80 border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md min-h-[65px]"
    >
      {/* Left: Global Search */}
      <div ref={searchRef} className="relative w-full max-w-lg">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3.5 text-slate-400 dark:text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search files, categories, display names..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border outline-none transition-all duration-300
              bg-slate-50 hover:bg-slate-100 border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100
              dark:bg-slate-900/50 dark:hover:bg-slate-900 dark:border-slate-800 dark:focus:border-indigo-500 dark:focus:bg-slate-900 dark:focus:ring-indigo-950/50"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults(null);
              }}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchDropdown && searchResults && (
          <div className="absolute left-0 right-0 mt-2 p-2 rounded-2xl shadow-xl border overflow-hidden max-h-[400px] overflow-y-auto
            bg-white dark:bg-[#161F30] border-slate-200/80 dark:border-slate-800/80"
          >
            {/* Categories */}
            {searchResults.categories?.length > 0 && (
              <div className="mb-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/40">
                  Folders
                </h4>
                {searchResults.categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => handleResultClick('category', cat._id)}
                    className="flex items-center gap-3 w-full px-3 py-2 text-left text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <FaFolder className="w-4 h-4 text-indigo-500" />
                    <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Subcategories */}
            {searchResults.subcategories?.length > 0 && (
              <div className="mb-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/40">
                  Sub-Folders
                </h4>
                {searchResults.subcategories.map((sub) => (
                  <button
                    key={sub._id}
                    onClick={() => handleResultClick('category', sub.category._id)}
                    className="flex items-center gap-3 w-full px-3 py-2 text-left text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <FaFolder className="w-4 h-4 text-teal-500" />
                    <div className="flex flex-col truncate">
                      <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{sub.name}</span>
                      <span className="text-[10px] text-slate-400">in {sub.category?.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Files */}
            {searchResults.files?.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/40">
                  Files
                </h4>
                {searchResults.files.map((file) => (
                  <button
                    key={file._id}
                    onClick={() => handleResultClick('file', file._id)}
                    className="flex items-center gap-3 w-full px-3 py-2 text-left text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <FaFileAlt className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="flex flex-col truncate">
                      <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{file.displayName}</span>
                      <span className="text-[10px] text-slate-400 truncate">{file.originalFilename}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchResults.categories?.length === 0 &&
              searchResults.subcategories?.length === 0 &&
              searchResults.files?.length === 0 && (
                <div className="text-center p-6 text-sm text-slate-400 dark:text-slate-500">
                  No files or categories found matching "{searchQuery}"
                </div>
              )}
          </div>
        )}
      </div>

      {/* Right: Actions Menu */}
      <div className="flex items-center gap-4">
        {/* Dark/Light mode Toggle */}
        <button
          onClick={toggleTheme}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2.5 rounded-xl border transition-all text-slate-500 hover:text-indigo-600 hover:bg-slate-50
            border-slate-200 dark:border-slate-800 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-900/50"
        >
          {darkMode ? <FaSun className="w-4.5 h-4.5" /> : <FaMoon className="w-4.5 h-4.5" />}
        </button>

        {/* Notifications Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl border transition-all text-slate-500 hover:text-indigo-600 hover:bg-slate-50
              border-slate-200 dark:border-slate-800 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-900/50"
          >
            <FaBell className="w-4.5 h-4.5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 p-2 rounded-2xl shadow-xl border overflow-hidden
              bg-white dark:bg-[#161F30] border-slate-200/80 dark:border-slate-800/80"
            >
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/40 mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Recent Uploads</span>
                <span className="text-[10px] font-medium text-slate-400">Real-time alerts</span>
              </div>
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className="p-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800/40"
                    >
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate pr-2">
                          {notif.user?.name || 'Admin'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 line-clamp-2">{notif.details}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-6 text-xs text-slate-400 dark:text-slate-500">
                    No recent upload activities.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl border transition-all text-slate-700 hover:bg-slate-50
              border-slate-200 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900/50"
          >
            <FaUserCircle className="w-6 h-6 text-indigo-500" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold max-w-[80px] truncate leading-tight">
                {user?.name?.split(' ')[0] || 'User'}
              </span>
              <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5">
                {user?.role === 'Admin' && <FaShieldAlt className="w-2.5 h-2.5 text-amber-500" />}
                {user?.role || 'Viewer'}
              </span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 p-2 rounded-2xl shadow-xl border overflow-hidden
              bg-white dark:bg-[#161F30] border-slate-200/80 dark:border-slate-800/80"
            >
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/40 mb-1">
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.username}</p>
              </div>

              {user?.role === 'Admin' && (
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/admin');
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <FaShieldAlt className="w-3.5 h-3.5 text-amber-500" />
                  Admin Controls
                </button>
              )}

              <button
                onClick={logout}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
              >
                <FaSignOutAlt className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
