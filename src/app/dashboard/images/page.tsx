"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { Search, Loader2, Image as ImageIcon, Download, ExternalLink } from "lucide-react";

interface ImageData {
  id: string;
  url: string;
  title: string;
}

// A smart component that only fetches the image when it's explicitly told to,
// allowing us to create a true strict sequential loading queue.
function SequentialImage({ src, alt, shouldLoad, onLoaded }: { src: string; alt: string; shouldLoad: boolean; onLoaded: () => void }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative w-full min-h-[200px] bg-slate-800 flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-800/80 backdrop-blur-sm z-10">
          {shouldLoad ? (
            <>
              <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
              <span className="text-xs text-indigo-300 font-medium tracking-wider text-center px-2">GENERATING AI...<br/>(This takes a moment)</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-6 w-6 text-slate-500" />
              <span className="text-xs text-slate-500 font-medium tracking-wider">WAITING IN QUEUE...</span>
            </>
          )}
        </div>
      )}
      {shouldLoad && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img 
          src={src} 
          alt={alt}
          onLoad={() => {
            setIsLoading(false);
            onLoaded();
          }}
          onError={() => {
            // Even if it fails, we must trigger onLoaded so the queue doesn't get permanently stuck
            setIsLoading(false);
            onLoaded();
          }}
          className={`w-full h-auto object-cover transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        />
      )}
    </div>
  );
}

export default function ImageExplorerPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [images, setImages] = useState<ImageData[]>([]);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError("");
    setHasSearched(true);
    setLoadedCount(0); // Reset the queue when searching again

    try {
      const res = await fetch(`/api/search-images?q=${encodeURIComponent(query)}`);
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to search images");
      }
      
      setImages(data.images || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch images. Please try another search term.");
      setImages([]);
    } finally {
      setIsSearching(false);
    }
  };

  const downloadImage = async (imageUrl: string, filename: string) => {
    const ext = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const cleanFilename = `${filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
    
    try {
      // Try native Web Share API first (perfect for mobile "Save to Gallery")
      if (navigator.share) {
        const proxyUrl = `/api/image?url=${encodeURIComponent(imageUrl)}`;
        const response = await fetch(proxyUrl);
        const blob = await response.blob();
        const file = new File([blob], cleanFilename, { type: blob.type || 'image/jpeg' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: cleanFilename,
          });
          return; // Success! User used the native share/save sheet
        }
      }
    } catch (e) {
      console.log("Web Share API failed or cancelled, falling back to traditional download:", e);
    }

    // Fallback: traditional anchor download for desktops
    const downloadUrl = `/api/image?url=${encodeURIComponent(imageUrl)}&download=true&filename=${encodeURIComponent(cleanFilename)}`;
    
    // Create an invisible anchor to trigger the native download
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = downloadUrl;
    // We also set the download attribute just in case, though the backend header forces it anyway
    a.download = cleanFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30 overflow-x-hidden">
      <Navbar />

      <main className="relative pt-32 pb-16 px-6 max-w-7xl mx-auto min-h-screen">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-sm font-medium text-indigo-300 mb-6"
          >
            <ImageIcon className="h-4 w-4" />
            Stock Image Explorer
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
          >
            Find the perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">visuals</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg mb-10"
          >
            Generate a grid of high-quality, completely unique AI stock images tailored exactly to your presentation topic.
          </motion.p>

          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSearch} 
            className="relative"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E.g., futuristic city skyline, corporate boardroom, renewable energy..."
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl py-5 pl-6 pr-40 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-lg shadow-xl"
            />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="absolute right-3 top-3 bottom-3 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              Generate
            </button>
          </motion.form>
        </div>

        {error && (
          <div className="text-center text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20 max-w-2xl mx-auto mb-12">
            {error}
          </div>
        )}

        {hasSearched && !isSearching && images.length === 0 && !error && (
          <div className="text-center text-slate-400 py-12">
            No images found for "{query}". Try a different keyword!
          </div>
        )}

        {images.length > 0 && (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
                className="relative group rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl break-inside-avoid"
              >
                <SequentialImage 
                  src={image.url} 
                  alt={image.title} 
                  shouldLoad={index <= loadedCount}
                  onLoaded={() => setLoadedCount(prev => Math.max(prev, index + 1))}
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                  <p className="text-white font-medium line-clamp-2 mb-4 drop-shadow-lg">
                    {image.title.replace('File:', '').split('.')[0]}
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => downloadImage(image.url, image.title)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="h-4 w-4" /> Download to Gallery
                    </button>
                    <a 
                      href={image.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-800/80 hover:bg-slate-700 backdrop-blur text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
