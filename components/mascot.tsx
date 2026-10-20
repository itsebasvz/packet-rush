import type { Avatar } from "@/lib/types";
export const avatarNames: Record<Avatar, string> = {
  packet: "Paquetito",
  robot: "Router bot",
  rocket: "Cohete",
  computer: "Compu",
};
export function Mascot({
  avatar = "packet",
  size = 96,
  celebrate = false,
}: {
  avatar?: Avatar;
  size?: number;
  celebrate?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={avatarNames[avatar]}
      className={celebrate ? "mascot celebrate" : "mascot"}
    >
      {avatar === "packet" && (
        <>
          <path d="M18 38 60 15l42 23v48L60 108 18 86Z" fill="#7dcdf4" />
          <path
            d="m18 38 42 23 42-23M60 61v47"
            fill="none"
            stroke="#4fb3e8"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="m43 25 42 23v17l-15 8V56L29 33Z" fill="#4F3DD9" />
          <path
            d="m27 75 15 8m35-1 15-8"
            stroke="#4F3DD9"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}
      {avatar === "robot" && (
        <>
          <path d="M60 15v12" stroke="#4F3DD9" strokeWidth="5" />
          <circle cx="60" cy="12" r="6" fill="#ff83ae" />
          <rect x="19" y="29" width="82" height="69" rx="23" fill="#7dcdf4" />
          <rect x="10" y="52" width="14" height="25" rx="6" fill="#4F3DD9" />
          <rect x="96" y="52" width="14" height="25" rx="6" fill="#4F3DD9" />
        </>
      )}
      {avatar === "rocket" && (
        <>
          <path d="m41 79 19 30 19-30" fill="#FFB200" />
          <path d="m40 52-22 36 27-3m35-33 22 36-27-3" fill="#4F3DD9" />
          <path
            d="M60 9c-25 17-32 43-24 74h48c8-31 1-57-24-74"
            fill="#7dcdf4"
          />
          <circle cx="60" cy="41" r="12" fill="#e4f5fd" />
        </>
      )}
      {avatar === "computer" && (
        <>
          <rect x="12" y="21" width="96" height="70" rx="12" fill="#4F3DD9" />
          <rect x="20" y="29" width="80" height="54" rx="7" fill="#7dcdf4" />
          <path
            d="M51 91v9H35m34-9v9h16"
            fill="none"
            stroke="#4F3DD9"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </>
      )}
      <circle cx="45" cy={avatar === "packet" ? 71 : 58} r="4" fill="#1F1F1F" />
      <circle cx="75" cy={avatar === "packet" ? 71 : 58} r="4" fill="#1F1F1F" />
      <path
        d={avatar === "packet" ? "M53 82q7 8 14 0" : "M51 70q9 10 18 0"}
        stroke="#1F1F1F"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
