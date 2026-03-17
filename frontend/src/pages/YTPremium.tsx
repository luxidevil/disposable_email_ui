import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Loader2, CheckCircle, XCircle, Download } from "lucide-react";

const TOKENS = [
  { id: 1, token: "5f99b816c0b68ac6" },
  { id: 2, token: "c509b25d799824c6" },
  { id: 3, token: "7b58cc5c259ad2f4" },
  { id: 4, token: "68f914d03663e0cf" },
  { id: 5, token: "059fd5496cc2e4df" },
];

const YTPremium = () => {
  const navigate = useNavigate();
  const [loadingToken, setLoadingToken] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { success: boolean; data: any }>>({});

  const handleGetAccess = async (token: string) => {
    setLoadingToken(token);
    try {
      const apiUrl = window.location.hostname === "localhost"
        ? `http://localhost:3001/api/yt-token/${token}`
        : `/api/yt-token/${token}`;

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

      setResults((prev) => ({ ...prev, [token]: { success: true, data } }));
    } catch (err) {
      setResults((prev) => ({ ...prev, [token]: { success: false, data: "Failed to fetch data. Try again." } }));
    } finally {
      setLoadingToken(null);
    }
  };

  const handleDownload = (token: string, data: any) => {
    const content = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yt-premium-${token.slice(0, 6)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 via-red-950 to-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Services
        </button>

        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-red-600 rounded-full p-4">
              <Play className="h-10 w-10 text-white fill-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2">YouTube Premium</h1>
          <p className="text-gray-400 text-lg">Get access to YouTube Premium accounts</p>
        </div>

        <div className="space-y-4">
          {TOKENS.map(({ id, token }) => (
            <div
              key={token}
              className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-xl p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="bg-red-600/20 rounded-lg p-3">
                  <Play className="h-5 w-5 text-red-500 fill-red-500" />
                </div>
                <div>
                  <p className="text-white font-semibold">Slot #{id}</p>
                  <p className="text-gray-500 text-sm font-mono">{token}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {results[token] ? (
                  results[token].success ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <button
                        onClick={() => handleDownload(token, results[token].data)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-red-400 text-sm">{results[token].data}</span>
                      <button
                        onClick={() => handleGetAccess(token)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        Retry
                      </button>
                    </div>
                  )
                ) : (
                  <button
                    onClick={() => handleGetAccess(token)}
                    disabled={loadingToken === token}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-wait text-white px-6 py-2 rounded-lg text-sm font-medium transition"
                  >
                    {loadingToken === token ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Get Access"
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-4">
          <p className="text-yellow-400 text-sm text-center">
            Each slot provides access to a unique YouTube Premium account. Click "Get Access" to retrieve your credentials.
          </p>
        </div>
      </div>
    </div>
  );
};

export default YTPremium;
