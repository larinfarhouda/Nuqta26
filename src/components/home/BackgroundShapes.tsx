'use client';

import { motion } from 'framer-motion';

export default function BackgroundShapes() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Soft Ambient Blobs */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.4, scale: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px]"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.3, scale: 1 }}
                transition={{ duration: 2.5, ease: "easeOut", delay: 0.2 }}
                className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[120px]"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.2, scale: 1 }}
                transition={{ duration: 3, ease: "easeOut", delay: 0.5 }}
                className="absolute top-[40%] left-[20%] w-[30%] h-[30%] rounded-full bg-accent/5 blur-[80px]"
            />

            {/* Subtle Grid Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />
        </div>
    );
}
