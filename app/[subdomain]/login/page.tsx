'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';


export default function LoginPage() {
    const params = useParams();
    const router = useRouter();
    const subdomain = params.subdomain as string;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // UI Effects State
    const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHoveringText, setIsHoveringText] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
        const handleMouseOver = (e: MouseEvent) => {
            if ((e.target as HTMLElement)?.closest('.magnify-text')) setIsHoveringText(true);
            else setIsHoveringText(false);
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseover', handleMouseOver);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseover', handleMouseOver);
        };
    }, []);

    const redirectUser = (user: any) => {
        if (user.role === 'SUPER_ADMIN') router.push(`/${subdomain}/super-admin`);
        else if (user.role === 'ADMIN') router.push(`/${subdomain}/admin`);
        else router.push(`/${subdomain}/dashboard`);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, subdomain }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            redirectUser(data.user);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential, subdomain }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Google login failed');

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            redirectUser(data.user);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const getCharacterEmoji = () => {
        if (focusedField === 'password') return '🙈'; // Covering eyes
        if (focusedField === 'email') return '👀'; // Looking carefully
        return '🕵️‍♂️'; // Standing guard
    };

    return (
        <div>
            {/* Custom Cursor Overlay */}
            <motion.div
                className="fixed pointer-events-none z-[100] drop-shadow-2xl text-4xl"
                animate={{ 
                    x: mousePos.x, 
                    y: mousePos.y, 
                    opacity: isHoveringText ? 1 : 0, 
                    scale: isHoveringText ? 1.5 : 0,
                    rotate: isHoveringText ? -15 : 0
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
                style={{ translateX: '-20%', translateY: '-20%' }}
                aria-hidden="true"
            >
                🔍
            </motion.div>

            <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#03000a] text-white relative overflow-hidden" aria-labelledby="login-heading">
                {/* Background effects */}
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 via-indigo-900/10 to-transparent pointer-events-none" aria-hidden="true" />
                
                {/* Watcher Persona */}
                <motion.div
                    animate={{ y: focusedField === 'password' ? 10 : 0, scale: focusedField === 'password' ? 0.95 : 1 }}
                    className="relative z-20 mb-[-1rem] flex flex-col items-center justify-center transition-all"
                    aria-hidden="true"
                >
                    <div className="text-6xl drop-shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                        {getCharacterEmoji()}
                    </div>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full max-w-md p-8 rounded-3xl bg-gray-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_0_80px_rgba(79,70,229,0.15)] relative z-10"
                    role="region"
                    aria-label="Login Form"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl pointer-events-none" aria-hidden="true" />
                    
                    <h1 id="login-heading" className="magnify-text text-4xl font-extrabold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 cursor-none transition-transform duration-300 hover:scale-[1.15] origin-center block">
                        {subdomain.toUpperCase()}
                    </h1>
                    <p className="magnify-text text-center text-gray-400 font-medium tracking-wide cursor-none transition-transform duration-300 hover:scale-110 origin-center block mb-8">
                        Welcome back to campus portal
                    </p>

                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                exit={{ opacity: 0, height: 0 }} 
                                className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-sm text-center font-bold shadow-inner overflow-hidden"
                                role="alert"
                                aria-live="assertive"
                            >
                                <span aria-hidden="true">⚠️</span> {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleLogin} className="space-y-6" noValidate>
                        <div>
                            <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-widest text-indigo-200/60 mb-2 pl-1 cursor-pointer">College Email</label>
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full p-4 rounded-xl bg-black/50 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#03000a] transition-all placeholder:text-gray-600 font-medium"
                                placeholder="student@example.edu"
                                required
                                aria-required="true"
                                aria-invalid={!!error}
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2 pl-1 pr-1">
                                <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-widest text-indigo-200/60 cursor-pointer">Password</label>
                                <Link 
                                    href={`/${subdomain}/forgot-password`} 
                                    className="magnify-text text-xs font-bold text-indigo-400 hover:text-indigo-300 focus:text-indigo-300 transition-all cursor-none hover:scale-110 origin-right block outline-none focus-visible:underline focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                                    aria-label="Forgot Password?"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                            <input
                                id="login-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                className="w-full p-4 rounded-xl bg-black/50 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#03000a] transition-all placeholder:text-gray-600 font-medium tracking-widest"
                                placeholder="••••••••"
                                required
                                aria-required="true"
                                aria-invalid={!!error}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="magnify-text cursor-none w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black tracking-widest uppercase shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#03000a]"
                            aria-busy={loading}
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-8 relative flex items-center justify-center pointer-events-none" aria-hidden="true">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                        <span className="relative px-4 text-[10px] font-black uppercase tracking-widest text-gray-500 bg-[#0c0818] rounded-full">Secure Connection</span>
                    </div>

                    <div className="mt-6 flex justify-center" aria-label="Alternative Login Methods">
                        <button
                            disabled
                            title="Google Sign-In coming soon"
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-gray-500 text-sm font-medium cursor-not-allowed opacity-50"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continue with Google (Coming Soon)
                        </button>
                    </div>

                    <div className="mt-8 text-center text-sm text-gray-400 font-medium">
                        Don't have an account?{' '}
                        <Link 
                            href={`/${subdomain}/signup`} 
                            className="magnify-text inline-block text-indigo-400 hover:text-indigo-300 font-bold transition-all cursor-none hover:scale-110 origin-center outline-none focus-visible:underline focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1"
                            aria-label="Create a new account"
                        >
                            Create an account
                        </Link>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
