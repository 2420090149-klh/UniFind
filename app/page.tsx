'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

const AnimatedDetective = () => {
  return (
    <div className="absolute top-0 right-0 translate-x-[60%] -translate-y-[80%] md:translate-x-[90%] md:-translate-y-[60%] w-16 h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 pointer-events-none drop-shadow-2xl z-50">
      {/* Animated Realistic Right Arm & Magnifying Glass (Placed strictly behind the body) */}
      <motion.div 
        className="absolute inset-0 pointer-events-none z-0 w-full h-full translate-y-[17%] -translate-x-[9%]"
        style={{ originX: '73%', originY: '72%' }}
        animate={{ rotate: [-20, 5, -20] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          {/* Shoulder Joint/Pivot */}
          <circle cx="73" cy="72" r="8" fill="url(#coat)" />
          
          {/* Coat Sleeve */}
          <path d="M 66 72 L 80 72 Q 95 82 98 92 L 85 98 Q 80 85 66 72 Z" fill="url(#coat)" />
          
          {/* Shirt Cuff */}
          <polygon points="84,96 99,89 101,93 87,100" fill="#F3F4F6" />
          
          {/* Hand back */}
          <circle cx="95" cy="95" r="5" fill="url(#skin)" />
          
          {/* Magnifying Glass Handle */}
          <line x1="93" y1="102" x2="112" y2="76" stroke="#1F2937" strokeWidth="5.5" strokeLinecap="round" />
          
          {/* Thumb & Fingers gripping the handle */}
          <path d="M 91 95 Q 94 90 98 93 Q 95 98 91 95 Z" fill="url(#skin)" stroke="#B45309" strokeWidth="0.5" />
          <path d="M 94 98 Q 98 94 100 96 Q 96 100 94 98 Z" fill="url(#skin)" stroke="#B45309" strokeWidth="0.5" />
          
          {/* Magnifying Glass Lens & Rim */}
          <circle cx="118" cy="68" r="16" fill="rgba(34,211,238,0.25)" stroke="#D1D5DB" strokeWidth="4" />
          {/* Glass Lens Reflection glare */}
          <path d="M 107 65 Q 112 55 125 58" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </motion.div>

      {/* Main Body */}
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible relative z-10">
        <defs>
          <linearGradient id="coat" x1="0" y1="50" x2="0" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
          <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>

        {/* Coat */}
        <path d="M 15 100 Q 50 50 85 100" fill="url(#coat)" />
        {/* Shirt & Tie */}
        <path d="M 40 100 L 50 75 L 60 100 Z" fill="#F3F4F6" />
        <path d="M 47 75 L 53 75 L 50 100 Z" fill="#DC2626" />

        {/* Head */}
        <circle cx="50" cy="45" r="20" fill="url(#skin)" />

        {/* Hat */}
        <path d="M 10 30 Q 50 20 90 30 Q 50 35 10 30" fill="#1F2937" />
        <path d="M 30 28 L 70 28 C 70 10 60 5 50 5 C 40 5 30 10 30 28 Z" fill="#2d3748" />
        <rect x="30" y="24" width="40" height="4" fill="#8B5CF6" />

        {/* Eye Whites */}
        <ellipse cx="42" cy="45" rx="5" ry="3" fill="#FFFFFF" />
        <ellipse cx="58" cy="45" rx="5" ry="3" fill="#FFFFFF" />

        {/* Eye Pupils (Animated) */}
        <motion.circle cx="42" cy="45" r="2.5" fill="#000"
          animate={{ cx: [40, 44, 40] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        />
        <motion.circle cx="58" cy="45" r="2.5" fill="#000"
          animate={{ cx: [56, 60, 56] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        />
        
        {/* Eyebrows */}
        <path d="M 36 40 Q 42 37 47 40" fill="none" stroke="#614A24" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 53 40 Q 58 37 64 40" fill="none" stroke="#614A24" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
};

export default function Home() {
  const [colleges, setColleges] = useState<any[]>([]);
  const { scrollY } = useScroll();
  
  // Fantastic Scroll Animations
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.85]);
  const y = useTransform(scrollY, [0, 300], [0, -100]);
  const rotateX = useTransform(scrollY, [0, 300], [0, 45]);
  const blur = useTransform(scrollY, [0, 300], ["blur(0px)", "blur(10px)"]);

  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/colleges')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        return res.json();
      })
      .then(data => {
        setColleges(data.colleges || []);
        if ((data.colleges || []).length === 0) setError('No colleges found. Run seed script.');
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load campuses. Please check server logs.');
      });
  }, []);

  return (
    <main className="min-h-[200vh] bg-[#03000a] text-white overflow-hidden relative font-sans">
      {/* Top Navigation */}
      <nav className="absolute top-0 inset-x-0 p-8 z-50 flex justify-end">
        <Link 
          href="/about" 
          className="relative text-sm font-bold tracking-widest uppercase text-gray-300 hover:text-white transition-colors group"
        >
          About
          <span className="absolute -bottom-1.5 left-0 w-0 h-[2px] bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-300 group-hover:w-full"></span>
        </Link>
      </nav>

      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#03000a] to-black"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[150px]"></div>
      </div>

      {/* Screen Reader Only Title */}
      <h1 className="sr-only">UNIFIND Campus Lost and Found</h1>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4" style={{ perspective: '1000px' }}>
        <motion.div
          style={{ opacity, scale, y, rotateX, filter: blur }}
          className="text-center w-full max-w-[100vw]"
        >
          {/* Staggered UNIFIND Animation */}
          <motion.div
            aria-hidden="true"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1, delayChildren: 0.3 }
              }
            }}
            className="flex justify-center mb-6 overflow-visible py-16 w-full flex-wrap sm:flex-nowrap"
          >
            {"UNIFIND".split('').map((letter, i) => (
              <motion.span
                key={i}
                variants={{
                  hidden: { opacity: 0, x: -50, y: 30, filter: 'blur(10px)', rotate: -15 },
                  visible: { 
                    opacity: 1, 
                    x: 0, 
                    y: 0,
                    filter: 'blur(0px)',
                    rotate: 0,
                    transition: { type: 'spring', stiffness: 120, damping: 12 } 
                  }
                }}
                className={`relative text-[15vw] sm:text-[13vw] md:text-[9rem] lg:text-[11rem] leading-none font-black bg-clip-text text-transparent bg-gradient-to-b from-white via-blue-200 to-purple-600 tracking-tight ${i === 3 ? 'md:mx-2' : ''}`}
                style={{ textShadow: '0 20px 40px rgba(147, 51, 234, 0.3)' }}
              >
                {letter}
                {i === 6 && (
                  <div style={{ textShadow: 'none' }}>
                    <AnimatedDetective />
                  </div>
                )}
              </motion.span>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="text-lg sm:text-xl md:text-3xl text-blue-200/60 font-bold tracking-[0.2em] md:tracking-[0.4em] uppercase px-4"
          >
            Campus Lost & Found
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1, repeat: Infinity, repeatType: "reverse" }}
            className="mt-16 sm:mt-20 text-gray-400 font-bold tracking-widest text-sm flex flex-col items-center gap-3"
            aria-hidden="true"
          >
            <span>SCROLL</span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-gray-400 to-transparent"></div>
          </motion.div>
        </motion.div>
      </div>

      {/* College List Section */}
      <section className="relative z-20 min-h-screen flex flex-col items-center pt-24 pb-32 px-6" aria-label="Campus Selection">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-3xl sm:text-4xl md:text-6xl font-black mb-16 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-400 drop-shadow-lg"
        >
          Select Your Campus
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl w-full">
          {colleges.map((college, index) => {
            const isKL = college.subdomain === 'kl' || college.name.toLowerCase().includes('kl');
            const displayName = isKL ? 'KLHB' : college.name;
            const bgImage = isKL ? '/klhb_campus.png' : 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'; // Fallback generic campus

            return (
              <motion.div
                key={college.id}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.7, ease: "easeOut" }}
                viewport={{ once: true, margin: "-50px" }}
                className="group relative h-80 rounded-3xl overflow-hidden cursor-pointer shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:shadow-[0_0_80px_rgba(147,51,234,0.3)] hover:-translate-y-2 focus-within:ring-4 focus-within:ring-purple-500 focus-within:ring-offset-4 focus-within:ring-offset-[#03000a]"
              >
                <Link 
                  href={`/${college.subdomain}/login`} 
                  className="block w-full h-full outline-none"
                  aria-label={`Access ${displayName} portal`}
                >
                  {/* Background Image */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                    style={{ backgroundImage: `url(${bgImage})` }}
                    aria-hidden="true"
                  />
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#03000a] via-[#03000a]/60 to-transparent transition-opacity duration-500 group-hover:opacity-80" aria-hidden="true" />
                  
                  {/* Animated Border Glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-tr from-blue-500/0 via-purple-500/20 to-blue-500/0 pointer-events-none" aria-hidden="true" />

                  {/* Content */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <motion.div 
                      className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500"
                    >
                      <h3 className="text-4xl font-black mb-3 text-white drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)] bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                        {displayName}
                      </h3>
                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        <span className="w-8 h-[2px] bg-purple-500 rounded-full" aria-hidden="true" />
                        <p className="text-purple-300 font-bold uppercase tracking-widest text-xs">Access Portal</p>
                      </div>
                    </motion.div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
          
          {error && (
            <div role="alert" className="col-span-full text-center text-red-400 bg-red-900/20 p-6 rounded-2xl border border-red-500/30 font-bold backdrop-blur-md">
              <span aria-hidden="true">⚠️</span> {error}
            </div>
          )}
          
          {!error && colleges.length === 0 && (
            <div className="col-span-full text-center p-12" aria-live="polite">
               <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_30px_rgba(147,51,234,0.5)]" aria-hidden="true" />
               <p className="mt-6 text-gray-400 font-bold tracking-widest uppercase">Connecting to Systems...</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
