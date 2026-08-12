// Project Amnion 2.0 - SVG Icons Component Library
// All icons are 24x24 by default

import { defineComponent, h } from 'vue';

// Helper to create SVG icons
defineComponent;

function createIcon(path: string, name: string) {
  return defineComponent({
    name,
    render() {
      return h('svg', {
        xmlns: 'http://www.w3.org/2000/svg',
        fill: 'none',
        viewBox: '0 0 24 24',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        class: 'shrink-0',
      }, [h('path', { d: path })]);
    },
  });
}

// Navigation Icons
export const HomeIcon = createIcon(
  'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  'HomeIcon'
);

export const UsersIcon = createIcon(
  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  'UsersIcon'
);

export const ChartBarIcon = createIcon(
  'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  'ChartBarIcon'
);

export const ClipboardListIcon = createIcon(
  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  'ClipboardListIcon'
);

export const CogIcon = createIcon(
  'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  'CogIcon'
);

export const LogoutIcon = createIcon(
  'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  'LogoutIcon'
);

export const MenuIcon = createIcon(
  'M4 6h16M4 12h16M4 18h16',
  'MenuIcon'
);

// Theme Icons
export const SunIcon = createIcon(
  'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  'SunIcon'
);

export const MoonIcon = createIcon(
  'M21 12.79A9 9 0 1111.21 5 7 7 0 0021 12.79z',
  'MoonIcon'
);

// Action Icons
export const BellIcon = createIcon(
  'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  'BellIcon'
);

export const SearchIcon = createIcon(
  'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  'SearchIcon'
);

export const PlusIcon = createIcon(
  'M12 4v16m8-8H4',
  'PlusIcon'
);

export const TrashIcon = createIcon(
  'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  'TrashIcon'
);

export const PencilIcon = createIcon(
  'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  'PencilIcon'
);

export const CopyIcon = createIcon(
  'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
  'CopyIcon'
);

export const RefreshIcon = createIcon(
  'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  'RefreshIcon'
);

export const CheckIcon = createIcon(
  'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  'CheckIcon'
);

export const XIcon = createIcon(
  'M6 18L18 6M6 6l12 12',
  'XIcon'
);

export const ExclamationIcon = createIcon(
  'M12 9v2m0 4h.01m-6.938 4h13.856c1.26 0 2.5-1.24 2.5-2.5V7a2.5 2.5 0 00-2.5-2.5H4.062a2.5 2.5 0 00-2.5 2.5v7.5A2.5 2.5 0 004.062 16z',
  'ExclamationIcon'
);

export const InformationCircleIcon = createIcon(
  'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'InformationCircleIcon'
);

export const ArrowUpIcon = createIcon(
  'M5 15l7-7 7 7',
  'ArrowUpIcon'
);

export const ArrowDownIcon = createIcon(
  'M19 9l-7 7-7-7',
  'ArrowDownIcon'
);

export const ArrowLeftIcon = createIcon(
  'M19 12H5m7 7-7-7 7-7',
  'ArrowLeftIcon'
);

export const ArrowRightIcon = createIcon(
  'M5 12h14M12 5l7 7-7 7',
  'ArrowRightIcon'
);

export const QrCodeIcon = createIcon(
  'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  'QrCodeIcon'
);

export const KeyIcon = createIcon(
  'M21 2l-2 2m-7.618-7.618a5 5 0 117.618 7.618L11 15.5 4 12.5C4.553 11.162 5.5 9.5 6.84 8.16a5 5 0 117.618 7.618L15.5 11 12.5 4z',
  'KeyIcon'
);

export const ShieldCheckIcon = createIcon(
  'M10 5a2 2 0 012-2h1a1 1 0 011 1v3a1 1 0 001 1h2a1 1 0 011 1v7a1 1 0 01-1 1h-1a2 2 0 00-2 2h-1a2 2 0 00-2-2h-2a1 1 0 01-1-1V5zM9 5a1 1 0 00-1 1v12a1 1 0 001 1h1a1 1 0 001-1V6a1 1 0 00-1-1H9z',
  'ShieldCheckIcon'
);

export const CpuChipIcon = createIcon(
  'M9 9V7a2 2 0 012-2h2a2 2 0 012 2v2m-4 0h4m-4 4h4m-4 4h4m-8-4a2 2 0 012-2h4a2 2 0 012 2m0 0a2 2 0 01-2 2H5a2 2 0 01-2-2m0 0V9a2 2 0 012-2h4a2 2 0 012 2',
  'CpuChipIcon'
);

export const MemoryIcon = createIcon(
  'M13 10V3L4 14h7v7l9-11h-7z',
  'MemoryIcon'
);

export const HardDriveIcon = createIcon(
  'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
  'HardDriveIcon'
);

export const NetworkIcon = createIcon(
  'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  'NetworkIcon'
);

export const UserIcon = createIcon(
  'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  'UserIcon'
);

export const ClockIcon = createIcon(
  'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  'ClockIcon'
);

export const CalendarIcon = createIcon(
  'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  'CalendarIcon'
);

export const DownloadIcon = createIcon(
  'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  'DownloadIcon'
);

export const UploadIcon = createIcon(
  'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
  'UploadIcon'
);

export const PauseIcon = createIcon(
  'M10 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4a2 2 0 01-2-2V6a2 2 0 012-2zM8 8h8',
  'PauseIcon'
);

export const PlayIcon = createIcon(
  'M8 5v14l11-7z',
  'PlayIcon'
);

export const StopIcon = createIcon(
  'M6 18L18 6M6 6l12 12',
  'StopIcon'
);

export const ChevronUpIcon = createIcon(
  'M18 15l-6-6-6 6',
  'ChevronUpIcon'
);

export const ChevronDownIcon = createIcon(
  'M6 9l6 6 6-6',
  'ChevronDownIcon'
);

export const ChevronLeftIcon = createIcon(
  'M15 18l-6-6 6-6',
  'ChevronLeftIcon'
);

export const ChevronRightIcon = createIcon(
  'M9 18l6-6-6-6',
  'ChevronRightIcon'
);

export const DotsVerticalIcon = createIcon(
  'M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z',
  'DotsVerticalIcon'
);

export const FilterIcon = createIcon(
  'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586l-7.293-7.293a1 1 0 010-1.414zM10 7a1 1 0 011 1v2.586l4.293-4.293a1 1 0 111.414 1.414L12 11.414V14a1 1 0 01-1 1h-2a1 1 0 01-1-1v-1.586l-2.293 2.293a1 1 0 01-1.414-1.414L10 9.586V7z',
  'FilterIcon'
);

export const SortAscendingIcon = createIcon(
  'M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12',
  'SortAscendingIcon'
);

export const SortDescendingIcon = createIcon(
  'M3 4h13M3 8h9m-9 4h6m4 0l4 4m0 0l4-4m-4 4V4',
  'SortDescendingIcon'
);
