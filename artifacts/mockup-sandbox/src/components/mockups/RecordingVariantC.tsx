export default function RecordingVariantC() {
  const waveformBars = [3, 6, 10, 8, 12, 7, 14, 9, 11, 6, 13, 8, 5, 10, 7, 12, 9, 6, 11, 8];

  return (
    <div
      dir="rtl"
      style={{
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        backgroundColor: "#faf7f2",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "0",
        color: "#1a1a1a",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 24px",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <span
          style={{
            fontSize: "22px",
            fontWeight: "700",
            background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
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
            color: "#9ca3af",
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
            color: "#9ca3af",
            marginBottom: "8px",
          }}
        >
          <span>التقدم</span>
          <span>(4/7) 57%</span>
        </div>
        <div
          style={{
            height: "6px",
            backgroundColor: "#e9e4da",
            borderRadius: "9999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "57%",
              height: "100%",
              background: "linear-gradient(90deg, #7c3aed, #3b82f6)",
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
                    ? "linear-gradient(135deg, #7c3aed, #3b82f6)"
                    : "transparent",
                  border: step.active ? "none" : "2px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: step.active ? "#ffffff" : "#9ca3af",
                }}
              >
                {step.num}
              </div>
              <span
                style={{
                  fontSize: "12px",
                  color: step.active ? "#7c3aed" : "#9ca3af",
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
                  backgroundColor: "#e9e4da",
                  margin: "0 4px",
                  marginBottom: "20px",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Sentence Counter */}
      <div style={{ textAlign: "center", color: "#9ca3af", fontSize: "13px", marginBottom: "12px" }}>
        الجملة 5 من 7
      </div>

      {/* Sentence Card with left accent stripe */}
      <div style={{ padding: "0 24px", flex: "1", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div
          style={{
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(124,58,237,0.12)",
            display: "flex",
          }}
        >
          {/* Accent stripe on the left (visually right in RTL) */}
          <div
            style={{
              width: "5px",
              background: "linear-gradient(180deg, #7c3aed, #3b82f6)",
              flexShrink: "0",
            }}
          />
          <div
            style={{
              flex: "1",
              padding: "48px 32px",
              textAlign: "center",
              backgroundColor: "#ffffff",
            }}
          >
            <p
              style={{
                fontSize: "34px",
                fontWeight: "700",
                lineHeight: "1.6",
                color: "#111827",
                margin: "0",
              }}
            >
              عاملين ايه
            </p>
          </div>
        </div>

        {/* Speed Controls — badge chips */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginTop: "24px",
          }}
        >
          <span style={{ fontSize: "13px", color: "#9ca3af" }}>سرعة النطق:</span>
          {["0.75x", "1x", "1.25x"].map((speed) => (
            <button
              key={speed}
              style={{
                padding: "6px 16px",
                borderRadius: "9999px",
                border: "none",
                background: speed === "1x"
                  ? "linear-gradient(135deg, #7c3aed, #3b82f6)"
                  : "#f3f0eb",
                color: speed === "1x" ? "#ffffff" : "#6b7280",
                fontSize: "13px",
                fontWeight: speed === "1x" ? "600" : "400",
                cursor: "pointer",
              }}
            >
              {speed}
            </button>
          ))}
        </div>

        {/* Waveform decoration */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "3px",
            marginTop: "20px",
            height: "32px",
          }}
        >
          {waveformBars.map((h, i) => (
            <div
              key={i}
              style={{
                width: "3px",
                height: `${h}px`,
                borderRadius: "2px",
                background: i % 3 === 0
                  ? "linear-gradient(180deg, #7c3aed, #3b82f6)"
                  : i % 3 === 1
                  ? "#c4b5fd"
                  : "#ddd6fe",
                opacity: 0.6 + (i % 4) * 0.1,
              }}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ padding: "24px 24px 32px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <button
          style={{
            width: "100%",
            padding: "18px",
            background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
            color: "#ffffff",
            border: "none",
            borderRadius: "14px",
            fontSize: "18px",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
          }}
        >
          <span>🔊</span> استمع للجملة
        </button>
        <button
          style={{
            width: "100%",
            padding: "18px",
            backgroundColor: "#ffffff",
            color: "#374151",
            border: "1.5px solid #e9e4da",
            borderRadius: "14px",
            fontSize: "18px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <span>🎙</span> ابدأ التسجيل
        </button>
        <p style={{ textAlign: "center", fontSize: "13px", color: "#9ca3af", margin: "4px 0 0" }}>
          💙 خذ وقتك واقرأ الجملة بوضوح.
        </p>
      </div>
    </div>
  );
}
