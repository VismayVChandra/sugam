import './SugamWordmark.css'

// Sugam's mark: an open lotus/radiating glyph in a rounded square, paired
// with the wordmark. Used across login, home, and the widget header.

export default function SugamWordmark({ size = 32, showWord = true }: { size?: number; showWord?: boolean }) {
  return (
    <span className="sugam-wordmark">
      <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
        <rect width="40" height="40" rx="11" fill="var(--sugam-primary)" />
        <path
          d="M20 10c1.5 3 1.5 6-.5 9m.5-9c-1.5 3-1.5 6 .5 9m-6.2-6.4c2.6 1.8 4.2 4 5.7 6.4m-5.7-6.4c1 3 3 5.2 5.7 6.4M27.2 12.6c-2.6 1.8-4.2 4-5.7 6.4m5.7-6.4c-1 3-3 5.2-5.7 6.4M12 20c3-1.5 6-1.5 9 .5m-9-.5c3 1.5 6 1.5 9-.5m6.4 6.2c-1.8-2.6-4-4.2-6.4-5.7m6.4 5.7c-3-1-5.2-3-6.4-5.7"
          stroke="var(--sugam-primary-fg)"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="20" cy="20" r="3.4" fill="var(--sugam-primary-fg)" />
      </svg>
      {showWord && <span className="sugam-wordmark-text">Sugam</span>}
    </span>
  )
}
