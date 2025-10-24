interface TakeSpinArgs {
    px?: string;
    py?: string;
}

export default function TakeSpin({px, py}: TakeSpinArgs) {
        return (
            <div className="pt-4 sm:pt-6">
                <button
                    className={`${px} sm::${py} py-3 sm:${py} bg-gradient-to-r from-red-600 to-red-900
                        text-white text-base sm:text-lg font-semibold rounded-lg shadow-lg shadow-amber-600/50 
                        hover:shadow-xl hover:shadow-blue-600/70 transform hover:scale-105 transition-all duration-300`}
                >
                    Take a Spin
                </button>
            </div>
        );
}