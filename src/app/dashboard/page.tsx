"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { getSavedPresentations, SavedPresentation, deletePresentation } from "@/lib/storage";
import { generatePptx } from "@/lib/pptx-generator";
import { FileText, Download, Trash2, Calendar, Clock, LayoutTemplate } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const [presentations, setPresentations] = useState<SavedPresentation[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    setPresentations(getSavedPresentations());
  }, []);

  const handleDownload = async (presentation: SavedPresentation) => {
    setDownloadingId(presentation.id);
    try {
      // Re-download logic, no need to refetch images since they are already saved as base64 in storage
      await generatePptx(presentation.topic, presentation.slides, presentation.theme);
    } catch (e) {
      console.error("Failed to download", e);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = (id: string) => {
    deletePresentation(id);
    setPresentations(getSavedPresentations());
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
      <Navbar />
      
      {/* Background glow effects */}
      <div className="fixed top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-10 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto min-h-screen">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">My Presentations</h1>
          <p className="text-slate-400">View and redownload your previously generated AI presentations.</p>
        </div>

        {presentations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-white/5 rounded-3xl">
            <FileText className="h-16 w-16 text-slate-600 mb-6" />
            <h2 className="text-2xl font-semibold text-slate-300 mb-2">No presentations yet</h2>
            <p className="text-slate-500 mb-8 max-w-md text-center">You haven't generated any presentations yet. Head over to the generator to create your first one!</p>
            <a href="/" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/25">
              Generate Presentation
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {presentations.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                  className="bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-colors group flex flex-col"
                >
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                        <FileText className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-medium text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-white/5 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {new Date(p.date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2" title={p.topic}>
                      {p.topic}
                    </h3>
                    
                    <div className="flex items-center gap-4 mt-6 text-sm text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <LayoutTemplate className="h-4 w-4" />
                        <span className="capitalize">{p.theme.replace('-', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-4 w-4" />
                        <span>{p.slides.length} Slides</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-white/5 bg-white/[0.02] p-4 flex justify-between gap-3">
                    <button 
                      onClick={() => handleDownload(p)}
                      disabled={downloadingId === p.id}
                      className="flex-1 px-4 py-2 bg-white/5 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" />
                      {downloadingId === p.id ? "Preparing..." : "Download"}
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="p-2 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                      title="Delete presentation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
