import React from "react";


type Shape = "circle" | "square" | "rounded";

type LoadingDotsProps = {
    shape?: Shape;
    color?: string;
    size?: number | string; // px if number
    count?: number;
    speed?: number; // seconds for full cycle
    className?: string;
    style?: React.CSSProperties;
    "aria-label"?: string;
};

const LoadingDots: React.FC<LoadingDotsProps> = ({
    shape = "circle",
    color = "currentColor",
    size = 8,
    count = 3,
    speed = 0.7,
    className,
    style,
    "aria-label": ariaLabel = "Loading",
}) => {
    const uid = React.useMemo(() => Math.random().toString(36).slice(2, 9), []);
    const dotSize = typeof size === "number" ? `${size}px` : size;
    const borderRadius =
        shape === "circle" ? "50%" : shape === "rounded" ? "6px" : "0";

    const dots = Array.from({ length: count }, (_, i) => {
        const delay = (i * (speed / count)).toFixed(3) + "s";
        return (
            <span
                key={i}
                className={`ld-dot ld-${uid}`}
                style={{
                    width: dotSize,
                    height: dotSize,
                    background: color,
                    borderRadius,
                    animationDelay: delay,
                    marginLeft: i === 0 ? 0 : `calc(${dotSize} / 2)`,
                }}
                aria-hidden
            />
        );
    });

    return (
        <span
            role="status"
            aria-label={ariaLabel}
            className={className}
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0,
                ...style,
            }}
        >
            <style>{`
                @keyframes ld-bounce-${uid} {
                    0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
                    40% { transform: translateY(-6px); opacity: 1; }
                }
                .ld-dot.ld-${uid} {
                    display: inline-block;
                    flex: none;
                    animation-name: ld-bounce-${uid};
                    animation-duration: ${speed}s;
                    animation-iteration-count: infinite;
                    animation-timing-function: ease-in-out;
                }
            `}</style>
            {dots}
        </span>
    );
};

export default LoadingDots;