import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #92400e, #78350f)",
          borderRadius: "110px",
        }}
      >
        <div style={{ fontSize: 280, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))" }}>☕</div>
      </div>
    ),
    { ...size }
  );
}
