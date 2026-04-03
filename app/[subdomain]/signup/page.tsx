'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export default function SignupPage() {
    const params = useParams();
    const router = useRouter();
    const subdomain = params.subdomain as string;

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const redirectUser = (user: any) => {
        if (user.role === 'SUPER_ADMIN') {
            router.push(`/${subdomain}/super-admin`);
        } else if (user.role === 'ADMIN') {
            router.push(`/${subdomain}/admin`);
        } else {
            router.push(`/${subdomain}/dashboard`);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, subdomain }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            setSuccess('Account created! Redirecting to login...');
            setTimeout(() => {
                router.push(`/${subdomain}/login`);
            }, 2000);
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
            if (!res.ok) throw new Error(data.error || 'Google signup failed');

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            redirectUser(data.user);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'UNCONFIGURED_CLIENT_ID'}>
            <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900/40 via-purple-900/10 to-black pointer-events-none" />
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl pointer-events-none" />
                    
                    <h1 className="text-4xl font-extrabold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">
                        {subdomain.toUpperCase()}
                    </h1>
                    <p className="text-center text-gray-400 mb-8 font-medium tracking-wide">Create your campus account</p>

                    {error && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-sm text-center font-medium shadow-inner">
                            {error}
                        </motion.div>
                    )}
                    {success && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-200 text-sm text-center font-medium shadow-inner">
                            {success}
                        </motion.div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 pl-1">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-600"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 pl-1">College Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-600"
                                placeholder="student@example.edu"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 pl-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-600"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !!success}
                            className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold tracking-wide shadow-lg shadow-purple-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="mt-8 relative flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                        <span className="relative px-4 text-xs font-medium tracking-widest text-gray-500 bg-gray-900 rounded-full">OR</span>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google Authentication Failed')}
                            theme="filled_black"
                            shape="pill"
                            text="signup_with"
                        />
                    </div>

                    <div className="mt-8 text-center text-sm text-gray-400 font-medium">
                        Already have an account?{' '}
                        <Link href={`/${subdomain}/login`} className="text-purple-400 hover:text-purple-300 transition-colors hover:underline">
                            Sign In
                        </Link>
                    </div>
                </motion.div>
            </main>
        </GoogleOAuthProvider>
    );
}
