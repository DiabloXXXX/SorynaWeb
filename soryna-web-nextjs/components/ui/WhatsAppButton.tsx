'use client';

import { FaWhatsapp } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function WhatsAppButton() {
    return (
        <motion.a
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1 }}
            href="https://wa.me/6281234567890?text=Halo%20soryna"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-[9998] group"
        >
            <div className="relative">
                {/* Subtle Shadow */}
                <div className="absolute inset-0 bg-green-600/30 rounded-full blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />

                {/* Main WhatsApp Button */}
                <div className="relative w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110">
                    <FaWhatsapp size={28} />
                </div>

                {/* Online Status Indicator - Top Right Corner */}
                <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-400 border-2 border-white" />
                </span>
            </div>
        </motion.a>
    );
}
