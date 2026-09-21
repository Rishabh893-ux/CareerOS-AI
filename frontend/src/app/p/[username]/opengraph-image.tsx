import { ImageResponse } from "next/og";

export const alt = "CareerOS AI Portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface ImageProps {
  params: Promise<{ username: string }>;
}

export default async function Image({ params }: ImageProps) {
  const { username } = await params;

  let name = "CareerOS AI";
  let careerGoal = "AI-Powered Career Intelligence Suite";
  let score: number | null = null;

  try {
    const res = await fetch(`${API_BASE}/profile/public/${username}`);
    if (res.ok) {
      const data = await res.json();
      name = data.user.name;
      careerGoal = data.profile.careerGoal || careerGoal;
      score = data.profile.careerScore?.score ?? null;
    }
  } catch {
    // fall through to defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0b1120 0%, #0e1526 100%)",
          color: "#eaf0fa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#2dd4bf",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "#0b1120",
            }}
          >
            C
          </div>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 700, letterSpacing: 2, color: "#8b95a8" }}>
            CAREEROS AI
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 64, fontWeight: 800, marginBottom: 20 }}>{name}</div>
        <div style={{ display: "flex", fontSize: 28, color: "#8b95a8", maxWidth: 920 }}>{careerGoal}</div>

        {score !== null && (
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 48 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 88,
                height: 88,
                borderRadius: 999,
                border: "6px solid #2dd4bf",
                fontSize: 32,
                fontWeight: 800,
              }}
            >
              {score}
            </div>
            <div style={{ display: "flex", fontSize: 20, color: "#8b95a8" }}>Career Readiness Score</div>
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
