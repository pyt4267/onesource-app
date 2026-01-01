"use client";

import { useState } from "react";
import BentoGrid from "@/components/BentoGrid";
import PricingTable from "@/components/PricingTable";

interface GeneratedContent {
  summary: string;
  tiktok: { hook: string; body: string; cta: string };
  xThread: string[];
  linkedin: string;
  note: string;
  watermark: boolean;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleGenerate = async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedContent(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.upgradeRequired) {
          setShowUpgradeModal(true);
        }
        setError(data.error || "Failed to generate");
        return;
      }

      setGeneratedContent(data.content);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  return (
    <main style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minHeight: "100vh",
      padding: "6rem 2rem",
      textAlign: "center",
      position: "relative",
      zIndex: 1
    }}>
      <div style={{ marginBottom: "4rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h1 style={{
          fontSize: "5rem",
          fontWeight: "800",
          marginBottom: "1rem",
          background: "var(--primary-gradient)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-0.05em",
          lineHeight: 1.1
        }}>
          OneSource
        </h1>
        <p style={{
          fontSize: "1.5rem",
          color: "#a1a1aa",
          maxWidth: "600px",
          marginBottom: "3rem",
          lineHeight: "1.6"
        }}>
          Turn one URL into a week's worth of content.
        </p>

        {/* Input Component */}
        <div style={{
          width: "100%",
          maxWidth: "600px",
          padding: "2px",
          background: "var(--glass-border)",
          borderRadius: "20px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
        }}>
          <div style={{
            background: "rgba(0,0,0,0.4)",
            borderRadius: "18px",
            padding: "0.75rem",
            display: "flex",
            alignItems: "center"
          }}>
            <div style={{ padding: "0 1rem", color: "#6b7280" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </div>
            <input
              type="text"
              placeholder="Paste your YouTube or Blog URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "1.1rem",
                outline: "none",
                fontFamily: "var(--font-sans)"
              }}
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                background: loading ? "#52525b" : "var(--primary-gradient)",
                border: "none",
                borderRadius: "12px",
                color: "white",
                padding: "0.75rem 2rem",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                marginLeft: "0.5rem",
                transition: "opacity 0.2s",
                minWidth: "120px"
              }}
            >
              {loading ? "..." : "Generate"}
            </button>
          </div>
        </div>

        {error && (
          <p style={{ color: "#f87171", marginTop: "1rem", fontSize: "0.9rem" }}>
            {error}
          </p>
        )}
      </div>

      {/* Results Section */}
      {generatedContent ? (
        <BentoGrid content={generatedContent} />
      ) : (
        <BentoGrid />
      )}

      <PricingTable onCheckout={handleCheckout} />

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#18181b",
            border: "1px solid #a855f7",
            borderRadius: "24px",
            padding: "3rem",
            maxWidth: "400px",
            textAlign: "center",
            boxShadow: "0 0 60px rgba(168, 85, 247, 0.3)"
          }}>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "white" }}>
              🔒 Free Limit Reached
            </h3>
            <p style={{ color: "#a1a1aa", marginBottom: "2rem" }}>
              You've used your 1 free generation this month. Upgrade to Pro for unlimited access.
            </p>
            <button
              onClick={() => {
                setShowUpgradeModal(false);
                handleCheckout();
              }}
              style={{
                background: "var(--primary-gradient)",
                border: "none",
                borderRadius: "12px",
                color: "white",
                padding: "1rem 2rem",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                marginRight: "1rem"
              }}
            >
              Upgrade to Pro - $29/mo
            </button>
            <button
              onClick={() => setShowUpgradeModal(false)}
              style={{
                background: "transparent",
                border: "1px solid #52525b",
                borderRadius: "12px",
                color: "#a1a1aa",
                padding: "1rem 2rem",
                fontSize: "1rem",
                cursor: "pointer"
              }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
