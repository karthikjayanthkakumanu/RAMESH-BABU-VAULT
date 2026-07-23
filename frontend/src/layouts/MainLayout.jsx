import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import api from '../services/api';

const MainLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // If auth is loading, render a beautiful screen loader
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F8FAFC] dark:bg-[#0B0F19]">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-100 rounded-full dark:border-slate-800" />
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 rounded-full animate-spin border-t-transparent" />
        </div>
        <p className="mt-4 font-mono text-xs tracking-widest text-slate-400 dark:text-slate-500 uppercase animate-pulse">
          Decrypting Vault...
        </p>
      </div>
    );
  }

  // Protect routes client-side
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Handle category creation from sidebar click
  const handleAddCategory = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Create Custom Category',
      html:
        '<input id="swal-cat-name" class="swal2-input font-sans text-sm rounded-xl" placeholder="Category Name (e.g. Health Papers)">' +
        '<textarea id="swal-cat-desc" class="swal2-textarea font-sans text-sm rounded-xl" placeholder="Description (Optional)"></textarea>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Create Folder',
      confirmButtonColor: '#4c6ef5',
      cancelButtonText: 'Cancel',
      background: document.documentElement.classList.contains('dark') ? '#161F30' : '#FFFFFF',
      color: document.documentElement.classList.contains('dark') ? '#F1F5F9' : '#1E293B',
      preConfirm: () => {
        const name = document.getElementById('swal-cat-name').value;
        const description = document.getElementById('swal-cat-desc').value;
        if (!name) {
          Swal.showValidationMessage('Category name is required');
          return false;
        }
        return { name, description };
      }
    });

    if (formValues) {
      try {
        const res = await api.post('/categories', formValues);
        if (res.data.success) {
          Swal.fire({
            title: 'Category Created!',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: document.documentElement.classList.contains('dark') ? '#161F30' : '#FFFFFF',
            color: document.documentElement.classList.contains('dark') ? '#F1F5F9' : '#1E293B',
          });
          // Dispatch global refresh event
          window.dispatchEvent(new Event('refreshCategories'));
        }
      } catch (err) {
        Swal.fire({
          title: 'Error',
          text: err.response?.data?.message || 'Failed to create category',
          icon: 'error',
          background: document.documentElement.classList.contains('dark') ? '#161F30' : '#FFFFFF',
          color: document.documentElement.classList.contains('dark') ? '#F1F5F9' : '#1E293B',
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-darkBg-base text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onAddCategoryClick={handleAddCategory}
      />

      {/* Main Content Area */}
      <div
        className="transition-all duration-300 min-h-screen flex flex-col"
        style={{ paddingLeft: isSidebarCollapsed ? '72px' : '260px' }}
      >
        <Navbar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
