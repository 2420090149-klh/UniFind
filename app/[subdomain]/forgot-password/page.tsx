'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
    const params = useParams();
    const subdomain = params.subdomain as string;

    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send reset link');
            }

            setMessage(data.message || 'If an account exists with that email, a reset link has been generated.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-900 text-white relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-purple-900/20 to-black pointer-events-none" />
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl pointer-events-none" />
                
                <h1 className="text-3xl font-extrabold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
                    Reset Password
                </h1>
                <p className="text-center text-gray-400 mb-8 font-medium tracking-wide text-sm">Enter your email and we'll send you a link to reset your password.</p>

                {error && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-sm text-center font-medium shadow-inner">
                        {error}
                    </motion.div>
                )}

                {message && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-200 text-sm text-center font-medium shadow-inner">
                        {message}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 pl-1">College Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
                            placeholder="student@example.edu"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold tracking-wide shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending Request...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-400 font-medium">
                    Remembered your password?{' '}
                    <Link href={`/${subdomain}/login`} className="text-indigo-400 hover:text-indigo-300 transition-colors hover:underline">
                        Back to Login
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}
