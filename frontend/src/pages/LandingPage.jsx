import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FaUserShield, FaCrown, FaLaptopCode, FaHome, FaShieldAlt, FaArrowRight } from 'react-icons/fa';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleStart = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const familyMembers = [
    {
      name: 'Kakumanu Ramesh Babu',
      role: 'Boss',
      desc: 'Oversees petrol bunk operations, bank accounts, and core family assets.',
      icon: <FaUserShield className="w-6 h-6 text-indigo-500" />,
    },
    {
      name: 'Kakumanu Lalitha Karuna',
      role: 'Home Minister',
      desc: 'Controls primary logistics, household operations, and general documents.',
      icon: <FaHome className="w-6 h-6 text-rose-500" />,
    },
    {
      name: 'Kakumanu Devi Kala Niharika',
      role: 'Queen of The House',
      desc: 'Preserves school history, study documents, and creative archives.',
      icon: <FaCrown className="w-6 h-6 text-amber-500" />,
    },
    {
      name: 'Kakumanu Karthik Jayanth',
      role: 'Chief Secretary',
      desc: 'Manages engineering files, technical setups, and digital configurations.',
      icon: <FaLaptopCode className="w-6 h-6 text-cyan-500" />,
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-slate-900 text-slate-100 font-sans">
      {/* Background radial effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/10 blur-[120px]" />

      {/* Top Header */}
      <header className="relative z-10 px-6 py-5 max-w-7xl w-full mx-auto flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-extrabold text-[10px] tracking-widest text-indigo-400">KAKUMANU</span>
          <span className="font-black text-sm tracking-wider text-white">DIGITAL VAULT</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-700/30">
          <FaShieldAlt className="w-3.5 h-3.5 text-indigo-400" />
          <span>AES-256 Hashed Session</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center text-center flex-1">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl space-y-6"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400">
            Secure Digital Asset Archive
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
            KAKUMANU FAMILY <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-indigo-300 to-violet-400">
              DIGITAL DOCUMENT VAULT
            </span>
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A premium, professional cloud environment built to archive, view, organize, and securely preserve crucial assets, credentials, and documents of the Kakumanu family.
          </p>

          <div className="pt-6">
            <button
              onClick={handleStart}
              className="group flex items-center gap-2 mx-auto px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-2xl text-sm font-bold shadow-xl shadow-indigo-500/20 hover:shadow-indigo-600/30 transform hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <span>{isAuthenticated ? 'Open Control Dashboard' : 'Unlock the Vault'}</span>
              <FaArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </motion.div>

        {/* Member cards grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mt-16"
        >
          {familyMembers.map((member, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-800/20 border border-slate-700/30 backdrop-blur-md hover:bg-slate-850/40 hover:border-slate-600/30 transition-all text-left group flex flex-col justify-between h-[160px]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 group-hover:bg-slate-850 group-hover:border-indigo-500/20 transition-all">
                  {member.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-500 bg-slate-850/60 border border-slate-800 px-2 py-0.5 rounded-md">
                  {member.role}
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">{member.name}</h3>
                <p className="text-xs text-slate-400 leading-normal mt-1.5">{member.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-6 border-t border-slate-800/40 bg-slate-950/20 text-center text-xs text-slate-500">
        <p>© 2026 Kakumanu Family Vault. Authorized Access Only. Managed by Chief Secretary Karthik Jayanth.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
