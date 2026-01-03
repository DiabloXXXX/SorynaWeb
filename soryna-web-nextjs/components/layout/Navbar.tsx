'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenu, HiX } from 'react-icons/hi';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';

const navLinks = ['Beranda', 'Tentang', 'Layanan', 'Portfolio'];

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { isDark } = useTheme();

    const focusStyles = 'focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current';

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (label: string) => {
        // Map Bahasa Indonesia labels to actual section IDs
        const sectionMap: { [key: string]: string } = {
            'Beranda': 'home',
            'Tentang': 'about',
            'Layanan': 'services',
            'Portfolio': 'portfolio'
        };

        const sectionId = sectionMap[label] || label.toLowerCase();
        const el = document.getElementById(sectionId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
            setIsMobileMenuOpen(false);
        }
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${isScrolled
            ? isDark ? 'bg-gray-950/90 backdrop-blur-lg border-b border-white/5 py-3' : 'bg-white/90 backdrop-blur-lg border-b border-gray-200 py-3 shadow-sm'
            : isDark ? 'bg-gradient-to-b from-black/50 to-transparent py-5' : 'bg-gradient-to-b from-white/50 to-transparent py-5'
            }`}>
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center shrink-0">
                        <Link href="/" className={`text-2xl font-bold tracking-tight ${focusStyles}`}>
                            <span className={isDark ? "text-white" : "text-gray-900"}>sory</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-cyan-500">na</span>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex flex-1 items-center justify-center">
                        <div className="flex items-center gap-1">
                            {navLinks.map((item) => (
                                <button
                                    key={item}
                                    onClick={() => scrollToSection(item)}
                                    className={`${focusStyles} px-4 py-2 text-sm font-medium transition-colors rounded-full active:opacity-90 ${isDark
                                        ? 'text-gray-300 hover:text-white hover:bg-white/5'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                        }`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="hidden md:flex items-center justify-end gap-3 shrink-0">
                        <div className={`w-px h-6 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

                        <ThemeToggle />

                        <button
                            onClick={() => scrollToSection('contact')}
                            className={`${focusStyles} px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg active:opacity-90 ${isDark
                                ? 'bg-white text-gray-900 hover:bg-gray-100 shadow-white/5'
                                : 'bg-gray-900 text-white hover:bg-black shadow-black/10'
                                }`}
                        >
                            Hubungi Kami
                        </button>
                    </div>

                    {/* Mobile Actions */}
                    <div className="flex items-center gap-4 md:hidden">
                        <ThemeToggle />
                        <button
                            className={`${focusStyles} p-2 rounded-lg transition-colors active:opacity-90 ${isDark ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'
                                }`}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`md:hidden border-t overflow-hidden ${isDark
                            ? 'bg-gray-950 border-white/5'
                            : 'bg-white border-gray-200 shadow-lg'
                            }`}
                    >
                        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                            <div className="space-y-1">
                                {navLinks.map((item) => (
                                    <button
                                        key={item}
                                        onClick={() => scrollToSection(item)}
                                        className={`${focusStyles} block w-full text-left px-4 py-3 rounded-xl transition-colors font-medium active:opacity-90 ${isDark
                                            ? 'text-gray-300 hover:text-white hover:bg-white/5'
                                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                                            }`}
                                    >
                                        {item}
                                    </button>
                                ))}

                                <button
                                    onClick={() => scrollToSection('contact')}
                                    className={`${focusStyles} block w-full text-center mt-4 px-4 py-3 font-bold rounded-xl active:opacity-90 ${isDark
                                        ? 'bg-white text-gray-900'
                                        : 'bg-gray-900 text-white'
                                        }`}
                                >
                                    Hubungi Kami
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
