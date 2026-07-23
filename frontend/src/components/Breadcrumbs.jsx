import React from 'react';
import { Link } from 'react-router-dom';
import { FaChevronRight, FaHome } from 'react-icons/fa';

const Breadcrumbs = ({ items = [] }) => {
  return (
    <nav className="flex items-center space-x-2 text-xs font-medium text-slate-400 dark:text-slate-500 mb-6 select-none">
      <Link
        to="/dashboard"
        className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors"
      >
        <FaHome className="w-3.5 h-3.5" />
        <span>Vault Root</span>
      </Link>
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <FaChevronRight className="w-2.5 h-2.5 flex-shrink-0" />
            {isLast || !item.path ? (
              <span className="text-slate-600 dark:text-slate-300 font-semibold truncate max-w-[200px]">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="hover:text-indigo-500 transition-colors truncate max-w-[200px]"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
