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

  // Phase 4 Features
  const [tone, setTone] = useState("Professional");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = async () => {
    // Mock user ID from local storage or context (Simulated for MVP)
    // In a real app, this comes from Auth provider.
    // For MVP, we use the Stripe Customer ID if available, or we prompt login.
    // Here we assume we might have it stored or we skip if not.
    // For this demo, let's assume we proceed if we have generated something before (store ID in localstorage?)
    // Actually, for this MVP we don't have login. 
    // We will just show the modal and if 'pro', show data.
    // But we need a userId. 
    // Let's rely on the backend check. We'll pass a placeholder or stored ID.
    const storedUserId = localStorage.getItem('onesource_userid');
    if (!storedUserId) return;

    try {
      const res = await fetch(`/api/history?userId=${storedUserId}`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
        setShowHistory(true);
      } else if (data.upgradeRequired) {
        setShowUpgradeModal(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedContent(null);

    // Simulate getting/storing User ID
    let userId = localStorage.getItem('onesource_userid');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('onesource_userid', userId);
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, userId, tone }), // Pass tone
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
      {/* Header Utilities */}
      <div style={{ position: "absolute", top: "2rem", right: "2rem", display: "flex", gap: "1rem", zIndex: 50 }}>
        <button
          onClick={fetchHistory}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "0.5rem 1rem", color: "#d1d5db", fontSize: "0.9rem", cursor: "pointer", backdropFilter: "blur(10px)" }}>
          <span>🕒</span> History
        </button>
        <a
          href="mailto:support@onesource.app"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "0.5rem 1rem", color: "#d1d5db", fontSize: "0.9rem", textDecoration: "none", backdropFilter: "blur(10px)" }}>
          <span>💬</span> Support
        </a>
      </div>
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
            <div style={{ padding: "0 1rem", color: "#6b7280", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {/* Tone Selector */}
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "0.9rem",
                  padding: "0.25rem",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="Professional" style={{ background: "#18181b" }}>Professional</option>
                <option value="Casual" style={{ background: "#18181b" }}>Casual</option>
                <option value="Viral / Hype" style={{ background: "#18181b" }}>Viral</option>
                <option value="Funny" style={{ background: "#18181b" }}>Funny</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Paste URL..."
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

      {/* History Modal */}
      {showHistory && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100
        }} onClick={() => setShowHistory(false)}>
          <div style={{
            background: "#18181b", border: "1px solid #3f3f46", borderRadius: "24px",
            width: "90%", maxWidth: "600px", maxHeight: "80vh", padding: "2rem",
            display: "flex", flexDirection: "column", overflow: "hidden"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "white" }}>History</h3>
              <button onClick={() => setShowHistory(false)} style={{ background: "none", border: "none", color: "#a1a1aa", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {history.length === 0 ? (
                <p style={{ color: "#71717a", textAlign: "center" }}>No history found.</p>
              ) : (
                history.map((item: any) => (
                  <div key={item.id} style={{
                    background: "rgba(255,255,255,0.03)",
                    padding: "1rem",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.05)",
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                    onClick={() => {
                      try {
                        if (item.generatedContent) {
                          setGeneratedContent(JSON.parse(item.generatedContent));
                          setShowHistory(false);
                        }
                      } catch (e) { console.error("Failed to parse history content", e); }
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "#a1a1aa" }}>{new Date(item.createdAt).toLocaleDateString()}</span>
                      {item.tone && <span style={{ fontSize: "0.7rem", background: "#3f3f46", padding: "2px 6px", borderRadius: "4px", color: "#d1d5db" }}>{item.tone}</span>}
                    </div>
                    <p style={{ color: "white", fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.contentUrl}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
