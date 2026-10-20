import { avatarColors, avatarNames } from "@/lib/appearance";
import type { Avatar, AvatarColor } from "@/lib/types";
export { avatarNames } from "@/lib/appearance";

export function Mascot({
  avatar = "packet",
  color = "blue",
  size = 96,
  celebrate = false,
}: {
  avatar?: Avatar;
  color?: AvatarColor;
  size?: number;
  celebrate?: boolean;
}) {
  const palette = avatarColors[color] ?? avatarColors.blue;
  const { body, detail, accent, eyes } = palette;
  const faceY = avatar === "packet" ? 71 : avatar === "cloud" ? 66 : 58;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`${avatarNames[avatar]}, ${palette.name}`}
      className={celebrate ? "mascot celebrate" : "mascot"}
    >
      {avatar === "packet" && (
        <>
          <path d="M18 38 60 15l42 23v48L60 108 18 86Z" fill={body} />
          <path
            d="m18 38 42 23 42-23M60 61v47"
            fill="none"
            stroke={detail}
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="m43 25 42 23v17l-15 8V56L29 33Z" fill={accent} />
          <path
            d="m27 75 15 8m35-1 15-8"
            stroke={accent}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}
      {avatar === "robot" && (
        <>
          <path d="M60 15v12" stroke={accent} strokeWidth="5" />
          <circle cx="60" cy="12" r="6" fill="#ff83ae" />
          <rect x="19" y="29" width="82" height="69" rx="23" fill={body} />
          <rect x="10" y="52" width="14" height="25" rx="6" fill={accent} />
          <rect x="96" y="52" width="14" height="25" rx="6" fill={accent} />
        </>
      )}
      {avatar === "rocket" && (
        <>
          <path d="m41 79 19 30 19-30" fill="#FFB200" />
          <path d="m40 52-22 36 27-3m35-33 22 36-27-3" fill={accent} />
          <path d="M60 9c-25 17-32 43-24 74h48c8-31 1-57-24-74" fill={body} />
          <circle cx="60" cy="38" r="12" fill={accent} />
          <circle cx="60" cy="38" r="8" fill="#e4f5fd" />
        </>
      )}
      {avatar === "computer" && (
        <>
          <rect x="12" y="21" width="96" height="70" rx="12" fill={accent} />
          <rect x="20" y="29" width="80" height="54" rx="7" fill={body} />
          <path
            d="M51 91v9H35m34-9v9h16"
            fill="none"
            stroke={accent}
            strokeWidth="7"
            strokeLinecap="round"
          />
        </>
      )}
      {avatar === "cloud" && (
        <>
          <path
            d="M29 93C3 93 1 57 23 51c-2-27 35-38 48-17 23-10 46 8 41 28 17 21 0 35-17 35H29Z"
            fill={body}
          />
          <path
            d="M29 93h63"
            stroke={detail}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="m28 24 5-8m53 6 6 6"
            stroke={accent}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}
      {avatar === "satellite" && (
        <>
          <path
            d="M29 63h62M60 34V18l15-8"
            stroke={detail}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="78" cy="9" r="5" fill="#ff83ae" />
          <rect x="3" y="41" width="24" height="47" rx="7" fill={accent} />
          <rect x="93" y="41" width="24" height="47" rx="7" fill={accent} />
          <path
            d="M15 47v34m-7-22h14M105 47v34m-7-22h14"
            stroke={body}
            strokeWidth="2"
          />
          <rect x="30" y="33" width="60" height="59" rx="20" fill={body} />
          <path
            d="M49 99h22"
            stroke={detail}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      )}
      {avatar === "octopus" && (
        <>
          <path
            d="M27 67c-5 10-11 14-15 20-7 13 9 18 18 5-1 20 19 19 20 3 2 17 19 17 21 0 1 16 21 17 20-3 9 13 25 8 18-5-5-7-12-13-16-20Z"
            fill={body}
          />
          <rect x="26" y="22" width="68" height="65" rx="33" fill={body} />
          <path
            d="m34 88-5 9m22-7v10m20-10v10m17-12 5 9"
            stroke={detail}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="36" cy="70" r="5" fill={accent} opacity=".35" />
          <circle cx="84" cy="70" r="5" fill={accent} opacity=".35" />
        </>
      )}
      {avatar === "alien" && (
        <>
          <path
            d="m40 28-9-13m49 13 9-13"
            stroke={detail}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="28" cy="11" r="7" fill={accent} />
          <circle cx="92" cy="11" r="7" fill={accent} />
          <path
            d="M19 52C15 9 105 9 101 52c-2 27-26 48-41 48S21 79 19 52Z"
            fill={body}
          />
          <path
            d="m30 84-8 14m68-14 8 14"
            stroke={accent}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M48 107h24"
            stroke={detail}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}
      <circle cx="45" cy={faceY} r="4" fill={eyes} />
      <circle cx="75" cy={faceY} r="4" fill={eyes} />
      <path
        d={`M51 ${faceY + 12}q9 10 18 0`}
        stroke={eyes}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
