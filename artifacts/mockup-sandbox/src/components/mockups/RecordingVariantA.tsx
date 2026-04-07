export default function RecordingVariantA() {
  return (
    <div
      dir="rtl"
      style={{
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        backgroundColor: "#ffffff",
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
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <span style={{ fontSize: "22px", fontWeight: "700", color: "#2563eb" }}>
          صوتي
        </span>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "14px",
            color: "#6b7280",
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
            backgroundColor: "#e5e7eb",
            borderRadius: "9999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "57%",
              height: "100%",
              backgroundColor: "#2563eb",
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
                  backgroundColor: step.active ? "#2563eb" : "transparent",
                  border: step.active ? "none" : "2px solid #d1d5db",
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
                  color: step.active ? "#2563eb" : "#9ca3af",
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
                  backgroundColor: "#e5e7eb",
                  margin: "0 4px",
                  marginBottom: "20px",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Sentence Counter */}
      <div style={{ textAlign: "center", color: "#6b7280", fontSize: "13px", marginBottom: "12px" }}>
        الجملة 5 من 7
      </div>

      {/* Sentence Card */}
      <div style={{ padding: "0 24px", flex: "1", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
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
          <span style={{ fontSize: "13px", color: "#6b7280" }}>سرعة النطق:</span>
          {["0.75x", "1x", "1.25x"].map((speed) => (
            <button
              key={speed}
              style={{
                padding: "6px 16px",
                borderRadius: "9999px",
                border: speed === "1x" ? "none" : "1px solid #e5e7eb",
                backgroundColor: speed === "1x" ? "#2563eb" : "#f9fafb",
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
      </div>

      {/* Action Buttons */}
      <div style={{ padding: "24px 24px 32px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <button
          style={{
            width: "100%",
            padding: "18px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
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
          <span>🔊</span> استمع للجملة
        </button>
        <button
          style={{
            width: "100%",
            padding: "18px",
            backgroundColor: "#ffffff",
            color: "#374151",
            border: "1.5px solid #d1d5db",
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
        <p style={{ textAlign: "center", fontSize: "13px", color: "#9ca3af", margin: "4px 0 0" }}>
          💙 خذ وقتك واقرأ الجملة بوضوح.
        </p>
      </div>
    </div>
  );
}
