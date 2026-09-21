import type { Metadata } from "next";
import PortfolioView from "@/components/portfolio/PortfolioView";
import { PortfolioData } from "@/types/portfolio";

interface PageProps {
  params: Promise<{ username: string }>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

async function fetchPortfolio(username: string): Promise<PortfolioData | null> {
  try {
    const res = await fetch(`${API_BASE}/profile/public/${username}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const data = await fetchPortfolio(username);

  if (!data) {
    return {
      title: "Portfolio Not Found — CareerOS AI",
      description: "This CareerOS AI portfolio could not be found.",
    };
  }

  const title = `${data.user.name} — CareerOS AI Portfolio`;
  const description =
    data.profile.careerGoal ||
    `View ${data.user.name}'s skills, projects, and GitHub activity on CareerOS AI.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { username } = await params;
  return <PortfolioView username={username} />;
}
