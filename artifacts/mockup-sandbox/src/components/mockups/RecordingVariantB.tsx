export default function RecordingVariantB() {
  return (
    <div
      dir="rtl"
      style={{
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        backgroundColor: "#1a1a2e",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "0",
        color: "#e2e8f0",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <span
          style={{
            fontSize: "22px",
            fontWeight: "700",
            background: "linear-gradient(135deg, #22d3ee, #06b6d4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          صوتي
        </span>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "14px",
            color: "#64748b",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          خروج ↩
        </button>
      </div>

      {/* Progress */}
      <div style={{ padding: "16px 24px 0" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "#64748b",
            marginBottom: "8px",
          }}
        >
          <span>التقدم</span>
          <span>(4/7) 57%</span>
        </div>
        <div
          style={{
            height: "6px",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "9999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "57%",
              height: "100%",
              background: "linear-gradient(90deg, #06b6d4, #22d3ee)",
              borderRadius: "9999px",
            }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0",
          padding: "24px 24px 16px",
        }}
      >
        {[
          { label: "استمع", num: "1", active: true },
          { label: "سجل", num: "2", active: false },
          { label: "راجع", num: "3", active: false },
        ].map((step, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: "0" }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: step.active
                    ? "linear-gradient(135deg, #06b6d4, #22d3ee)"
                    : "transparent",
                  border: step.active ? "none" : "2px solid rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: step.active ? "#0f172a" : "#475569",
                  boxShadow: step.active ? "0 0 16px rgba(6,182,212,0.4)" : "none",
                }}
              >
                {step.num}
              </div>
              <span
                style={{
                  fontSize: "12px",
                  color: step.active ? "#22d3ee" : "#475569",
                  fontWeight: step.active ? "600" : "400",
                }}
              >
                {step.label}
              </span>
            </div>
            {i < 2 && (
              <div
                style={{
                  width: "48px",
                  height: "1px",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  margin: "0 4px",
                  marginBottom: "20px",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Sentence Counter */}
      <div style={{ textAlign: "center", color: "#475569", fontSize: "13px", marginBottom: "12px" }}>
        الجملة 5 من 7
      </div>

      {/* Sentence Card */}
      <div style={{ padding: "0 24px", flex: "1", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div
          style={{
            border: "1px solid rgba(6,182,212,0.3)",
            borderRadius: "16px",
            padding: "48px 32px",
            textAlign: "center",
            backgroundColor: "rgba(255,255,255,0.04)",
            boxShadow: "0 0 30px rgba(6,182,212,0.08), inset 0 0 30px rgba(6,182,212,0.03)",
          }}
        >
          <p
            style={{
              fontSize: "34px",
              fontWeight: "700",
              lineHeight: "1.6",
              color: "#f1f5f9",
              margin: "0",
            }}
          >
            عاملين ايه
          </p>
        </div>

        {/* Speed Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginTop: "24px",
          }}
        >
          <span style={{ fontSize: "13px", color: "#475569" }}>سرعة النطق:</span>
          {["0.75x", "1x", "1.25x"].map((speed) => (
            <button
              key={speed}
              style={{
                padding: "6px 16px",
                borderRadius: "9999px",
                border: speed === "1x" ? "none" : "1px solid rgba(255,255,255,0.1)",
                background: speed === "1x"
                  ? "linear-gradient(135deg, #06b6d4, #22d3ee)"
                  : "rgba(255,255,255,0.04)",
                color: speed === "1x" ? "#0f172a" : "#475569",
                fontSize: "13px",
                fontWeight: speed === "1x" ? "600" : "400",
                cursor: "pointer",
              }}
            >
              {speed}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ padding: "24px 24px 32px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <button
          style={{
            width: "100%",
            padding: "18px",
            background: "linear-gradient(135deg, #06b6d4, #22d3ee)",
            color: "#0f172a",
            border: "none",
            borderRadius: "14px",
            fontSize: "18px",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            boxShadow: "0 4px 20px rgba(6,182,212,0.3)",
          }}
        >
          <span>🔊</span> استمع للجملة
        </button>
        <button
          style={{
            width: "100%",
            padding: "18px",
            backgroundColor: "transparent",
            color: "#94a3b8",
            border: "1.5px solid rgba(255,255,255,0.12)",
            borderRadius: "14px",
            fontSize: "18px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <span>🎙</span> ابدأ التسجيل
        </button>
        <p style={{ textAlign: "center", fontSize: "13px", color: "#334155", margin: "4px 0 0" }}>
          💙 خذ وقتك واقرأ الجملة بوضوح.
        </p>
      </div>
    </div>
  );
}
