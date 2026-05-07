/* global React */

// ===== Icons (lucide-style, hand-tuned) =====
const Icon = ({ d, size = 16, stroke = 1.75, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    {d}
  </svg>
);

const Icons = {
  Home: (p) => <Icon {...p} d={<><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></>} />,
  Rules: (p) => <Icon {...p} d={<><path d="M9 5h10"/><path d="M9 12h10"/><path d="M9 19h10"/><circle cx="5" cy="5" r="1.4"/><circle cx="5" cy="12" r="1.4"/><circle cx="5" cy="19" r="1.4"/></>} />,
  Table: (p) => <Icon {...p} d={<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></>} />,
  Layers: (p) => <Icon {...p} d={<><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></>} />,
  Play: (p) => <Icon {...p} d={<polygon points="6 4 20 12 6 20 6 4"/>} />,
  History: (p) => <Icon {...p} d={<><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></>} />,
  Cog: (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>} />,
  Search: (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>} />,
  Plus: (p) => <Icon {...p} d={<><path d="M12 5v14"/><path d="M5 12h14"/></>} />,
  ChevronDown: (p) => <Icon {...p} d={<path d="m6 9 6 6 6-6"/>} />,
  ChevronRight: (p) => <Icon {...p} d={<path d="m9 6 6 6-6 6"/>} />,
  Check: (p) => <Icon {...p} d={<path d="M5 12.5 10 17.5 20 7"/>} />,
  X: (p) => <Icon {...p} d={<><path d="m6 6 12 12"/><path d="m18 6-12 12"/></>} />,
  Filter: (p) => <Icon {...p} d={<path d="M3 4h18l-7 9v7l-4-2v-5L3 4Z"/>} />,
  Sort: (p) => <Icon {...p} d={<><path d="M7 4v16"/><path d="m3 8 4-4 4 4"/><path d="M17 20V4"/><path d="m13 16 4 4 4-4"/></>} />,
  Bell: (p) => <Icon {...p} d={<><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>} />,
  Hash: (p) => <Icon {...p} d={<><path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3 8 21"/><path d="M16 3l-2 18"/></>} />,
  Type: (p) => <Icon {...p} d={<><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></>} />,
  Calendar: (p) => <Icon {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></>} />,
  Bool: (p) => <Icon {...p} d={<><circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4" opacity="0.4"/></>} />,
  Trash: (p) => <Icon {...p} d={<><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></>} />,
  Copy: (p) => <Icon {...p} d={<><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>} />,
  More: (p) => <Icon {...p} d={<><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></>} />,
  Sun: (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.93 19.07 1.41-1.41"/><path d="m17.66 6.34 1.41-1.41"/></>} />,
  Moon: (p) => <Icon {...p} d={<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>} />,
  Code: (p) => <Icon {...p} d={<><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></>} />,
  Eye: (p) => <Icon {...p} d={<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>} />,
  ArrowRight: (p) => <Icon {...p} d={<><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>} />,
  Zap: (p) => <Icon {...p} d={<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>} />,
  Tag: (p) => <Icon {...p} d={<><path d="M20.6 13.4 13.4 20.6a1 1 0 0 1-1.4 0L3 11.6V3h8.6l9 9a1 1 0 0 1 0 1.4Z"/><circle cx="7.5" cy="7.5" r="1"/></>} />,
  Folder: (p) => <Icon {...p} d={<path d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>} />,
  GitBranch: (p) => <Icon {...p} d={<><path d="M6 3v12"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><path d="M6 15a9 9 0 0 0 9-9"/></>} />,
  Edit: (p) => <Icon {...p} d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></>} />,
  ArrowUp: (p) => <Icon {...p} d={<><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></>} />,
  ArrowDown: (p) => <Icon {...p} d={<><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></>} />,
  Sparkle: (p) => <Icon {...p} d={<><path d="M12 3v3"/><path d="M12 18v3"/><path d="M5.6 5.6l2.1 2.1"/><path d="m16.3 16.3 2.1 2.1"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="m5.6 18.4 2.1-2.1"/><path d="m16.3 7.7 2.1-2.1"/></>} />,
  Beaker: (p) => <Icon {...p} d={<><path d="M9 3v6L4 20a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-11V3"/><path d="M8 3h8"/><path d="M7 14h10"/></>} />,
  Save: (p) => <Icon {...p} d={<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></>} />,
  Globe: (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/></>} />,
};

window.Icons = Icons;
