import { ImageResponse } from "next/og";
import { API_BASE } from "@/lib/api";

export const alt = "CareerOS AI Portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface ImageProps {
  params: Promise<{ username: string }>;
}

export default async function Image({ params }: ImageProps) {
  const { username } = await params;

  let name = "CareerOS AI";
  let careerGoal = "Professional Portfolio";
  // Skills, not the private readiness score: the preview is what a recruiter sees first.
  let skills: string[] = [];

  try {
    const res = await fetch(`${API_BASE}/profile/public/${encodeURIComponent(username)}`);
    if (res.ok) {
      const data = await res.json();
      name = data.user.name;
      careerGoal = data.profile.careerGoal?.trim() || careerGoal;
      skills = (data.profile.skills || []).slice(0, 5);
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
          background: "linear-gradient(135deg, #0a0c10 0%, #13161c 100%)",
          color: "#e6e9ef",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#3ec6b5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "#04211e",
            }}
          >
            C
          </div>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 700, letterSpacing: 2, color: "#98a1b1" }}>
            CAREEROS AI
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 64, fontWeight: 800, marginBottom: 20 }}>{name}</div>
        <div style={{ display: "flex", fontSize: 28, color: "#98a1b1", maxWidth: 920 }}>{careerGoal}</div>

        {skills.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 48 }}>
            {skills.map((skill) => (
              <div
                key={skill}
                style={{
                  display: "flex",
                  padding: "10px 20px",
                  borderRadius: 12,
                  border: "2px solid #3ec6b5",
                  color: "#3ec6b5",
                  fontSize: 24,
                  fontWeight: 600,
                }}
              >
                {skill}
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
