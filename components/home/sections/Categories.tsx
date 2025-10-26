"use client";
import { useState, useEffect } from "react";
import clsx from "classnames";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { PacksSection } from "./Packages";
import { HomeLeadForm } from "./LeadFormSection";
import type { HomeThemeDefinition } from "../types";
import styles from "./Categories.module.css";

export const HomeCategories: HomeThemeDefinition["Categories"] = ({
    categories,
    activeCategory,
    onSelect,
    expandedMobileCategory,
    onMobileToggle,
    packs,
    packsCopy,
    formCopy,
    selectedPack,
    leadFormVisible,
    selectedPackSummary,
    onPackSelect,
    onPackContinue,
    locale,
    ui,
    activeCategoryId,
    selectedPackageId,
}) => {
    const chooseAudienceCopy = ui.home.categories.eyebrow;
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handleCategoryClick = (
        id: "individuals" | "couples" | "organizations"
    ) => {
        if (isMobile) {
            onMobileToggle(id);
        } else {
            onSelect(id);
        }
    };

    return (
        <Section
            id="categories"
            title={ui.categories}
            className="bg-background"
            data-analytics-section="Categories"
            data-analytics-engage="true"
        >
            <Container>
                <p className="mb-10 text-center text-xs uppercase tracking-[0.4em] text-subtle">
                    {chooseAudienceCopy}
                </p>
                <div
                    className="grid gap-[clamp(2rem,3.5vw,3.5rem)] text-sm sm:grid-cols-1 lg:grid-cols-3
 xl:grid-cols-3"
                >
                    {categories.map((category) => {
                        const isExpandedOnMobile =
                            isMobile && expandedMobileCategory === category.id;
                        const isComingSoon = category.comingSoon ?? false;
                        return (
                            <div key={category.id} className="contents">
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleCategoryClick(category.id)
                                    }
                                    aria-pressed={
                                        isMobile
                                            ? isExpandedOnMobile
                                            : activeCategory === category.id
                                    }
                                    aria-expanded={
                                        isMobile
                                            ? isExpandedOnMobile
                                            : undefined
                                    }
                                    className={clsx(
                                        "group relative flex h-full flex-col gap-6 rounded-xl md:rounded-[24px] border border-white/80 bg-white px-6 py-12 md:px-12 md:py-14 text-start shadow-[0_16px_32px_-24px_rgba(15,35,42,0.4)] md:shadow-[0_24px_40px_-30px_rgba(15,35,42,0.45)] transition duration-200 ease-out",
                                        "hover:-translate-y-1.5 hover:border-primary/35 hover:shadow-[0_28px_55px_-26px_rgba(15,35,42,0.55)]",
                                        (isMobile
                                            ? isExpandedOnMobile
                                            : activeCategory === category.id) &&
                                            "border-primary shadow-[0_32px_60px_-26px_rgba(15,35,42,0.6)]",
                                        isMobile &&
                                            isExpandedOnMobile &&
                                            "md:border-white/80 md:shadow-[0_24px_40px_-30px_rgba(15,35,42,0.45)]",
                                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[6px] focus-visible:outline-primary/60"
                                    )}
                                    aria-label={category.label}
                                >
                                    <div className="space-y-4">
                                        <h3
                                            className={clsx(
                                                "heading-3 tracking-tight transition-colors",
                                                (
                                                    isMobile
                                                        ? isExpandedOnMobile
                                                        : activeCategory ===
                                                          category.id
                                                )
                                                    ? "text-primary"
                                                    : "text-text",
                                                "group-hover:text-primary"
                                            )}
                                        >
                                            {category.label}
                                        </h3>
                                        <span className="block h-px w-16 bg-primary/15 transition-all group-hover:bg-primary/35" />
                                    </div>
                                    <p className="text-subtle/80 group-hover:text-text/85 line-clamp-2">
                                        {category.description}
                                    </p>
                                    <span
                                        className={clsx(
                                            "pointer-events-none absolute inset-x-0 bottom-0 h-[2px] rounded-b-[24px] bg-primary/0 transition-opacity",
                                            (
                                                isMobile
                                                    ? isExpandedOnMobile
                                                    : activeCategory ===
                                                      category.id
                                            )
                                                ? "bg-primary/60"
                                                : "group-hover:bg-primary/20"
                                        )}
                                    />
                                </button>
                                {isMobile &&
                                    isExpandedOnMobile &&
                                    expandedMobileCategory && (
                                        <div
                                            className={clsx(
                                                "md:hidden col-span-1",
                                                styles.mobilePacksContainer
                                            )}
                                        >
                                            <PacksSection
                                                locale={locale}
                                                direction={
                                                    locale === "ar"
                                                        ? "rtl"
                                                        : "ltr"
                                                }
                                                category={
                                                    expandedMobileCategory
                                                }
                                                packs={packs}
                                                onSelect={onPackSelect}
                                                onContinue={onPackContinue}
                                                sectionId="mobile-packs"
                                                comingSoon={isComingSoon}
                                                copy={packsCopy}
                                            />
                                            {!isComingSoon &&
                                                leadFormVisible &&
                                                selectedPack &&
                                                selectedPack.category ===
                                                    expandedMobileCategory && (
                                                    <div
                                                        className={clsx(
                                                            "mt-8",
                                                            styles.mobilePacksContainer
                                                        )}
                                                    >
                                                        <HomeLeadForm
                                                            selectedCategory={
                                                                activeCategoryId
                                                            }
                                                            selectedPackage={
                                                                selectedPackageId
                                                            }
                                                            packSummary={
                                                                selectedPackSummary
                                                            }
                                                            ui={ui}
                                                            copy={formCopy}
                                                        />
                                                    </div>
                                                )}
                                        </div>
                                    )}
                            </div>
                        );
                    })}
                </div>
            </Container>
        </Section>
    );
};
