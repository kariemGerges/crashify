import React from 'react';
import LoadingDots from '@/app/components/LoadingDots';

interface RacingLoaderProps {
    message?: string;
}

const RacingLoader: React.FC<RacingLoaderProps> = ({ message }) => {
    return (
        <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center overflow-hidden">
            <div className="relative w-full max-w-4xl px-4">
                {/* Loading Text */}
                <div className="text-center mb-8 sm:mb-12">
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-4">
                        Loading
                        <LoadingDots
                            shape="rounded"
                            color="#ffffff"
                            size={5}
                            count={3}
                            speed={0.8}
                            className="inline-block ml-2"
                        />
                    </h2>
                    <p className="text-red-500 text-sm sm:text-base md:text-lg font-semibold">
                        {message || 'Loading...'}
                    </p>
                </div>

                {/* Track Container */}
                <div className="relative w-full h-32 sm:h-40 md:h-48">
                    {/* Road */}
                    <div className="absolute inset-x-0 bottom-0 h-20 sm:h-24 md:h-28 bg-gray-700 rounded-lg overflow-hidden">
                        {/* Road Stripes - Animated */}
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full h-1 sm:h-1.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-stripe"></div>
                        </div>

                        {/* Center Line Dashes */}
                        <div className="absolute inset-0 flex items-center justify-around overflow-hidden">
                            {[...Array(8)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-8 sm:w-12 md:w-16 h-1 sm:h-1.5 bg-yellow-400 animate-dash"
                                    style={{ animationDelay: `${i * 0.2}s` }}
                                ></div>
                            ))}
                        </div>

                        {/* Side Lines */}
                        <div className="absolute top-2 left-0 right-0 h-0.5 bg-white opacity-50"></div>
                        <div className="absolute bottom-2 left-0 right-0 h-0.5 bg-white opacity-50"></div>
                    </div>

                    {/* Car */}
                    <div className="absolute bottom-6 sm:bottom-8 left-0 w-full animate-race">
                        <div className="relative w-16 sm:w-20 md:w-24 h-10 sm:h-12 md:h-14">
                            {/* Car Body */}
                            <div className="absolute inset-0">
                                {/* Main Body */}
                                <div className="absolute bottom-0 left-2 right-2 h-5 sm:h-6 md:h-7 bg-gradient-to-r from-red-600 via-red-700 to-red-600 rounded-sm"></div>

                                {/* Cabin */}
                                <div className="absolute bottom-4 sm:bottom-5 md:bottom-6 left-4 sm:left-5 right-3 sm:right-4 h-4 sm:h-5 md:h-6 bg-gradient-to-b from-gray-900 to-black rounded-t-lg"></div>

                                {/* Front Window */}
                                <div className="absolute bottom-4 sm:bottom-5 md:bottom-6 right-3 sm:right-4 w-3 sm:w-4 h-3 sm:h-4 bg-gradient-to-br from-blue-300 to-blue-500 opacity-60 rounded-tl-lg"></div>

                                {/* Rear Spoiler */}
                                {/* <div className="absolute bottom-6 sm:bottom-7 md:bottom-8 left-1 w-2 sm:w-3 h-2 sm:h-3 bg-black border-t-2 border-red-500"></div> */}

                                {/* Front Detail */}
                                <div className="absolute bottom-2 sm:bottom-2.5 md:bottom-3 right-1 w-1 h-1 sm:h-1.5 bg-yellow-300 rounded-full"></div>

                                {/* Racing Stripe */}
                                <div className="absolute bottom-3 sm:bottom-4 md:bottom-5 left-3 right-3 h-0.5 bg-white opacity-70"></div>
                            </div>

                            {/* Wheels */}
                            <div className="absolute -bottom-1 left-2 w-3 sm:w-4 h-3 sm:h-4 bg-black rounded-full border-2 border-gray-600">
                                <div className="w-full h-full rounded-full border border-red-500 animate-spin-fast"></div>
                            </div>
                            <div className="absolute -bottom-1 right-2 w-3 sm:w-4 h-3 sm:h-4 bg-black rounded-full border-2 border-gray-600">
                                <div className="w-full h-full rounded-full border border-red-500 animate-spin-fast"></div>
                            </div>

                            {/* Speed Lines */}
                            <div className="absolute -left-8 sm:-left-12 top-2 sm:top-3 w-6 sm:w-8 md:w-10 h-0.5 bg-gradient-to-r from-transparent to-red-500 opacity-60 animate-pulse"></div>
                            <div
                                className="absolute -left-6 sm:-left-10 top-4 sm:top-5 w-4 sm:w-6 md:w-8 h-0.5 bg-gradient-to-r from-transparent to-red-400 opacity-40 animate-pulse"
                                style={{ animationDelay: '0.1s' }}
                            ></div>
                        </div>
                    </div>

                    {/* Checkered Flag */}
                    <div className="absolute -right-4 sm:right-0 top-0 animate-wave">
                        <div className="w-8 sm:w-10 md:w-12 h-10 sm:h-12 md:h-14 bg-white rounded-sm grid grid-cols-4 grid-rows-4 border border-gray-400">
                            {[...Array(16)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`${
                                        (i + Math.floor(i / 4)) % 2 === 0
                                            ? 'bg-black'
                                            : 'bg-white'
                                    }`}
                                ></div>
                            ))}
                        </div>
                        <div className="w-1 h-16 sm:h-20 md:h-24 bg-gray-600 mx-auto"></div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-8 sm:mt-12 w-full max-w-md mx-auto">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-600 via-red-500 to-red-600 animate-progress rounded-full"></div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes race {
                    0%,
                    100% {
                        transform: translateX(0);
                    }
                    50% {
                        transform: translateX(calc(100vw - 100px));
                    }
                }

                @keyframes dash {
                    0% {
                        transform: translateX(-200%);
                        opacity: 0;
                    }
                    50% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateX(200%);
                        opacity: 0;
                    }
                }

                @keyframes stripe {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }

                @keyframes wave {
                    0%,
                    100% {
                        transform: rotate(-5deg);
                    }
                    50% {
                        transform: rotate(5deg);
                    }
                }

                @keyframes progress {
                    0% {
                        width: 0%;
                    }
                    100% {
                        width: 100%;
                    }
                }

                .animate-race {
                    animation: race 3s ease-in-out infinite;
                }

                .animate-dash {
                    animation: dash 2s linear infinite;
                }

                .animate-stripe {
                    animation: stripe 2s linear infinite;
                }

                .animate-wave {
                    animation: wave 1s ease-in-out infinite;
                    transform-origin: bottom center;
                }

                .animate-progress {
                    animation: progress 3s ease-in-out infinite;
                }

                .animate-spin-fast {
                    animation: spin 0.3s linear infinite;
                }

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                .delay-100 {
                    animation-delay: 0.1s;
                }

                .delay-200 {
                    animation-delay: 0.2s;
                }
            `}</style>
        </div>
    );
};

export default RacingLoader;
