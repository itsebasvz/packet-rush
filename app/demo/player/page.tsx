import { notFound } from "next/navigation";
import { DemoPlayer } from "@/components/demo-player";

export default function DemoPlayerPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <DemoPlayer />;
}
