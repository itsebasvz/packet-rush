import type { Avatar, AvatarColor } from "./appearance";
export type { Avatar, AvatarColor } from "./appearance";
export type Question = {
  id: string;
  topic: string;
  prompt: string;
  options: { id: string; text: string }[];
};
export type Answer = {
  correct: boolean;
  correctOption: string;
  explanation: string;
  selected: string | null;
  elapsedMs: number;
  basePoints: number;
  speedBonus: number;
  streakBonus: number;
  streak: number;
  points: number;
};
export type Racer = {
  id: string;
  name: string;
  avatar: Avatar;
  avatarColor: AvatarColor;
  correct: number;
  answered: number;
  points: number;
  timeMs: number;
  rank: number;
  complete: boolean;
  streak: number;
  bestStreak: number;
  bonusPoints: number;
  finishTimeMs: number | null;
};
export type GameState = {
  serverNow: string;
  room: {
    code: string;
    status: "waiting" | "running" | "finished";
    questionCount: number;
    capacity: number;
    scoringVersion: number;
  };
  players: Racer[];
  me: {
    id: string;
    index: number;
    deadlineAt: string | null;
    question: Question | null;
    answer: Answer | null;
    complete: boolean;
  } | null;
};
