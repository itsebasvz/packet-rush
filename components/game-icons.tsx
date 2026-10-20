export function FlameIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M13 2c1 5-4 6-3 10 2-1 3-3 3-4 5 3 7 6 5 10-2 5-10 5-12 0-2-5 3-8 3-12 1 1 2 3 2 4 2-2 2-5 2-8Z"
        fill="currentColor"
      />
      <path d="M12 14c3 3 3 6 0 7-3-1-3-4 0-7Z" fill="white" />
    </svg>
  );
}
export function BoltIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="m14 2-10 12h7l-1 8L21 9h-8l1-7Z" fill="currentColor" />
    </svg>
  );
}
export function ClockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v5l3 2M9 2h6m-3 0v3" />
    </svg>
  );
}
