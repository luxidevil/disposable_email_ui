import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Loader2, CheckCircle, XCircle, Download } from "lucide-react";

const YTPremium = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; data: any } | null>(null);

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

  const handleDownload = () => {
    if (!result || !result.success) return;
    const content = typeof result.data === "string" ? result.data : JSON.stringify(result.data, null, 2);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yt-premium-${token.trim().slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-400 font-medium">Success</span>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                </div>
                <pre className="bg-gray-950 rounded-lg p-4 text-gray-300 text-sm overflow-x-auto max-h-96 overflow-y-auto font-mono whitespace-pre-wrap break-all">
                  {typeof result.data === "string" ? result.data : JSON.stringify(result.data, null, 2)}
                </pre>
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
