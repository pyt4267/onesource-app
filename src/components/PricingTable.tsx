"use client";

import React, { useState } from 'react';

const CheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "0.75rem", minWidth: "20px" }}>
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const CrossIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "0.75rem", minWidth: "20px" }}>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const PricingCard = ({
    title,
    price,
    features,
    isPopular = false,
    onButtonClick
}: {
    title: string,
    price: string,
    features: { dp: string, included: boolean }[],
    isPopular?: boolean,
    onButtonClick?: () => void
}) => {
    return (
        <div style={{
            background: isPopular
                ? "linear-gradient(145deg, rgba(168, 85, 247, 0.1), rgba(0, 0, 0, 0.4))"
                : "rgba(255, 255, 255, 0.03)",
            border: isPopular ? "1px solid #a855f7" : "1px solid var(--glass-border)",
            borderRadius: "24px",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            boxShadow: isPopular ? "0 0 40px rgba(168, 85, 247, 0.2)" : "none",
            transform: isPopular ? "scale(1.05)" : "scale(1)",
            zIndex: isPopular ? 10 : 1,
            transition: "transform 0.3s ease",
            minHeight: "500px"
        }}>
            {isPopular && (
                <span style={{
                    position: "absolute",
                    top: "-12px",
                    background: "#a855f7",
                    color: "white",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 10px rgba(168, 85, 247, 0.4)"
                }}>
                    MOST POPULAR
                </span>
            )}

            <h3 style={{ fontSize: "1.2rem", fontWeight: "600", color: isPopular ? "white" : "#a1a1aa", marginBottom: "1rem" }}>
                {title}
            </h3>

            <div style={{ display: "flex", alignItems: "baseline", marginBottom: "2rem" }}>
                <span style={{ fontSize: "3rem", fontWeight: "800", color: "white" }}>{price}</span>
                <span style={{ color: "#71717a", marginLeft: "4px" }}>/mo</span>
            </div>

            <div style={{ width: "100%", flex: 1 }}>
                {features.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: "1rem", color: f.included ? "#e4e4e7" : "#52525b" }}>
                        {f.included ? <CheckIcon /> : <CrossIcon />}
                        <span style={{ textAlign: "left", fontSize: "0.95rem" }}>{f.dp}</span>
                    </div>
                ))}
            </div>

            <button
                onClick={onButtonClick}
                style={{
                    width: "100%",
                    padding: "1rem",
                    borderRadius: "14px",
                    border: "none",
                    background: isPopular ? "white" : "rgba(255,255,255,0.05)",
                    color: isPopular ? "black" : "white",
                    fontWeight: "700",
                    fontSize: "1rem",
                    cursor: "pointer",
                    marginTop: "auto",
                    transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                    if (!isPopular) e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                }}
                onMouseLeave={(e) => {
                    if (!isPopular) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
            >
                {isPopular ? "Get Started" : "Start Free"}
            </button>
            {isPopular && <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#a1a1aa" }}>7-day money-back guarantee</p>}
        </div>
    );
}

interface PricingTableProps {
    onCheckout?: () => void;
}

export default function PricingTable({ onCheckout }: PricingTableProps) {
    return (
        <div style={{ width: "100%", maxWidth: "1000px", margin: "6rem auto 4rem" }}>
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                <h2 style={{ fontSize: "3rem", fontWeight: "800", marginBottom: "1rem", color: "white" }}>
                    Simple Pricing
                </h2>
                <p style={{ color: "#a1a1aa", fontSize: "1.2rem" }}>
                    Stop wasting hours. Start saving days.
                </p>
            </div>

            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "2rem",
                alignItems: "center"
            }}>
                <PricingCard
                    title="Starter"
                    price="$0"
                    features={[
                        { dp: "1 Content Generation / month", included: true },
                        { dp: "Basic Bento Grid Access", included: true },
                        { dp: "Watermarked Results", included: true },
                        { dp: "LinkedIn & X Formats", included: true },
                        { dp: "TikTok Script", included: false },
                        { dp: "Tone Adjustment", included: false },
                    ]}
                />
                <PricingCard
                    title="Pro Creator"
                    price="$29"
                    isPopular={true}
                    onButtonClick={onCheckout}
                    features={[
                        { dp: "Unlimited Generations", included: true },
                        { dp: "All 5 Formats (TikTok, Blog, etc)", included: true },
                        { dp: "No Watermark", included: true },
                        { dp: "Tone & Voice Customization", included: true },
                        { dp: "Save & History", included: true },
                        { dp: "Priority Support", included: true },
                    ]}
                />
            </div>
        </div>
    );
}
