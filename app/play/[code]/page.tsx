import { notFound } from "next/navigation";
import { PlayerGame } from "@/components/player-game";
export default async function Play({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!/^[A-Z0-9]{6}$/.test(code)) notFound();
  return <PlayerGame code={code} />;
}
