import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export const alt = "DNI GYM — App de gimnasio y fitness gratis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(80% 80% at 80% 0%, #2a1206 0%, #070708 60%)",
          color: "#f3f5f7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="76" height="76" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="15" fill="#ff6b1a" />
            <path fill="#160700" fillRule="evenodd" d="M20 13h15.5C47 13 54 21 51.6 32.4 49.3 43.6 40.6 51 28.6 51H10.4L20 13Zm8.3 9.2-5.3 20.6h5.6c7 0 12-4.4 13.4-11 1.3-6-2.2-9.6-8.2-9.6h-5.5Z" />
            <path fill="#ff6b1a" d="M4 40.5 60 26v5.2L4 45.7z" />
          </svg>
          <div style={{ fontSize: 40, fontWeight: 800, display: "flex" }}>
            DNI<span style={{ color: "#ff6b1a", marginLeft: 12 }}>GYM</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>Tu entrenador personal.</div>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2, color: "#ff6b1a" }}>Gratis. Gym y casa.</div>
          <div style={{ marginTop: 28, fontSize: 32, color: "#b4bac3" }}>Plan de entreno y de comidas · Entreno guiado · Progreso</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {["100% gratis", "Acceso con Google", "Móvil y ordenador"].map((t) => (
            <div key={t} style={{ display: "flex", padding: "12px 24px", borderRadius: 999, border: "2px solid rgba(198,255,61,0.4)", color: "#ff6b1a", fontSize: 26, fontWeight: 600 }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
