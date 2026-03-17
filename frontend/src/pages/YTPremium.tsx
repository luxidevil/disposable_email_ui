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
            <span className="text-white text-xl font-bold tracking-tight">YouTube</span>
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

        <div className="mt-8 bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 flex items-center justify-center gap-3">
          <svg className="h-5 w-5 text-[#26A5E4] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          <p className="text-gray-400 text-sm">
            Need help? Contact us on Telegram: <a href="https://t.me/Xebecdrockz" target="_blank" rel="noopener noreferrer" className="text-[#26A5E4] hover:text-[#4dc1f5] font-semibold transition">@Xebecdrockz</a>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-600 text-xs">
            Official YouTube Premium distribution partner. YouTube and YouTube Premium are trademarks of Google LLC. Bulk licensing available.
          </p>
        </div>
      </div>
    </div>
  );
};

export default YTPremium;
