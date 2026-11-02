import { ImageResponse } from "next/og";

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
          background: "radial-gradient(80% 80% at 80% 0%, #1d2a05 0%, #07080a 60%)",
          color: "#f3f5f7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: "#c6ff3d", display: "flex", alignItems: "center", justifyContent: "center", color: "#0b1000", fontSize: 40, fontWeight: 800 }}>
            D
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, display: "flex" }}>
            DNI<span style={{ color: "#c6ff3d", marginLeft: 12 }}>GYM</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>Entrena con método.</div>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2, color: "#c6ff3d" }}>Mide cada progreso.</div>
          <div style={{ marginTop: 28, fontSize: 32, color: "#b4bac3" }}>Rutinas · 84 ejercicios con técnica · Progreso · Nutrición y macros</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {["100% gratis", "Acceso con Google", "Móvil y ordenador"].map((t) => (
            <div key={t} style={{ display: "flex", padding: "12px 24px", borderRadius: 999, border: "2px solid rgba(198,255,61,0.4)", color: "#c6ff3d", fontSize: 26, fontWeight: 600 }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
