import React from "react";
import Link from "next/link";
import { Presentation, LayoutDashboard, User, Image } from "lucide-react";

export function Navbar() {
  return (
    <nav className="absolute top-0 w-full z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Presentation className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">SlideCraft AI</span>
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center space-x-1">
            <Link 
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Saved Presentations
            </Link>
            <Link 
              href="/dashboard/images"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
            >
              <Image className="h-4 w-4" />
              Image Explorer
            </Link>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full pl-2 pr-4 py-1.5 cursor-pointer hover:bg-white/10 transition-colors">
            <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center">
              <User className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-medium text-white">Guest User</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
