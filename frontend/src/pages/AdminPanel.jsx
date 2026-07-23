import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';
import { FaUserPlus, FaUsers, FaHistory, FaTrashAlt, FaShieldAlt, FaKey, FaClock } from 'react-icons/fa';
import api from '../services/api';
import Swal from 'sweetalert2';

const AdminPanel = () => {
  const { user: currentUser, isAdmin, registerUser } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // New User Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Viewer');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get('/auth/users');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await api.get('/files/activity');
      if (res.data.success) {
        setActivities(res.data.logs);
      }
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    if (!name || !email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    const res = await registerUser(name, email, password, role);
    setSubmitting(false);

    if (res.success) {
      setFormSuccess(res.message || 'User account created successfully.');
      setName('');
      setEmail('');
      setPassword('');
      setRole('Viewer');
      fetchUsers();
      fetchLogs(); // updates timeline
    } else {
      setFormError(res.message || 'Failed to create user.');
    }
  };

  const handleDeleteUser = (userToDelete) => {
    Swal.fire({
      title: 'Revoke access for this user?',
      text: `Are you sure you want to delete the account for ${userToDelete.name}? they will immediately lose access to the vault.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete account',
      confirmButtonColor: '#e11d48',
      cancelButtonText: 'Cancel',
      background: document.documentElement.classList.contains('dark') ? '#161F30' : '#FFFFFF',
      color: document.documentElement.classList.contains('dark') ? '#F1F5F9' : '#1E293B',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await api.delete(`/auth/users/${userToDelete._id}`);
          if (res.data.success) {
            Swal.fire({
              title: 'Account Deleted!',
              text: `${userToDelete.name}'s key has been revoked.`,
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
              background: document.documentElement.classList.contains('dark') ? '#161F30' : '#FFFFFF',
              color: document.documentElement.classList.contains('dark') ? '#F1F5F9' : '#1E293B',
            });
            fetchUsers();
            fetchLogs();
          }
        } catch (err) {
          Swal.fire('Error', err.response?.data?.message || 'Failed to delete user', 'error');
        }
      }
    });
  };

  return (
    <div className="space-y-8 select-none">
      <Breadcrumbs items={[{ label: 'Admin Panel' }]} />

      <div className="border-b border-slate-200/50 dark:border-slate-800/50 pb-5">
        <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-tight flex items-center gap-2">
          <FaShieldAlt className="text-indigo-500 w-6 h-6" />
          <span>Admin Controls</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          Register family members, restrict access scopes, and trace overall audit timelines.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Create User and Accounts list */}
        <div className="lg:col-span-2 space-y-8">
          {/* Registration Locked Banner */}
          <div className="p-6 rounded-3xl border bg-slate-50 dark:bg-darkBg-card border-slate-200/50 dark:border-slate-850/50 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-2xl">
              <FaShieldAlt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Registration Protocol Locked</h3>
              <p className="text-[11px] text-slate-400 mt-1 max-w-md leading-relaxed">
                User registration is disabled. Only the three pre-defined administrative key accounts can connect to this family vault.
              </p>
            </div>
          </div>

          {/* Active Accounts list */}
          <div className="p-6 rounded-3xl border bg-white dark:bg-darkBg-card border-slate-200/50 dark:border-slate-850/50 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <FaUsers className="text-indigo-500 w-4.5 h-4.5" />
              <span>Active Vault Accounts</span>
            </h3>

            {loadingUsers ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/40 text-slate-400 select-none pb-2">
                      <th className="pb-2 font-semibold">User</th>
                      <th className="pb-2 font-semibold">Role</th>
                      <th className="pb-2 font-semibold text-right">Access Key</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((usr) => {
                      const isSelf = usr._id === currentUser.id;
                      return (
                        <tr key={usr._id} className="border-b border-slate-150 dark:border-slate-800/20 py-2.5">
                          <td className="py-2.5">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-700 dark:text-slate-200">{usr.name} {isSelf && '(You)'}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{usr.username}</span>
                            </div>
                          </td>
                          <td className="py-2.5 font-mono text-[10px] font-bold uppercase">
                            <span className={`px-2 py-0.5 rounded ${usr.role === 'Admin' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400'}`}>
                              {usr.role}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-mono text-[10px] text-slate-400 select-none">
                            Encrypted
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed activity Logs */}
        <div className="p-6 rounded-3xl border bg-white dark:bg-darkBg-card border-slate-200/50 dark:border-slate-850/50 shadow-sm flex flex-col max-h-[600px] overflow-hidden">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <FaHistory className="text-indigo-500 w-4 h-4" />
            <span>Vault Security Log</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {loadingLogs ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              ))
            ) : activities.length > 0 ? (
              activities.map((log) => (
                <div key={log._id} className="pb-3.5 border-b border-slate-100 dark:border-slate-850/40 last:border-b-0">
                  <div className="flex justify-between items-start mb-1 text-[10px]">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{log.user?.name || 'Admin'}</span>
                    <span className="text-slate-400 font-mono flex items-center gap-1 whitespace-nowrap">
                      <FaClock className="w-2.5 h-2.5" />
                      {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">{log.details}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">
                No log entries registered yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
