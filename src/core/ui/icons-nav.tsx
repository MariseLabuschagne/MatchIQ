/** Line icons for navigation and page actions (24px grid, 2px strokes, currentColor). */
const Svg = ({ children, size = 20 }: { children: React.ReactNode; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const DashboardIcon = () => <Svg><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></Svg>;
export const CaptureIcon = () => <Svg><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></Svg>;
export const MatchesIcon = () => <Svg><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></Svg>;
export const TeamsIcon = () => <Svg><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.2 2.4 3.5 5.2" /></Svg>;
export const ArrowRightIcon = ({ size = 16 }: { size?: number }) => <Svg size={size}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
export const ChevronRightIcon = ({ size = 18 }: { size?: number }) => <Svg size={size}><path d="m9 6 6 6-6 6" /></Svg>;
export const BackIcon = ({ size = 18 }: { size?: number }) => <Svg size={size}><path d="m15 6-6 6 6 6" /></Svg>;
export const PlayIcon = ({ size = 16 }: { size?: number }) => <Svg size={size}><path d="M7 5v14l11-7z" fill="currentColor" /></Svg>;

/** MatchIQ mark: rising bars with the logo's green tick, on a gold tile. */
export const MatchIQMark = ({ size = 36 }: { size?: number }) => (
  <svg viewBox="0 0 36 36" width={size} height={size} aria-hidden="true" style={{ flex: "none" }}>
    <rect width="36" height="36" rx="10" fill="#f5c518" />
    <rect x="8" y="18" width="4.5" height="10" rx="1.5" fill="#0f2747" />
    <rect x="15.75" y="13" width="4.5" height="15" rx="1.5" fill="#0f2747" />
    <rect x="23.5" y="8" width="4.5" height="20" rx="1.5" fill="#0f2747" />
    <path d="M7 14.5 13 9l4 3.5 8-7" fill="none" stroke="#3d7a1a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChevronDownIcon = ({ size = 14 }: { size?: number }) => <Svg size={size}><path d="m6 9 6 6 6-6" /></Svg>;
export const LogOutIcon = ({ size = 16 }: { size?: number }) => <Svg size={size}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></Svg>;
export const DataSaverIcon = ({ size = 16 }: { size?: number }) => <Svg size={size}><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></Svg>;
export const SendIcon = ({ size = 16 }: { size?: number }) => <Svg size={size}><path d="M12 19V5M5 12l7-7 7 7" /></Svg>;
export const ShieldIcon = ({ size = 16 }: { size?: number }) => <Svg size={size}><path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z" /><path d="m9 12 2 2 4-4" /></Svg>;
