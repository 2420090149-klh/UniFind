'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#03000a] text-white overflow-hidden relative font-sans flex flex-col items-center justify-center p-6">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#03000a] to-black"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[150px]"></div>
      </div>

      <Link href="/" className="absolute top-8 left-8 z-50 text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-white transition-colors flex items-center gap-2">
        <span>← Back Home</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-3xl text-center space-y-8 p-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_80px_rgba(79,70,229,0.15)]"
      >
        <h1 className="text-4xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-400">
          About UniFind
        </h1>
        <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-medium">
          UniFind is the ultimate localized Campus Lost & Found platform. Built with a vision to securely and rapidly connect students who have lost their belongings with those who found them, right within their own university's ecosystem.
        </p>
        <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-medium">
          Our platform aims to eliminate the messy WhatsApp groups and chaotic bulletin boards, replacing them with a secure, searchable, and verified system managed by dedicated floor and campus administrators.
        </p>
        <div className="pt-8 flex justify-center gap-6">
          <div className="p-6 rounded-2xl bg-black/40 border border-white/5 flex-1">
            <h3 className="text-2xl font-bold text-white mb-2">Secure</h3>
            <p className="text-sm text-gray-400">Campus email verified logins ensure a trusted community environment.</p>
          </div>
          <div className="p-6 rounded-2xl bg-black/40 border border-white/5 flex-1">
            <h3 className="text-2xl font-bold text-white mb-2">Fast</h3>
            <p className="text-sm text-gray-400">Instant database querying and easy visual photo mapping for fast returns.</p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
