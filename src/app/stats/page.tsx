import type { Metadata } from "next";
import { StatsView } from "@/components/StatsView";

export const metadata: Metadata = {
  title: "Stats",
  description:
    "World Cup 2026 tournament leaders — top scorers, assisters, team goals, best defense, passing and discipline.",
};

export default function StatsPage() {
  return <StatsView />;
}
