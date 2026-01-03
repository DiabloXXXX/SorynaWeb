'use client';

import { motion } from 'framer-motion';
import { HiSun, HiMoon } from 'react-icons/hi2';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all duration-300 ${isDark
                ? 'bg-white/10 text-yellow-400 hover:bg-white/20'
                : 'bg-gray-100 text-violet-600 hover:bg-gray-200'
                }`}
            aria-label="Toggle Theme"
        >
            <motion.div
                initial={false}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                {isDark ? <HiSun size={20} /> : <HiMoon size={20} />}
            </motion.div>
        </button>
    );
}
