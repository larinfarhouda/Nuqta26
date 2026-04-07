'use client';

export default function BackgroundShapes() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Warm base */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#fffdfa] via-white to-white" />

            {/* Soft teal glow — top right */}
            <div className="absolute top-[-8%] right-[-8%] w-[50%] h-[40%] rounded-full bg-gradient-to-bl from-primary/8 via-primary/3 to-transparent blur-[100px]" />

            {/* Soft secondary glow — bottom left */}
            <div className="absolute bottom-[-5%] left-[-5%] w-[35%] h-[30%] rounded-full bg-gradient-to-tr from-secondary/40 via-secondary/10 to-transparent blur-[80px]" />

            {/* Very subtle mid section glow */}
            <div className="absolute top-[40%] left-[20%] w-[30%] h-[20%] rounded-full bg-primary/3 blur-[120px]" />
        </div>
    );
}
