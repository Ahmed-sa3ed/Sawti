import RecordingVariantA from "./RecordingVariantA";
import RecordingVariantB from "./RecordingVariantB";
import RecordingVariantC from "./RecordingVariantC";

export default function RecordingAllVariants() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f4f5",
        padding: "40px 24px",
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Page Title */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#111827",
            margin: "0 0 8px",
          }}
        >
          شاشة التسجيل — ٣ تصاميم مقترحة
        </h1>
        <p style={{ fontSize: "14px", color: "#6b7280", margin: "0" }}>
          اختر التصميم الذي يناسب رؤيتك للتطبيق
        </p>
      </div>

      {/* Variants Grid */}
      <div
        style={{
          display: "flex",
          gap: "32px",
          justifyContent: "center",
          alignItems: "flex-start",
          flexWrap: "wrap",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Variant A */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
              borderRadius: "12px",
              padding: "8px 24px",
              border: "1px solid #bfdbfe",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#1d4ed8" }}>
              أ — نظيف (Classic)
            </span>
          </div>
          <div
            style={{
              width: "340px",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
              border: "1px solid rgba(0,0,0,0.06)",
              minHeight: "620px",
              backgroundColor: "#ffffff",
            }}
          >
            <RecordingVariantA />
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              textAlign: "center",
              maxWidth: "280px",
              margin: "0",
              lineHeight: "1.5",
            }}
          >
            خلفية بيضاء نقية، مؤشرات زرقاء واضحة، هادئ ومريح للعين
          </p>
        </div>

        {/* Variant B */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #0f172a, #1e293b)",
              borderRadius: "12px",
              padding: "8px 24px",
              border: "1px solid #334155",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#22d3ee" }}>
              ب — استوديو (Dark Studio)
            </span>
          </div>
          <div
            style={{
              width: "340px",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.08)",
              minHeight: "620px",
              backgroundColor: "#1a1a2e",
            }}
          >
            <RecordingVariantB />
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              textAlign: "center",
              maxWidth: "280px",
              margin: "0",
              lineHeight: "1.5",
            }}
          >
            خلفية داكنة احترافية، تمييز بالألوان الزرقاء الفاتحة، يشبه بيئة الاستوديو
          </p>
        </div>

        {/* Variant C */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
              borderRadius: "12px",
              padding: "8px 24px",
              border: "1px solid #c4b5fd",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#7c3aed" }}>
              ج — حيوي (Vibrant)
            </span>
          </div>
          <div
            style={{
              width: "340px",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 8px 40px rgba(124,58,237,0.15)",
              border: "1px solid rgba(124,58,237,0.12)",
              minHeight: "620px",
              backgroundColor: "#faf7f2",
            }}
          >
            <RecordingVariantC />
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              textAlign: "center",
              maxWidth: "280px",
              margin: "0",
              lineHeight: "1.5",
            }}
          >
            خلفية دافئة كريمية، تدرج بنفسجي-أزرق، تموجات صوتية زخرفية، مرح وحيوي
          </p>
        </div>
      </div>
    </div>
  );
}
