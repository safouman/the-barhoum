import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";

interface LayoutInput {
    index: number;
    currentIndex: number;
    count: number;
}

interface LayoutResult {
    visible: boolean;
    className: string;
    style: CSSProperties;
}

export function useTestimonialLayout() {
    const [screenWidth, setScreenWidth] = useState<number>(() => {
        if (typeof window === "undefined") {
            return 1024;
        }
        return window.innerWidth;
    });

    useEffect(() => {
        if (typeof window === "undefined") return;
        const handleResize = () => setScreenWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const getLayout = useCallback(
        ({ index, currentIndex, count }: LayoutInput): LayoutResult => {
            const isActive = index === currentIndex;
            const isPrev =
                index === (currentIndex - 1 + count) % count;
            const isNext = index === (currentIndex + 1) % count;

            if (!isActive && !isPrev && !isNext) {
                return {
                    visible: false,
                    className: "",
                    style: {},
                };
            }

            const width = screenWidth;
            let cardWidth: number;
            let cardHeight: number;

            if (width >= 1200) {
                cardWidth = 400;
                cardHeight = 560;
            } else if (width >= 768) {
                cardWidth = 350;
                cardHeight = 520;
            } else {
                cardWidth = Math.min(320, width - 32);
                cardHeight = 480;
            }

            const baseClass =
                "absolute top-0 transition-all duration-500 ease-out";
            let className = baseClass;
            const style: CSSProperties = {
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
            };

            if (width >= 768) {
                const centerOffset = cardWidth / 2;
                const sideOffset = cardWidth * 0.7;

                if (isActive) {
                    className += " z-30 scale-100 opacity-100";
                    style.left = `calc(50% - ${centerOffset}px)`;
                } else if (isPrev) {
                    className += " z-10 scale-95 opacity-60";
                    style.left = `calc(50% - ${centerOffset + sideOffset}px)`;
                } else if (isNext) {
                    className += " z-10 scale-95 opacity-60";
                    style.left = `calc(50% - ${centerOffset - sideOffset}px)`;
                }
            } else {
                style.left = `calc(50% - ${cardWidth / 2}px)`;
                if (isActive) {
                    className += " z-30 scale-100 opacity-100";
                } else {
                    return {
                        visible: false,
                        className: "",
                        style: {},
                    };
                }
            }

            return {
                visible: true,
                className,
                style,
            };
        },
        [screenWidth]
    );

    return {
        screenWidth,
        isMobile: screenWidth < 768,
        getLayout,
    };
}
