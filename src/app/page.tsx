"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { checkOpenAIKey, checkGroqKey } from "./actions";
import { Sparkles, Presentation, Zap, ChevronRight, LayoutTemplate, Image as ImageIcon, Loader2, Download, ArrowLeft, Layers, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { generatePptx, SlideData, ThemeType } from "@/lib/pptx-generator";
import { Navbar } from "@/components/Navbar";
import { ThemeSelector } from "@/components/ThemeSelector";
import { useReactToPrint } from "react-to-print";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [isKeyReady, setIsKeyReady] = useState(false);
  const [isGroqReady, setIsGroqReady] = useState(false);

  useEffect(() => {
    checkOpenAIKey().then((ready) => {
      setIsKeyReady(ready);
      if (ready) {
        setAiEngine("chatgpt");
      }
    });
    checkGroqKey().then((ready) => {
      setIsGroqReady(ready);
      if (ready) {
        setAiEngine("groq");
      }
    });
  }, []);
  const [slideCount, setSlideCount] = useState(5);
  const [theme, setTheme] = useState<ThemeType>("corporate-blue");
  const [aiEngine, setAiEngine] = useState<"gemini" | "chatgpt" | "groq">("gemini");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [generatedSlides, setGeneratedSlides] = useState<SlideData[] | null>(null);
  const [currentTopic, setCurrentTopic] = useState("");
  const [generatingImages, setGeneratingImages] = useState<number[]>([]);
  const [appMode, setAppMode] = useState<"presentation" | "report">("presentation");
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  
  const componentRef = useRef<HTMLDivElement>(null);
  
  const handleDownloadPDF = async () => {
    if (!generatedReport) return;
    
    // Import native libraries directly instead of the buggy html2pdf wrapper
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');
    
    // Show loading overlay first so it covers the screen (using inline styles so it survives stylesheet removal)
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = '#020617';
    overlay.style.color = 'white';
    overlay.style.zIndex = '999999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.fontFamily = 'sans-serif';
    overlay.style.fontSize = '20px';
    overlay.innerText = 'Analyzing document structure...';
    document.body.appendChild(overlay);

    await new Promise(r => setTimeout(r, 800)); // Allow browser substantial time to analyze and paint

    overlay.innerText = 'Generating PDF...';
    await new Promise(r => setTimeout(r, 200));

    // BULLETPROOF SCROLL FIX: html2canvas notoriously clips absolute positioned elements if the window is scrolled down.
    // Since the overlay completely blocks the screen, we can safely scroll to top, snapshot, and scroll back!
    const originalScrollY = window.scrollY;
    const originalScrollX = window.scrollX;
    window.scrollTo(0, 0);

    // Create a native div container (not an iframe)
    // Setup jsPDF first to get exact A4 dimensions
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const margin = 40;
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const innerWidth = pdfWidth - (margin * 2);
    const innerHeight = pdfHeight - (margin * 2);

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    // Match exact A4 inner width so 1px = 1pt
    container.style.width = `${innerWidth}px`; 
    container.style.backgroundColor = 'white';
    container.style.zIndex = '999998'; 
    container.id = 'pdf-export-container';
    
    // Extract just the report markdown HTML (it's inside .prose)
    const markdownContainer = componentRef.current?.querySelector('.prose');
    const htmlContent = markdownContainer ? markdownContainer.innerHTML : componentRef.current?.innerHTML;
    
    // Inject raw HTML inside a relative wrapper for flawless offset calculations
    container.innerHTML = `<div style="position: relative;">${htmlContent}</div>`;
    document.body.appendChild(container);

    // FORCE INLINE STYLES: jsPDF/html2canvas can completely ignore <style> blocks injected into divs.
    // By programmatically injecting the styles directly onto the DOM elements, we mathematically guarantee they render.
    container.style.fontFamily = "'Bookman Old Style', 'Bookman', serif";
    container.style.fontSize = '12px';
    container.style.lineHeight = '1.6';
    container.style.textAlign = 'left';
    container.style.color = 'black';
    
    // Apply to all elements
    container.querySelectorAll('*').forEach(el => {
      const e = el as HTMLElement;
      e.style.fontFamily = "'Bookman Old Style', 'Bookman', serif";
      e.style.color = 'black';
    });

    // Enforce strict sizes for Headings (16px) and Paragraphs (12px)
    container.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
      const e = el as HTMLElement;
      e.style.fontSize = '16px';
      e.style.fontWeight = 'bold';
      e.style.marginTop = '16px';
      e.style.marginBottom = '10px';
      e.style.pageBreakInside = 'avoid';
      if (e.tagName.toLowerCase() === 'h1') {
        e.style.textAlign = 'center';
      }
    });

    container.querySelectorAll('p').forEach(el => {
      const e = el as HTMLElement;
      e.style.fontSize = '12px';
      e.style.marginBottom = '10px';
      e.style.pageBreakInside = 'avoid';
    });

    // Formatting for lists and tables
    container.querySelectorAll('ul, ol').forEach(el => {
      const e = el as HTMLElement;
      e.style.paddingLeft = '24px';
      e.style.marginBottom = '12px';
    });
    
    container.querySelectorAll('li').forEach(el => {
      const e = el as HTMLElement;
      e.style.fontSize = '12px';
      e.style.marginBottom = '6px';
      e.style.pageBreakInside = 'avoid';
    });

    container.querySelectorAll('table').forEach(el => {
      const e = el as HTMLElement;
      e.style.borderCollapse = 'collapse';
      e.style.width = '100%';
      e.style.marginBottom = '20px';
      e.style.border = '1px solid black';
      e.style.pageBreakInside = 'avoid';
    });

    container.querySelectorAll('th, td').forEach(el => {
      const e = el as HTMLElement;
      e.style.border = '1px solid black';
      e.style.padding = '8px';
      e.style.textAlign = 'left';
      e.style.fontSize = '12px';
    });

    container.querySelectorAll('th').forEach(el => {
      (el as HTMLElement).style.backgroundColor = '#f0f0f0';
    });

    await new Promise(r => setTimeout(r, 100)); // Allow DOM to layout container

    // ============================================================================
    // FLAWLESS GRANULAR PAGINATION ALGORITHM:
    // Iterate over every specific paragraph, list item, and heading.
    // If it crosses the page boundary, push it perfectly to the next page WITH
    // an extra 40px of padding to guarantee "distance in both pages" as requested.
    // ============================================================================
    const wrapper = container.children[0] as HTMLElement;
    const breakableElements = Array.from(wrapper.querySelectorAll('p, li, h1, h2, h3, h4, table, img'));
    
    for (let i = 0; i < breakableElements.length; i++) {
      const el = breakableElements[i] as HTMLElement;
      
      // Calculate absolute offset relative to the wrapper
      let currentEl: HTMLElement | null = el;
      let elTop = 0;
      while (currentEl && currentEl !== wrapper) {
         elTop += currentEl.offsetTop;
         currentEl = currentEl.offsetParent as HTMLElement;
      }
      
      const elHeight = el.offsetHeight;
      const startPage = Math.floor(elTop / innerHeight);
      const endPage = Math.floor((elTop + elHeight) / innerHeight);
      
      // If the specific text node crosses the boundary, and isn't larger than a whole page
      if (startPage !== endPage && elHeight < innerHeight) {
         // Push it exactly to the next page + an extra 40px padding distance!
         const pushAmount = (endPage * innerHeight) - elTop + 40; 
         
         const spacer = document.createElement('div');
         spacer.style.height = `${pushAmount}px`;
         spacer.style.width = '100%';
         spacer.style.display = 'block';
         spacer.style.clear = 'both';
         el.parentNode?.insertBefore(spacer, el);
      }
    }

    // Wait briefly for the browser to paint the new spacers
    await new Promise(r => setTimeout(r, 100));

    // Temporarily remove all external/Tailwind stylesheets so html2canvas doesn't crash
    const existingStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
    const styleBackups = existingStyles.map(el => {
      if (el.parentNode === container) return null;
      const parent = el.parentNode;
      const sibling = el.nextSibling;
      parent?.removeChild(el);
      return { el, parent, sibling };
    }).filter(Boolean) as { el: Element, parent: ParentNode | null, sibling: ChildNode | null }[];

    const safeTopic = (currentTopic || 'Report').replace(/[^a-zA-Z0-9 -]/g, '').trim().substring(0, 30) || 'Report';

    try {
      // Take a single, flawless snapshot of the perfectly paginated wrapper
      const canvas = await html2canvas(wrapper, {
        scale: 2, // 2x high resolution
        useCORS: true,
        scrollY: 0,
        windowWidth: innerWidth,
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // Because scale is 2, the image height in pt is exactly half the canvas height
      const imgHeight = canvas.height / 2;
      
      let heightLeft = imgHeight;
      let position = margin; // Start drawing at the top margin

      // First page
      pdf.addImage(imgData, 'JPEG', margin, position, innerWidth, imgHeight);
      
      // Mask the physical margins with pure white rectangles so the image cannot bleed or duplicate
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdfWidth, margin, 'F'); // Top margin mask
      pdf.rect(0, pdfHeight - margin, pdfWidth, margin, 'F'); // Bottom margin mask
      
      heightLeft -= innerHeight;

      // Slice subsequent pages perfectly through the whitespace spacers!
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin; 
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, innerWidth, imgHeight);
        
        // Mask the physical margins on all subsequent pages
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pdfWidth, margin, 'F'); 
        pdf.rect(0, pdfHeight - margin, pdfWidth, margin, 'F'); 
        
        heightLeft -= innerHeight;
      }

      pdf.save(`${safeTopic}.pdf`);
    } finally {
      // Restore all stylesheets immediately
      styleBackups.forEach(({ el, parent, sibling }) => {
        parent?.insertBefore(el, sibling);
      });
      document.body.removeChild(container);
      document.body.removeChild(overlay);
      
      // Restore the user's original scroll position seamlessly
      window.scrollTo(originalScrollX, originalScrollY);
    }
  };

  const handleDownloadWord = async () => {
    if (!generatedReport) return;
    
    setIsDownloading(true);
    
    try {
      const markdownContainer = componentRef.current?.querySelector('.prose');
      const htmlContent = markdownContainer ? markdownContainer.innerHTML : componentRef.current?.innerHTML;
      
      if (!htmlContent) return;

      const response = await fetch('/api/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlContent, topic: currentTopic })
      });

      if (!response.ok) {
        throw new Error('Failed to generate DOCX');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const safeTopic = (currentTopic || 'Report').replace(/[^a-zA-Z0-9 -]/g, '').trim().substring(0, 30) || 'Report';
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeTopic}.docx`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Failed to generate Word document.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please describe what your presentation should be about.");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, slideCount, aiEngine }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate presentation structure.");
      }

      const slidesWithImages = data.slides;

      setGeneratedSlides(slidesWithImages);
      setCurrentTopic(topic);
      
      // Automatically save to dashboard history
      import('@/lib/storage').then(({ savePresentation }) => {
        savePresentation(topic, theme, slidesWithImages);
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!generatedSlides || !currentTopic) return;
    
    setIsDownloading(true);
    try {
      const slidesForDownload = await Promise.all(generatedSlides.map(async (slide) => {
        const slideCopy = { ...slide };
        if (slide.imageUrl) {
          try {
            const absoluteUrl = slide.imageUrl.startsWith("http") 
              ? slide.imageUrl 
              : `${window.location.origin}${slide.imageUrl}`;
              
            const res = await fetch(absoluteUrl);
            
            if (res.ok) {
              const blob = await res.blob();
              
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              
              const base64Data = base64.replace(/^data:/, '');
              slideCopy.imageData = base64Data;
            } else {
              console.warn("Image proxy skipped a broken image:", res.statusText);
              slideCopy.imageUrl = undefined; 
            }
          } catch (e) {
            console.warn("Failed to fetch image as base64", e);
          }
        }
        return slideCopy;
      }));

      await generatePptx(currentTopic, slidesForDownload, theme);
    } catch (e) {
      console.error("Download failed:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!topic.trim()) {
      setError("Please describe what your report should be about.");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, aiEngine }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate report.");
      }

      setGeneratedReport(data.report);
      setCurrentTopic(topic);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartOver = () => {
    setGeneratedSlides(null);
    setGeneratedReport(null);
    setTopic("");
    setCurrentTopic("");
    setSlideCount(5);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30 overflow-x-hidden">
      <Navbar />

      {/* Background glow effects */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-[100px]" />
      </div>

      <AnimatePresence mode="wait">
        {!generatedSlides && !generatedReport ? (
          <motion.div 
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10"
          >
            {/* Hero Section */}
            <main className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pb-32 px-6">
              <div className="relative max-w-5xl mx-auto text-center space-y-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-indigo-300 mb-4"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>The future of presentation design is here</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-5xl sm:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-400"
                >
                  Create Professional <br /> Presentations Using AI
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-400 leading-relaxed"
                >
                  Describe your topic in detail, specify how many slides you need, and let SlideCraft AI deeply research and structure your presentation.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex flex-col items-center justify-center pt-8 w-full"
                >
                  <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-3xl p-6 text-left shadow-2xl backdrop-blur-sm">
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex bg-slate-900 border border-white/10 rounded-lg p-1 shrink-0">
                        <button
                          onClick={() => setAppMode("presentation")}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${appMode === "presentation" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                        >
                          <Presentation className="h-4 w-4 inline mr-2" />
                          Presentation
                        </button>
                        <button
                          onClick={() => setAppMode("report")}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${appMode === "report" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                        >
                          <FileText className="h-4 w-4 inline mr-2" />
                          Report
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">

                        {appMode === "presentation" && (
                          <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500">
                            <Layers className="h-4 w-4 text-slate-400" />
                            <select 
                              value={slideCount}
                              onChange={(e) => setSlideCount(Number(e.target.value))}
                              disabled={isGenerating}
                              className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
                            >
                              <option value={5}>5 Slides</option>
                              <option value={10}>10 Slides</option>
                              <option value={15}>15 Slides</option>
                              <option value={20}>20 Slides</option>
                            </select>
                          </div>
                        )}
                        <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500">
                          <Sparkles className="h-4 w-4 text-slate-400" />
                          <select 
                            value={aiEngine}
                            onChange={(e) => setAiEngine(e.target.value as "gemini" | "chatgpt" | "groq")}
                            disabled={isGenerating}
                            className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer"
                          >
                            <option value="gemini">Google Gemini (Live Search)</option>
                            <option value="chatgpt">OpenAI ChatGPT ({isKeyReady ? "Ready" : "Requires Key"})</option>
                            <option value="groq">Groq ({isGroqReady ? "Ready" : "Requires Key"})</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <textarea
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      disabled={isGenerating}
                      rows={4}
                      placeholder={appMode === "presentation" ? "e.g., Create a presentation about Artificial Intelligence in Healthcare. Make sure to include slides on diagnosis, AI-assisted surgery, data privacy concerns, and future trends." : "e.g., Write a comprehensive MBA report analyzing the impact of Artificial Intelligence in Healthcare..."}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50 resize-none mb-2"
                    />

                    {appMode === "presentation" && <ThemeSelector value={theme} onChange={setTheme} disabled={isGenerating} />}

                    <div className="flex items-center justify-between mt-2">
                      {error ? (
                        <p className="text-red-400 text-sm animate-pulse">{error}</p>
                      ) : (
                        <div />
                      )}
                      <button 
                        onClick={appMode === "presentation" ? handleGenerate : handleGenerateReport}
                        disabled={isGenerating}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Researching & Creating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" /> {appMode === "presentation" ? "Generate PPT" : "Generate Report"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </main>

            {/* Features Section */}
            <section className="relative max-w-7xl mx-auto px-6 py-16">
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: Zap,
                    title: "Deep AI Research",
                    description: "Our AI doesn't just format text; it actively researches your instructions to provide factual, detailed information.",
                  },
                  {
                    icon: ImageIcon,
                    title: "AI Image Provisioning",
                    description: "Automatically source and insert perfectly contextual images and illustrations for every slide.",
                  },
                  {
                    icon: LayoutTemplate,
                    title: "Premium Templates",
                    description: "Choose from dozens of professionally designed themes that ensure you always look your best.",
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
                      <feature.icon className="h-6 w-6 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div 
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 pt-32 pb-24 px-6 max-w-6xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{generatedSlides ? "Presentation Preview" : "Report Preview"}</h2>
                <p className="text-slate-400 max-w-2xl line-clamp-2">Instructions: <span className="text-indigo-400">{currentTopic}</span></p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button 
                  onClick={handleStartOver}
                  className="px-5 py-2.5 text-sm font-medium bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Start Over
                </button>
                {generatedSlides && (
                  <button 
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="px-5 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-full transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                  >
                    {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} 
                    {isDownloading ? "Downloading..." : "Download .pptx"}
                  </button>
                )}
              </div>
            </div>

            <div id="presentation-preview" ref={componentRef} className="grid gap-8 mb-16 p-4 bg-slate-950 print:bg-white print:text-black">
              {generatedReport && (
                <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-8 sm:p-12 shadow-2xl backdrop-blur-sm print:bg-white print:border-none print:shadow-none print:p-0">
                  <div className="prose prose-invert prose-indigo max-w-none print:prose-p:text-black print:prose-headings:text-black">
                    <ReactMarkdown>{generatedReport}</ReactMarkdown>
                  </div>
                </div>
              )}

              {generatedSlides && generatedSlides.map((slide, index) => (
                <div 
                  key={index} 
                  className="bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm print:bg-white print:border-slate-300 print:shadow-none print:break-after-page"
                >
                  {/* Slide Header */}
                  <div className="bg-indigo-600/20 border-b border-indigo-500/20 px-6 py-4 flex justify-between items-center print:bg-slate-100 print:border-slate-200">
                    <span className="text-indigo-300 font-medium text-sm tracking-wider uppercase print:text-slate-600">Slide {index + 1}</span>
                    <button
                      onClick={async () => {
                        if (!generatedSlides) return;
                        setGeneratingImages(prev => [...prev, index]);
                        const newSlides = [...generatedSlides];
                        const slideCopy = { ...newSlides[index] };
                        
                        // Create a detailed keyword from the slide title and content, ALWAYS including the main topic
                        const baseKeyword = `${currentTopic} ${slideCopy.imageKeyword || slideCopy.title}`;
                        const keyword = encodeURIComponent(baseKeyword + " clean professional corporate stock photography high quality");
                        const seed = Math.floor(Math.random() * 1000000); // Random seed for new images
                        const targetUrl = `https://image.pollinations.ai/prompt/${keyword}?width=800&height=600&nologo=true&seed=${seed}`;
                        const proxyUrl = `/api/image?url=${encodeURIComponent(targetUrl)}`;
                        
                        try {
                          const res = await fetch(proxyUrl);
                          if (res.ok) {
                            const blob = await res.blob();
                            const base64 = await new Promise<string>((resolve, reject) => {
                              const reader = new FileReader();
                              reader.onloadend = () => resolve(reader.result as string);
                              reader.onerror = reject;
                              reader.readAsDataURL(blob);
                            });
                            slideCopy.imageUrl = base64; // Set to base64 so it's locked in
                            slideCopy.imageData = base64.replace(/^data:/, ''); // Prepare for PPTX
                            
                            newSlides[index] = slideCopy;
                            setGeneratedSlides(newSlides);
                          }
                        } catch (err) {
                          console.error("Failed to generate and fetch AI image", err);
                        } finally {
                          setGeneratingImages(prev => prev.filter(i => i !== index));
                        }
                      }}
                      disabled={generatingImages.includes(index)}
                      className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed text-indigo-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 border border-indigo-500/30 print:hidden"
                    >
                      {generatingImages.includes(index) ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ImageIcon className="h-3.5 w-3.5" />
                      )}
                      {generatingImages.includes(index) ? "Generating..." : slide.imageUrl ? "Regenerate Image" : "Add AI Image"}
                    </button>
                  </div>
                  
                  {/* Slide Content */}
                  <div className="p-8 sm:p-10 flex flex-col md:flex-row gap-8">
                    {/* Text Section */}
                    <div className={`flex-1 ${slide.imageUrl ? 'md:w-1/2' : 'w-full'}`}>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 print:text-black">{slide.title}</h3>
                      {slide.subtitle && (
                        <h4 className="text-xl text-slate-400 italic mb-8 print:text-black">{slide.subtitle}</h4>
                      )}
                      
                      {!slide.subtitle && <div className="h-6"></div>}

                      <ul className="space-y-4 mb-8">
                        {slide.content.map((point, idx) => {
                          const colonIndex = point.indexOf(":");
                          const hasBoldPrefix = colonIndex > 0 && colonIndex < 40;
                          
                          return (
                            <li key={idx} className="flex items-start gap-3 text-slate-300 text-lg print:text-black">
                              <span className="text-indigo-500 mt-1.5 text-xl print:text-black">•</span>
                              <span className="leading-relaxed">
                                {hasBoldPrefix ? (
                                  <>
                                    <strong className="text-white font-semibold print:text-black">{point.substring(0, colonIndex + 1)}</strong>
                                    {point.substring(colonIndex + 1)}
                                  </>
                                ) : (
                                  point
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    
                    {/* Image Section */}
                    {slide.imageUrl && (
                      <div className="md:w-1/2 flex items-center justify-center">
                        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-white/10 shadow-2xl print:border-none print:shadow-none">
                          {/* We show a simple placeholder or the actual image */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={slide.imageUrl} 
                            alt={slide.title} 
                            className="object-cover w-full h-full"
                            key={slide.imageUrl} // forces re-render when image changes
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Speaker Notes */}
                  {slide.speakerNotes && (
                    <div className="bg-slate-950/50 p-6 border-t border-white/5 print:hidden">
                      <p className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">Speaker Notes (Deep Research)</p>
                      <p className="text-slate-400 italic leading-relaxed">{slide.speakerNotes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
              {generatedReport && (
                <>
                  <button 
                    onClick={() => handleDownloadPDF()}
                    className="px-8 py-4 text-base font-medium bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-full transition-all flex items-center gap-2 shadow-xl shadow-red-500/25 hover:scale-105"
                  >
                    <Download className="h-5 w-5" />
                    Download as PDF
                  </button>
                  <button 
                    onClick={() => handleDownloadWord()}
                    disabled={isDownloading}
                    className="px-8 py-4 text-base font-medium bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-blue-600/50 disabled:to-cyan-600/50 text-white rounded-full transition-all flex items-center gap-2 shadow-xl shadow-blue-500/25 hover:scale-105"
                  >
                    {isDownloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                    Download MS Word
                  </button>
                </>
              )}

              {generatedSlides && (
                <button 
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="px-8 py-4 text-base font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-indigo-600/50 disabled:to-purple-600/50 text-white rounded-full transition-all flex items-center gap-2 shadow-xl shadow-indigo-500/25 hover:scale-105"
                >
                  {isDownloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                  Download MS PowerPoint
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
