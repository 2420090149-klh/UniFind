'use client';

import { useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

function ResetPasswordForm() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const subdomain = params.subdomain as string;
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to reset password');
            }

            setMessage('Password successfully reset! Redirecting to login...');
            
            setTimeout(() => {
                router.push(`/${subdomain}/login`);
            }, 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 text-center">
                <h1 className="text-3xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-red-600">
                    Invalid Link
                </h1>
                <p className="text-gray-400 mb-8">The password reset link is invalid or missing.</p>
                <Link href={`/${subdomain}/forgot-password`} className="inline-block py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold tracking-wide shadow-lg hover:from-blue-500 hover:to-indigo-500 transition-all">
                    Request New Link
                </Link>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10"
        >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl pointer-events-none" />
            
            <h1 className="text-3xl font-extrabold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
                Set New Password
            </h1>
            <p className="text-center text-gray-400 mb-8 font-medium tracking-wide text-sm">Please enter your new password below.</p>

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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 pl-1">New Password</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
                        placeholder="••••••••"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 pl-1">Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-gray-600"
                        placeholder="••••••••"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !!message} // Disable if success message is showing
                    className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold tracking-wide shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>
            </form>
        </motion.div>
    );
}

export default function ResetPasswordPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-900 text-white relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-purple-900/20 to-black pointer-events-none" />
            
            <Suspense fallback={
                <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 text-center">
                    Loading...
                </div>
            }>
                <ResetPasswordForm />
            </Suspense>
        </main>
    );
}
