import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUserTie,
  FaCrown,
  FaLaptopCode,
  FaHome,
  FaUniversity,
  FaUsers,
  FaFolder,
  FaTrashAlt,
  FaStar,
  FaChartPie,
  FaChevronLeft,
  FaChevronRight,
  FaFolderPlus,
  FaFemale,
  FaUserSecret,
} from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const getCategoryIcon = (name) => {
  const lowercaseName = name.toLowerCase();
  if (lowercaseName.includes('ramesh') || lowercaseName.includes('boss')) {
    return <FaUserTie className="w-5 h-5 text-indigo-500" />;
  }
  if (lowercaseName.includes('lalitha') || lowercaseName.includes('minister')) {
    return <FaFemale className="w-5 h-5 text-rose-500" />;
  }
  if (lowercaseName.includes('niharika') || lowercaseName.includes('queen')) {
    return <FaCrown className="w-5 h-5 text-amber-500" />;
  }
  if (lowercaseName.includes('karthik') || lowercaseName.includes('secretary')) {
    return <FaLaptopCode className="w-5 h-5 text-cyan-500" />;
  }
  if (lowercaseName.includes('house')) {
    return <FaHome className="w-5 h-5 text-emerald-500" />;
  }
  if (lowercaseName.includes('bank')) {
    return <FaUniversity className="w-5 h-5 text-blue-500" />;
  }
  if (lowercaseName.includes('family')) {
    return <FaUsers className="w-5 h-5 text-violet-500" />;
  }
  return <FaFolder className="w-5 h-5 text-slate-400" />;
};

const Sidebar = ({ isCollapsed, setIsCollapsed, onAddCategoryClick }) => {
  const [categories, setCategories] = useState([]);
  const { isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error('Failed to fetch categories in sidebar:', err);
      }
    };
    fetchCategories();
    
    // Set up a listener for refresh category events
    const handleRefresh = () => fetchCategories();
    window.addEventListener('refreshCategories', handleRefresh);
    return () => window.removeEventListener('refreshCategories', handleRefresh);
  }, []);

  const baseLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <FaChartPie className="w-5 h-5 text-violet-500" /> },
    { to: '/favorites', label: 'Favorites', icon: <FaStar className="w-5 h-5 text-amber-500" /> },
  ];

  const adminLinks = [
    { to: '/trash', label: 'Trash Bin', icon: <FaTrashAlt className="w-5 h-5 text-rose-500" /> },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? '72px' : '260px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`fixed left-0 top-0 h-screen z-30 flex flex-col justify-between border-r shadow-sm transition-colors duration-300
        bg-[#FFFFFF]/90 dark:bg-darkBg-base/95 border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md`}
    >
      {/* Top Section / Brand */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-slate-800/50 min-h-[65px]">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col"
              >
                <span className="font-extrabold text-xs tracking-wider text-indigo-600 dark:text-indigo-400">KAKUMANU</span>
                <span className="font-black text-sm text-slate-800 dark:text-white leading-tight">DOCUMENT VAULT</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            {isCollapsed ? <FaChevronRight className="w-4 h-4" /> : <FaChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="p-3 space-y-6">
          {/* Main Links */}
          <div className="space-y-1">
            {baseLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
                  ${isActive
                    ? 'bg-indigo-50/70 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-semibold border-l-4 border-indigo-500'
                    : 'text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
                  }
                `}
              >
                {link.icon}
                {!isCollapsed && <span>{link.label}</span>}
              </NavLink>
            ))}
          </div>

          {/* Categories Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {!isCollapsed && <span>Categories</span>}
              {!isCollapsed && isAdmin && (
                <button
                  onClick={onAddCategoryClick}
                  title="Create custom category"
                  className="p-1 rounded bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 transition-colors"
                >
                  <FaFolderPlus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-0.5 max-h-[350px] overflow-y-auto pr-1">
              {categories.map((cat) => (
                <NavLink
                  key={cat._id}
                  to={`/category/${cat._id}`}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200
                    ${isActive
                      ? 'bg-indigo-50/70 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-semibold border-l-4 border-indigo-500'
                      : 'text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
                    }
                  `}
                >
                  {getCategoryIcon(cat.name)}
                  {!isCollapsed && (
                    <span className="truncate" title={cat.name}>
                      {cat.name.replace(/\(.*?\)/g, '')}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Settings / Admin */}
      <div className="p-3 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="space-y-1">
          {isAdmin &&
            adminLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
                  ${isActive
                    ? 'bg-indigo-50/70 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-semibold border-l-4 border-indigo-500'
                    : 'text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
                  }
                `}
              >
                {link.icon}
                {!isCollapsed && <span>{link.label}</span>}
              </NavLink>
            ))}
          
          {/* Quick Shortcuts Hint */}
          {!isCollapsed && (
            <div className="px-3 py-2 text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/30 rounded-lg text-center mt-2 select-none border border-slate-150 dark:border-slate-800/50">
              Press <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px]">?</kbd> for shortcuts
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
