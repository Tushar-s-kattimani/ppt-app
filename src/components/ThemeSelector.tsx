import React from 'react';
import { ThemeType } from '@/lib/pptx-generator';

interface ThemeSelectorProps {
  value: ThemeType;
  onChange: (theme: ThemeType) => void;
  disabled?: boolean;
}

const THEMES: { id: ThemeType; name: string; colors: any }[] = [
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    colors: { bg: 'bg-[#F0F4F8]', header: 'bg-[#1E3A8A]', accent: 'bg-[#3B82F6]' }
  },
  {
    id: 'dark-modern',
    name: 'Dark Modern',
    colors: { bg: 'bg-[#0F172A]', header: 'bg-[#020617]', accent: 'bg-[#8B5CF6]' }
  },
  {
    id: 'clean-light',
    name: 'Clean Light',
    colors: { bg: 'bg-[#FFFFFF]', header: 'bg-[#F8FAFC]', accent: 'bg-[#10B981]' }
  },
  {
    id: 'nature-green',
    name: 'Nature Green',
    colors: { bg: 'bg-[#F0FDF4]', header: 'bg-[#14532D]', accent: 'bg-[#22C55E]' }
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    colors: { bg: 'bg-[#FFF7ED]', header: 'bg-[#C2410C]', accent: 'bg-[#F97316]' }
  },
  {
    id: 'elegant-monochrome',
    name: 'Monochrome',
    colors: { bg: 'bg-[#FAFAFA]', header: 'bg-[#18181B]', accent: 'bg-[#52525B]' }
  },
  {
    id: 'neon-cyberpunk',
    name: 'Cyberpunk',
    colors: { bg: 'bg-[#000000]', header: 'bg-[#111111]', accent: 'bg-[#06B6D4]' }
  },
  {
    id: 'vintage-sepia',
    name: 'Vintage Sepia',
    colors: { bg: 'bg-[#FDF6E3]', header: 'bg-[#D4B483]', accent: 'bg-[#8C5A48]' }
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    colors: { bg: 'bg-[#F0FDFA]', header: 'bg-[#0F766E]', accent: 'bg-[#0EA5E9]' }
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    colors: { bg: 'bg-[#FAF5FF]', header: 'bg-[#581C87]', accent: 'bg-[#D97706]' }
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    colors: { bg: 'bg-[#FFF1F2]', header: 'bg-[#F43F5E]', accent: 'bg-[#FB7185]' }
  },
  {
    id: 'minimal-bold',
    name: 'Minimal Bold',
    colors: { bg: 'bg-[#FEF08A]', header: 'bg-[#000000]', accent: 'bg-[#DC2626]' }
  }
];

export function ThemeSelector({ value, onChange, disabled }: ThemeSelectorProps) {
  return (
    <div className="w-full mt-6 mb-4">
      <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 block">
        Select Template Design
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onChange(theme.id)}
            disabled={disabled}
            type="button"
            className={`
              relative flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-300
              ${value === theme.id ? 'border-indigo-500 bg-indigo-500/10 scale-105 shadow-xl shadow-indigo-500/20' : 'border-white/10 bg-slate-900/50 hover:border-white/30 hover:bg-slate-800'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {/* Miniature Slide Preview */}
            <div className={`w-full aspect-video rounded shadow-inner overflow-hidden flex flex-col ${theme.colors.bg}`}>
              {/* Header */}
              <div className={`w-full h-[35%] ${theme.colors.header} flex flex-col justify-center px-1.5`}>
                <div className="w-2/3 h-1.5 bg-white/70 rounded-full mb-0.5"></div>
                <div className="w-1/2 h-1 bg-white/40 rounded-full"></div>
              </div>
              {/* Content */}
              <div className="flex-1 p-1.5 flex flex-col gap-1.5 mt-1">
                <div className="flex items-start gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 shrink-0 ${theme.colors.accent}`}></div>
                  <div className="flex flex-col gap-1 w-full">
                     <div className="w-full h-1 bg-black/10 rounded-full"></div>
                     <div className="w-5/6 h-1 bg-black/10 rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-start gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 shrink-0 ${theme.colors.accent}`}></div>
                  <div className="flex flex-col gap-1 w-full">
                     <div className="w-11/12 h-1 bg-black/10 rounded-full"></div>
                     <div className="w-4/6 h-1 bg-black/10 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
            <span className="mt-3 text-xs font-semibold text-slate-300 text-center leading-tight">
              {theme.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
