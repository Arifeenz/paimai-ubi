'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from './Button';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Check active session
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
        };
        getSession();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <span className="text-2xl">🌿</span>
                        <span className="text-xl font-bold text-green-600">PaiMai</span>
                    </Link>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <Link href="/profile" className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                                    {user.email?.[0].toUpperCase()}
                                </div>
                                <span className="text-sm font-medium hidden sm:block">โปรไฟล์</span>
                            </Link>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="secondary" className="hidden sm:block text-sm px-5 py-2">
                                        เข้าสู่ระบบ
                                    </Button>
                                </Link>
                                <Link href="/login">
                                    <Button variant="primary" className="text-sm px-5 py-2">
                                        ลงทะเบียน
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
