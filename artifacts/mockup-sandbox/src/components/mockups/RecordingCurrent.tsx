export default function RecordingCurrent() {
  return (
    <div
      dir="rtl"
      style={{
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        backgroundColor: "#f9fafb",
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
          alignItems: "flex-start",
          padding: "20px 24px",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #f3f4f6",
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#2563eb", margin: "0 0 2px" }}>
            تسجيل الجلسة
          </h1>
          <p style={{ fontSize: "12px", color: "#9ca3af", margin: "0" }}>جملة 5 من 7</p>
        </div>
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
            padding: "6px 12px",
          }}
        >
          العودة ←
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ padding: "0 0 0", backgroundColor: "#ffffff" }}>
        <div
          style={{
            height: "6px",
            backgroundColor: "#e5e7eb",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "57%",
              height: "100%",
              backgroundColor: "#2563eb",
            }}
          />
        </div>
      </div>

      {/* Sentence Card */}
      <div
        style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div style={{ textAlign: "center", padding: "48px 32px" }}>
          <h2
            style={{
              fontSize: "42px",
              fontWeight: "700",
              lineHeight: "1.6",
              color: "#111827",
              margin: "0",
            }}
          >
            عاملين ايه
          </h2>
        </div>
      </div>

      {/* Controls Panel */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "16px 16px 0 0",
          padding: "24px",
          margin: "0 16px",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.04)",
        }}
      >
        {/* Listen + Mic buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              height: "56px",
              backgroundColor: "transparent",
              border: "1.5px solid #e5e7eb",
              borderRadius: "9999px",
              fontSize: "15px",
              color: "#374151",
              cursor: "pointer",
            }}
          >
            🔊 استمع
          </button>
          <button
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "#ef4444",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              boxShadow: "0 4px 14px rgba(239,68,68,0.35)",
            }}
          >
            🎙
          </button>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            style={{
              padding: "10px 20px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              fontSize: "14px",
              color: "#374151",
              cursor: "pointer",
            }}
          >
            السابق
          </button>
          <button
            style={{
              padding: "10px 20px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              fontSize: "14px",
              color: "#374151",
              cursor: "pointer",
            }}
          >
            التالي
          </button>
        </div>
      </div>
    </div>
  );
}
