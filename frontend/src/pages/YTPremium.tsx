import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle, XCircle, ExternalLink, Copy, Check, Shield, Clock, Star, Zap } from "lucide-react";

const YTPremium = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; data: any } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);
    try {
      const apiUrl = window.location.hostname === "localhost"
        ? `http://localhost:3001/api/yt-token/${trimmed}`
        : `/api/yt-token/${trimmed}`;

      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error("Failed to fetch");

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      setResult({ success: true, data });
    } catch (err) {
      setResult({ success: false, data: "Invalid or expired token. Please check and try again." });
    } finally {
      setLoading(false);
    }
  };

  const getLink = () => {
    if (!result || !result.success) return null;
    if (typeof result.data === "object" && result.data.Link) return result.data.Link;
    if (typeof result.data === "string" && result.data.startsWith("http")) return result.data;
    return null;
  };

  const handleCopy = () => {
    const link = getLink();
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-[#0f0f0f]">
      <nav className="w-full border-b border-gray-800 bg-[#0f0f0f]/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 90 20" className="h-5 fill-white">
              <path d="M27.97 3.12V18.97h-2.54l-7-11.72v11.72h-2.76V3.12h2.54l7 11.72V3.12h2.76zm6.8 16.13c-1.37 0-2.47-.45-3.3-1.36-.83-.9-1.24-2.08-1.24-3.52 0-1.5.38-2.7 1.15-3.6.77-.9 1.8-1.35 3.09-1.35 1.2 0 2.17.4 2.9 1.2.72.8 1.08 1.86 1.08 3.18v.84h-5.6c.05.83.27 1.46.66 1.9.4.43.94.65 1.63.65.53 0 .97-.1 1.32-.3.35-.2.65-.5.9-.9l1.6 1.08c-.78 1.26-2 1.9-3.62 1.9h-.57zm-.3-7.6c-.54 0-.97.19-1.3.56-.32.37-.52.9-.6 1.58h3.66c-.03-.67-.2-1.2-.52-1.56-.32-.38-.73-.57-1.23-.57zm9.97 7.6c-1 0-1.87-.22-2.6-.66-.73-.44-1.1-1.03-1.1-1.77 0-.6.2-1.1.6-1.5.4-.4.93-.66 1.6-.8v-.07c-.4-.15-.72-.38-.97-.7-.25-.3-.37-.66-.37-1.06 0-.53.2-.98.58-1.33.4-.36.82-.6 1.28-.72v-.07c-.56-.2-1.02-.55-1.38-1.06-.36-.5-.54-1.08-.54-1.74 0-1.02.37-1.83 1.12-2.44.75-.6 1.7-.9 2.86-.9.43 0 .84.05 1.23.15h3.35v1.87h-1.63c.3.4.45.92.45 1.55 0 .97-.36 1.74-1.07 2.32-.72.57-1.64.86-2.78.86-.42 0-.8-.05-1.14-.15-.33.2-.5.47-.5.82 0 .47.47.7 1.4.7h1.76c1.06 0 1.9.24 2.5.73.6.5.9 1.16.9 2 0 1.05-.44 1.88-1.3 2.5-.88.6-2.04.92-3.5.92zm.38-2.02c.7 0 1.27-.13 1.72-.4.45-.25.67-.6.67-1.04 0-.35-.14-.6-.42-.77-.28-.17-.7-.25-1.26-.25h-1.27c-.35 0-.67.1-.95.28-.28.2-.42.44-.42.74 0 .37.2.68.58.93.38.24.83.37 1.35.5zm-.26-7.22c.47 0 .85-.16 1.13-.47.28-.32.43-.74.43-1.26 0-.54-.14-.97-.43-1.28-.28-.32-.66-.47-1.13-.47-.48 0-.87.16-1.15.47-.28.3-.43.73-.43 1.27 0 .53.15.95.43 1.27.28.3.67.47 1.15.47z"/>
            </svg>
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">PREMIUM</span>
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white text-sm transition"
          >
            Back to Home
          </button>
        </div>
      </nav>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/10 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center relative">
          <div className="inline-flex items-center gap-2 bg-red-600/10 border border-red-600/30 rounded-full px-4 py-1.5 mb-6">
            <Shield className="h-4 w-4 text-red-500" />
            <span className="text-red-400 text-sm font-medium">Official YouTube Premium Partner</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
            YouTube Premium
          </h1>
          <p className="text-xl text-gray-400 mb-2">1 Year Subscription</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-gray-500 line-through text-2xl">$139.99</span>
            <span className="text-4xl font-bold text-white">$0</span>
            <span className="bg-green-500/20 text-green-400 text-sm font-bold px-2 py-1 rounded">100% OFF</span>
          </div>
          <p className="text-gray-500 text-sm mt-3">Exclusive partnership — free activation for our members & bulk sellers</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: <Zap className="h-5 w-5 text-yellow-400" />, title: "Ad-Free", desc: "No interruptions" },
            { icon: <Star className="h-5 w-5 text-blue-400" />, title: "YouTube Music", desc: "Premium included" },
            { icon: <Clock className="h-5 w-5 text-green-400" />, title: "12 Months", desc: "Full year access" },
            { icon: <Shield className="h-5 w-5 text-red-400" />, title: "Guaranteed", desc: "Instant activation" },
          ].map((item, i) => (
            <div key={i} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 text-center">
              <div className="flex justify-center mb-2">{item.icon}</div>
              <p className="text-white font-semibold text-sm">{item.title}</p>
              <p className="text-gray-500 text-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16">
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 md:p-8">
          <h2 className="text-white text-xl font-bold mb-1">Activate Your Subscription</h2>
          <p className="text-gray-500 text-sm mb-6">Paste the token you received after purchase to activate your YouTube Premium subscription.</p>

          <form onSubmit={handleSubmit}>
            <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Activation Token</label>
            <input
              type="text"
              value={token}
              onChange={(e) => { setToken(e.target.value); setResult(null); }}
              placeholder="e.g. 5f99b816c0b68ac6"
              className="w-full bg-[#0f0f0f] border border-gray-700 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-lg mb-4"
            />
            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-xl text-lg font-bold transition"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Activating...
                </>
              ) : (
                "Activate Now"
              )}
            </button>
          </form>

          {result && (
            <div className={`mt-6 rounded-xl p-5 border ${result.success ? "bg-green-950/30 border-green-700/50" : "bg-red-950/30 border-red-700/50"}`}>
              {result.success ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-400 font-semibold">Activation Successful!</span>
                  </div>

                  {getLink() ? (
                    <div className="space-y-3">
                      <p className="text-gray-400 text-sm">Click below to sign in and enjoy your YouTube Premium subscription.</p>
                      <a
                        href={getLink()!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl text-lg font-bold transition"
                      >
                        <ExternalLink className="h-5 w-5" />
                        Sign In to YouTube Premium
                      </a>
                      <button
                        onClick={handleCopy}
                        className="flex items-center justify-center gap-2 w-full bg-[#0f0f0f] hover:bg-gray-800 text-gray-400 py-3 rounded-xl text-sm font-medium transition border border-gray-700"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 text-green-400" />
                            <span className="text-green-400">Link Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy Activation Link
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <pre className="bg-[#0f0f0f] rounded-lg p-4 text-gray-300 text-sm overflow-x-auto max-h-96 overflow-y-auto font-mono whitespace-pre-wrap break-all">
                      {typeof result.data === "string" ? result.data : JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-red-400">{result.data}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-xs">
            Official YouTube Premium distribution partner. YouTube and YouTube Premium are trademarks of Google LLC. Bulk licensing available.
          </p>
        </div>
      </div>
    </div>
  );
};

export default YTPremium;
