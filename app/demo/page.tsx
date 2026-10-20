import { notFound } from "next/navigation";
import { DemoRace } from "@/components/demo-race";

export default function Demo() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <DemoRace />;
}
