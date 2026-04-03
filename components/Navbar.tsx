'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
    const router = useRouter();
    const params = useParams();
    const subdomain = params.subdomain as string;
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push(`/${subdomain}/login`);
    };

    return (
        <nav className="w-full p-4 bg-white/10 backdrop-blur-md border-b border-white/10 flex justify-between items-center sticky top-0 z-50">
            <Link href={`/${subdomain}/dashboard`} className="text-xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                UniFind <span className="text-xs text-gray-400 font-normal uppercase tracking-widest ml-2 border-l border-gray-600 pl-2">{subdomain}</span>
            </Link>

            <div className="flex items-center gap-4">
                {user?.role === 'ADMIN' && (
                    <Link href={`/${subdomain}/admin`} className="text-gray-300 hover:text-white transition-colors text-sm">
                        Admin Panel
                    </Link>
                )}
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg bg-red-500/20 text-red-200 text-sm hover:bg-red-500/30 transition-colors"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}
