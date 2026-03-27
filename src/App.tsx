/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Camera, 
  Palette, 
  Sparkles, 
  Package, 
  Loader2, 
  ChevronRight, 
  RefreshCw,
  CheckCircle2,
  Info,
  Upload,
  Image as ImageIcon,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
interface StylingResult {
  colorPalette: {
    hex: string;
    name: string;
    role: string;
  }[];
  backgroundSuggestions: string[];
  propSuggestions: {
    category: string;
    items: string[];
  }[];
  stylingAdvice: string;
}

const FEELS = [
  "Premium",
  "Luxury",
  "Casual",
  "Minimalist",
  "Vintage",
  "Ethereal",
  "Moody",
  "Vibrant",
  "Organic",
  "Industrial"
];

const HARMONIES = [
  "Complementary",
  "Analogous",
  "Triadic",
  "Monochromatic",
  "Split-Complementary"
];

export default function App() {
  const [productName, setProductName] = useState("");
  const [productColor, setProductColor] = useState("#000000");
  const [feel, setFeel] = useState("Premium");
  const [harmony, setHarmony] = useState("Complementary");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StylingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const generateStyling = async () => {
    if (!productName && !selectedImage) {
      setError("Please enter a product name or upload an image.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const parts: any[] = [];
      
      if (selectedImage) {
        const base64Data = selectedImage.split(',')[1];
        const mimeType = selectedImage.split(';')[0].split(':')[1];
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }

      const prompt = selectedImage 
        ? `Analyze this image of a product or scene. 
           Identify the main subjects (e.g., the dish, the cutlery, the product).
           Identify the key colors present in the image.
           
           Based on this analysis, act as a professional Prop Stylist and Set Stylist.
           I want to create a shoot that feels "${feel}" using a "${harmony}" color harmony relative to the existing colors.
           
           Provide:
           1. A color palette of 4-5 colors (hex codes and names) that complement or enhance the existing scene.
           2. Specific background material suggestions that would elevate this specific setup.
           3. A list of props categorized by type that would fill the frame better or add to the story.
           4. Detailed styling advice on composition and lighting to achieve the "${feel}" feel for this specific subject.`
        : `I am a photographer styling a shoot for a product: "${productName}". 
           The product's primary color is ${productColor}. 
           I want the shoot to feel ${feel} using a ${harmony} color harmony.
           
           Act as a professional Prop Stylist and Set Stylist. Provide:
           1. A color palette of 4-5 colors (hex codes and names) that work with the product color.
           2. Specific background material suggestions (e.g., silk cloth, textured concrete, matte chart).
           3. A list of props categorized by type (e.g., Organic, Fabric, Hard Props).
           4. Detailed styling advice on composition and lighting to achieve the "${feel}" feel.`;

      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              colorPalette: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    hex: { type: Type.STRING },
                    name: { type: Type.STRING },
                    role: { type: Type.STRING, description: "e.g., Primary Background, Accent, Highlight" }
                  },
                  required: ["hex", "name", "role"]
                }
              },
              backgroundSuggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              propSuggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    items: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["category", "items"]
                }
              },
              stylingAdvice: { type: Type.STRING }
            },
            required: ["colorPalette", "backgroundSuggestions", "propSuggestions", "stylingAdvice"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}") as StylingResult;
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Failed to generate styling advice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfcfb] text-[#1a1a1a] font-sans selection:bg-[#5A5A40] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#1a1a1a]/10 py-6 px-8 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Camera className="w-6 h-6 text-[#5A5A40]" />
          <h1 className="text-xl font-serif italic tracking-tight">SetStyle Assistant</h1>
        </div>
        <div className="hidden md:flex gap-8 text-xs uppercase tracking-widest font-semibold opacity-60">
          <span>Color Harmony</span>
          <span>Prop Sourcing</span>
          <span>Set Design</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Input Section */}
        <section className="lg:col-span-4 space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-serif leading-tight">Plan your next <br /><span className="italic">masterpiece.</span></h2>
            <p className="text-sm text-[#1a1a1a]/60 max-w-xs">Define your product and mood. We'll handle the research and styling logic.</p>
          </div>

          <div className="space-y-6 bg-white p-8 rounded-[32px] shadow-sm border border-[#1a1a1a]/5">
            {/* Image Upload Area */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Reference Image (Optional)</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group",
                  selectedImage ? "border-transparent" : "border-[#1a1a1a]/10 hover:border-[#5A5A40]/40 hover:bg-[#f5f2ed]/50"
                )}
              >
                {selectedImage ? (
                  <>
                    <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-[10px] font-bold uppercase tracking-widest">Change Image</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                    >
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-[#f5f2ed] rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5 text-[#1a1a1a]/40" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Upload Product Photo</p>
                    <p className="text-[9px] opacity-30 mt-1 italic">AI will analyze colors & textures</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Product Name / Description</label>
              <input 
                type="text" 
                placeholder={selectedImage ? "Optional if image is uploaded" : "e.g. Luxury Watch, Organic Skincare"}
                className="w-full bg-transparent border-b border-[#1a1a1a]/20 py-2 focus:border-[#5A5A40] outline-none transition-colors"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            {!selectedImage && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Primary Color</label>
                <div className="flex gap-3 items-center">
                  <input 
                    type="color" 
                    className="w-10 h-10 rounded-full border-none cursor-pointer overflow-hidden"
                    value={productColor}
                    onChange={(e) => setProductColor(e.target.value)}
                  />
                  <span className="font-mono text-xs uppercase">{productColor}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Desired Feel</label>
              <div className="grid grid-cols-2 gap-2">
                {FEELS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFeel(f)}
                    className={cn(
                      "text-xs py-2 px-3 rounded-full border transition-all",
                      feel === f 
                        ? "bg-[#5A5A40] text-white border-[#5A5A40]" 
                        : "border-[#1a1a1a]/10 hover:border-[#1a1a1a]/30"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Color Harmony</label>
              <select 
                className="w-full bg-transparent border-b border-[#1a1a1a]/20 py-2 focus:border-[#5A5A40] outline-none transition-colors appearance-none"
                value={harmony}
                onChange={(e) => setHarmony(e.target.value)}
              >
                {HARMONIES.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <button 
              onClick={generateStyling}
              disabled={loading}
              className="w-full bg-[#1a1a1a] text-white py-4 rounded-full font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-[#2a2a2a] transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Styling
                </>
              )}
            </button>

            {error && (
              <p className="text-red-500 text-[10px] font-bold uppercase text-center">{error}</p>
            )}
          </div>
        </section>

        {/* Results Section */}
        <section className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!result && !loading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-[#1a1a1a]/5 rounded-[48px]"
              >
                <div className="w-16 h-16 bg-[#f5f2ed] rounded-full flex items-center justify-center">
                  <Palette className="w-8 h-8 text-[#1a1a1a]/20" />
                </div>
                <div className="space-y-1">
                  <p className="font-serif italic text-lg opacity-40">Your styling guide will appear here</p>
                  <p className="text-xs opacity-30 uppercase tracking-widest">Input your product details to begin</p>
                </div>
              </motion.div>
            ) : loading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-6"
              >
                <div className="relative">
                  <div className="w-24 h-24 border-2 border-[#5A5A40]/20 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-[#5A5A40] animate-spin" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="font-serif italic text-xl">Curating your set...</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] opacity-40">Researching color harmonies & prop textures</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                {/* Color Swatches */}
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <h3 className="text-[10px] uppercase tracking-widest font-bold opacity-50">Color Palette</h3>
                      <p className="font-serif text-2xl italic">{harmony} Harmony</p>
                    </div>
                    <div className="flex gap-1">
                      {result?.colorPalette.map((c, i) => (
                        <div 
                          key={i} 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: c.hex }} 
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {result?.colorPalette.map((color, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative"
                      >
                        <div 
                          className="aspect-[3/4] rounded-2xl shadow-sm transition-transform group-hover:scale-[1.02]"
                          style={{ backgroundColor: color.hex }}
                        />
                        <div className="mt-3 space-y-0.5">
                          <p className="text-[10px] font-bold uppercase tracking-tight">{color.name}</p>
                          <p className="text-[10px] opacity-50 font-mono">{color.hex}</p>
                          <p className="text-[9px] italic opacity-40">{color.role}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Backgrounds & Props */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[32px] border border-[#1a1a1a]/5 space-y-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#f5f2ed] rounded-full flex items-center justify-center">
                        <Palette className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs uppercase tracking-widest font-bold">Backgrounds</h3>
                    </div>
                    <ul className="space-y-3">
                      {result?.backgroundSuggestions.map((bg, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#5A5A40]" />
                          <span className="opacity-80">{bg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white p-8 rounded-[32px] border border-[#1a1a1a]/5 space-y-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#f5f2ed] rounded-full flex items-center justify-center">
                        <Package className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs uppercase tracking-widest font-bold">Prop Checklist</h3>
                    </div>
                    <div className="space-y-6">
                      {result?.propSuggestions.map((cat, i) => (
                        <div key={i} className="space-y-2">
                          <p className="text-[10px] font-bold uppercase opacity-40">{cat.category}</p>
                          <div className="flex flex-wrap gap-2">
                            {cat.items.map((item, j) => (
                              <span key={j} className="text-[11px] bg-[#f5f2ed] px-3 py-1 rounded-full opacity-80">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Styling Advice */}
                <div className="bg-[#1a1a1a] text-white p-10 rounded-[48px] space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                  <div className="flex items-center gap-2 relative z-10">
                    <Info className="w-4 h-4 text-[#5A5A40]" />
                    <h3 className="text-xs uppercase tracking-widest font-bold opacity-60">Stylist's Note</h3>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none relative z-10">
                    <div className="font-serif text-lg italic leading-relaxed opacity-90">
                      <Markdown>{result?.stylingAdvice}</Markdown>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-white/10 flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-[#5A5A40]" />
                    </div>
                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Ready for Production</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a]/10 py-12 px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2 text-center md:text-left">
            <p className="text-xs font-bold uppercase tracking-widest opacity-40">SetStyle Assistant</p>
            <p className="text-[10px] opacity-30">© 2026 Professional Photography Tools. Built for Creatives.</p>
          </div>
          <div className="flex gap-6">
            <button className="w-8 h-8 rounded-full border border-[#1a1a1a]/10 flex items-center justify-center hover:bg-[#1a1a1a] hover:text-white transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="px-6 py-2 rounded-full border border-[#1a1a1a]/10 text-[10px] font-bold uppercase tracking-widest hover:bg-[#1a1a1a] hover:text-white transition-all">
              Save Guide
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
