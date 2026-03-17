import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Loader2, CheckCircle, XCircle, ExternalLink, Copy, Check } from "lucide-react";

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
      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      setResult({ success: true, data });
    } catch (err) {
      setResult({ success: false, data: "Failed to fetch data. Please check your token and try again." });
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
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 via-red-950 to-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Services
        </button>

        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="bg-red-600 rounded-full p-4">
              <Play className="h-10 w-10 text-white fill-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2">YouTube Premium</h1>
          <p className="text-gray-400 text-lg">Enter your token to get access</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-xl p-6">
          <label className="block text-gray-300 text-sm font-medium mb-2">Your Token</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={token}
              onChange={(e) => { setToken(e.target.value); setResult(null); }}
              placeholder="Paste your token here"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
            />
            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Get Access"
              )}
            </button>
          </div>
        </form>

        {result && (
          <div className={`mt-6 rounded-xl p-5 border ${result.success ? "bg-gray-900/80 border-green-700/50" : "bg-red-950/50 border-red-700/50"}`}>
            {result.success ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-400 font-medium">Your access link is ready</span>
                </div>

                {getLink() ? (
                  <div className="space-y-4">
                    <a
                      href={getLink()!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl text-lg font-semibold transition"
                    >
                      <ExternalLink className="h-5 w-5" />
                      Open YouTube Premium
                    </a>
                    <button
                      onClick={handleCopy}
                      className="flex items-center justify-center gap-2 w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-xl text-sm font-medium transition border border-gray-700"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-green-400" />
                          <span className="text-green-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Link
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <pre className="bg-gray-950 rounded-lg p-4 text-gray-300 text-sm overflow-x-auto max-h-96 overflow-y-auto font-mono whitespace-pre-wrap break-all">
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
    </div>
  );
};

export default YTPremium;
