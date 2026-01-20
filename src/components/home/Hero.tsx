'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/navigation';
import { useEffect, useState } from 'react';

export default function Hero() {
    const t = useTranslations('Index');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (
        <section className="relative h-[450px] md:h-[550px] w-full rounded-2xl md:rounded-[2.5rem] overflow-hidden group bg-black shadow-xl md:shadow-2xl">
            {/* Background Image */}
            <div className="absolute inset-0">
                <Image
                    src="/images/hero_community_optimized.jpg"
                    alt="Nuqta Community"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1440px"
                    className="object-cover opacity-65 will-change-auto md:transition-transform md:duration-[15s] md:group-hover:scale-105"
                    priority
                    quality={85}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAQABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q=="
                />
            </div>

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/30 to-transparent z-10" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent z-10" />

            <div className="absolute inset-0 flex items-center z-20">
                <div className="container mx-auto px-4 md:px-8 lg:px-16">
                    <div className="max-w-3xl">
                        <div
                            className={`space-y-4 md:space-y-6 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        >
                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight [text-shadow:0_4px_12px_rgba(0,0,0,0.5)]">
                                {t.rich('title', {
                                    br: () => <br className="hidden md:block" />,
                                    highlight: (chunks) => <span className="text-primary italic">{chunks}</span>
                                })}
                            </h1>

                            <p className="text-sm md:text-base text-white/90 font-bold max-w-xl leading-relaxed [text-shadow:0_2px_8px_rgba(0,0,0,0.5)]">
                                {t('description')}
                            </p>

                            <div className="pt-2 md:pt-4 flex flex-wrap gap-3 md:gap-4 items-center">
                                <Link
                                    href="/register"
                                    className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-primary text-white font-black rounded-xl md:rounded-2xl hover:bg-white hover:text-gray-900 transition-all shadow-lg md:shadow-xl active:scale-95 text-xs md:text-sm uppercase tracking-widest"
                                >
                                    <span>{t('hero.discover_more')}</span>
                                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                                </Link>

                                <div className="hidden lg:flex items-center gap-3 px-6 py-3.5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 text-white font-bold text-sm">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>{t('hero.connected_community')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
