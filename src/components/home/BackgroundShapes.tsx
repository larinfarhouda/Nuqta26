'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function BackgroundShapes() {
    const [isMobile, setIsMobile] = useState<boolean | null>(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Don't render until hydration is complete to avoid mismatch
    if (isMobile === null) return <div className="absolute inset-0 bg-[#fffdfa]" />;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Base Tone */}
            <div className="absolute inset-0 bg-[#fffdfa]" />

            {/* Dynamic Mesh Gradients - Simplified on mobile */}
            <motion.div
                animate={isMobile ? {} : {
                    x: [0, 50, 0],
                    y: [0, -30, 0],
                    rotate: [0, 10, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-[120px]"
            />
            <motion.div
                animate={isMobile ? {} : {
                    x: [0, -40, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-secondary/20 via-secondary/10 to-transparent blur-[120px]"
            />

            {/* Brand "Nuqta" Dots - Scattered and subtle - Hidden on mobile */}
            {!isMobile && (
                <div className="absolute inset-0">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: [0.1, 0.3, 0.1],
                                y: [0, -20, 0],
                                x: [0, 10, 0]
                            }}
                            transition={{
                                duration: 8 + i * 2,
                                repeat: Infinity,
                                delay: i * 1.5
                            }}
                            className="absolute w-2 h-2 rounded-full bg-primary"
                            style={{
                                top: `${15 + i * 12}%`,
                                left: `${10 + (i % 3) * 25}%`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Decorative Lines / Orbits */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                <circle cx="500" cy="500" r="400" stroke="currentColor" strokeWidth="1" fill="none" className="text-primary" />
                <circle cx="900" cy="100" r="200" stroke="currentColor" strokeWidth="1" fill="none" className="text-secondary" />
                <path d="M-100 500 Q 250 200, 500 500 T 1100 500" stroke="currentColor" strokeWidth="2" fill="none" className="text-primary" />
            </svg>

            {/* Subtle Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.07] pointer-events-none bg-[url('/images/patterns/natural-paper.png')]" />

            {/* Grainy Noise Overlay for extra edge */}
            <div className="absolute inset-0 opacity-[0.03] contrast-150 brightness-100 pointer-events-none mix-blend-multiply bg-[url('/images/patterns/p6.png')]" />
        </div>
    );
}
