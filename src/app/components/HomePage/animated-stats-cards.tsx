'use client';

import { useState, useEffect } from 'react';

interface StatCardProps {
    targetValue: number;
    label: string;
    duration?: number;
}

const StatCard = ({ targetValue, label, duration = 2000 }: StatCardProps) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = (currentTime - startTime) / duration;

            if (progress < 1) {
                setCount(Math.floor(targetValue * progress));
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(targetValue);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [targetValue, duration]);

    return (
        <div
            className="bg-gradient-to-br from-gray-900 to-black border
         border-red-800 rounded-3xl p-8 sm:p-12 flex flex-col items-center
         justify-center w-32 h-32 sm:w-64 sm:h-64 shadow-2xl hover:scale-105
         transition-transform duration-300 flex-shrink-0"
        >
            <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-red-500 mb-3 sm:mb-4">
                {count}%
            </div>
            <div className="text-gray-300 text-center text-xs sm:text-sm font-light tracking-widest uppercase">
                {label}
            </div>
        </div>
    );
};

export default function AnimatedStats() {
    const stats = [
        { targetValue: 95, label: 'Accuracy Rate' },
        { targetValue: 75, label: 'Time Reduction' },
        { targetValue: 60, label: 'Cost Savings' },
        { targetValue: 99, label: 'Fraud Detection' },
    ];

    return (
        <div className="w-full overflow-hidden py-4">
            <div className="relative">
                <div className="flex animate-scroll">
                    {/* First set of cards */}
                    {stats.map((stat, i) => (
                        <div key={`set1-${i}`} className="px-3 sm:px-4">
                            <StatCard
                                targetValue={stat.targetValue}
                                label={stat.label}
                            />
                        </div>
                    ))}
                    {/* Duplicate set for seamless loop */}
                    {stats.map((stat, i) => (
                        <div key={`set2-${i}`} className="px-3 sm:px-4">
                            <StatCard
                                targetValue={stat.targetValue}
                                label={stat.label}
                            />
                        </div>
                    ))}
                    {/* Triple set for extra smoothness */}
                    {stats.map((stat, i) => (
                        <div key={`set3-${i}`} className="px-3 sm:px-4">
                            <StatCard
                                targetValue={stat.targetValue}
                                label={stat.label}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                @keyframes scroll {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-33.333%);
                    }
                }

                .animate-scroll {
                    animation: scroll 20s linear infinite;
                }

                .animate-scroll:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
}
