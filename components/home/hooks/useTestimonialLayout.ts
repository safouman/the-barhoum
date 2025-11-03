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

const DEFAULT_SCREEN_WIDTH = 1024;

interface UseTestimonialLayoutOptions {
    isRTL?: boolean;
}

export function useTestimonialLayout({ isRTL = false }: UseTestimonialLayoutOptions = {}) {
    const [screenWidth, setScreenWidth] =
        useState<number>(DEFAULT_SCREEN_WIDTH);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const handleResize = () => setScreenWidth(window.innerWidth);
        handleResize();
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

            if (width >= 1400) {
                cardWidth = 600;
            } else if (width >= 1200) {
                cardWidth = 540;
            } else if (width >= 992) {
                cardWidth = 500;
            } else if (width >= 768) {
                cardWidth = 460;
            } else {
                const horizontalPadding = width < 360 ? 16 : 20;
                const availableWidth = width - horizontalPadding * 2;
                cardWidth = Math.min(Math.max(availableWidth, 260), 400);
            }

            const baseClass =
                "absolute top-0 transition-all duration-500 ease-out will-change-transform will-change-opacity";
            let className = baseClass;
            const style: CSSProperties = {
                width: `${cardWidth}px`,
                opacity: 0,
                transform: "translate3d(0, 12px, 0)",
            };

            if (width >= 768) {
                const centerOffset = cardWidth / 2;
                const sideOffset = cardWidth * 0.7;

                if (isActive) {
                    className += " z-30 scale-100";
                    style.left = `calc(50% - ${centerOffset}px)`;
                    style.opacity = 1;
                    style.transform = "translate3d(0, 0, 0)";
                } else if (isPrev) {
                    className += " z-10 scale-[0.97]";
                    style.left = `calc(50% - ${centerOffset + sideOffset}px)`;
                    style.opacity = 0.55;
                    style.transform = `translate3d(${
                        isRTL ? 18 : -18
                    }px, 18px, 0)`;
                } else if (isNext) {
                    className += " z-10 scale-[0.97]";
                    style.left = `calc(50% - ${centerOffset - sideOffset}px)`;
                    style.opacity = 0.55;
                    style.transform = `translate3d(${
                        isRTL ? -18 : 18
                    }px, 18px, 0)`;
                }
            } else {
                style.left = `calc(50% - ${cardWidth / 2}px)`;
                if (isActive) {
                    className += " z-30 scale-100";
                    style.opacity = 1;
                    style.transform = "translate3d(0, 0, 0)";
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
        [screenWidth, isRTL]
    );

    return {
        screenWidth,
        isMobile: screenWidth < 768,
        getLayout,
    };
}
