import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Lock,
  LogOut,
  Search,
  Mail,
  Clock,
  Download,
  AlertCircle,
  Gift,
  CheckCircle2,
  Calendar,
  Loader2,
  FileText,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from "xlsx";

interface EmailAttachment {
  filename: string;
  mimeType: string;
  base64Data: string;
  sizeBytes: number;
}

interface GiftCardRow {
  brand: string;
  value: string;
  code: string;
  validity: string;
  receivedAt: string;
  attachments: EmailAttachment[];
}

interface ScanResult {
  totalFound: number;
  byValue: Record<string, GiftCardRow[]>;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

function downloadAttachment(
  base64Data: string,
  filename: string,
  mimeType: string
) {
  const blob = base64ToBlob(base64Data, mimeType);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function LoginView({
  onLogin,
}: {
  onLogin: (password: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg("Password cannot be empty.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sudoPassword: password }),
      });
      if (res.ok) {
        onLogin(password);
      } else {
        setErrorMsg("Invalid password. Access denied.");
      }
    } catch {
      setErrorMsg("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 p-8 rounded-3xl shadow-2xl shadow-black/50">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center mb-4 border border-emerald-500/20 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Restricted Access
            </h1>
            <p className="text-gray-400 text-sm">
              Enter the sudo password to access the Gift Card Scanner.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type="password"
                  placeholder="Enter sudo password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg("");
                  }}
                  className={`pl-11 bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:bg-gray-800 ${
                    errorMsg
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                  autoFocus
                  disabled={loading}
                />
              </div>
              {errorMsg && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 pl-1"
                >
                  {errorMsg}
                </motion.p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Authenticate"
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function ScannerView({
  sudoPassword,
  onLogout,
}: {
  sudoPassword: string;
  onLogout: () => void;
}) {
  const { toast } = useToast();
  const [senderEmail, setSenderEmail] = useState("no-reply@blinkit.com");
  const [startTimeIST, setStartTimeIST] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a sender email address.",
      });
      return;
    }

    setScanning(true);
    setScanResult(null);

    try {
      const res = await fetch("/api/gift-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sudoPassword, senderEmail, startTimeIST }),
      });

      if (res.status === 401) {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: "Invalid sudo password. Please login again.",
        });
        onLogout();
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || "Scan failed");
      }

      const result: ScanResult = await res.json();
      setScanResult(result);
      toast({
        title: "Scan Complete",
        description: `Found ${result.totalFound} gift cards successfully.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setScanning(false);
    }
  };

  const handleDownloadExcel = () => {
    if (!scanResult || scanResult.totalFound === 0) return;

    const wb = XLSX.utils.book_new();
    const sortedValues = Object.keys(scanResult.byValue).sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, "")) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, "")) || 0;
      return numA - numB;
    });

    sortedValues.forEach((valueGroup) => {
      const rows = scanResult.byValue[valueGroup];
      const sheetData = rows.map((row) => ({
        Brand: row.brand,
        "Gift Card Value": row.value,
        Code: row.code,
        Validity: row.validity,
        "Received At (IST)": row.receivedAt,
      }));

      const ws = XLSX.utils.json_to_sheet(sheetData);
      ws["!cols"] = [
        { wch: 20 },
        { wch: 15 },
        { wch: 25 },
        { wch: 15 },
        { wch: 25 },
      ];

      const safeSheetName = valueGroup
        .replace(/[\\/*?:[\]]/g, "")
        .substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName || "Unknown");
    });

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `blinkit-giftcards-${dateStr}.xlsx`);
  };

  const handleDownloadCSV = () => {
    if (!scanResult || scanResult.totalFound === 0) return;
    const headers = ["Brand", "Gift Card Value", "Code", "Validity", "Received At (IST)"];
    const allRows: string[][] = [headers];
    const sortedValues = Object.keys(scanResult.byValue).sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, "")) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, "")) || 0;
      return numA - numB;
    });
    sortedValues.forEach((valueGroup) => {
      scanResult.byValue[valueGroup].forEach((row) => {
        allRows.push([
          row.brand,
          row.value,
          row.code,
          row.validity,
          row.receivedAt,
        ].map(v => `"${(v || "").replace(/"/g, '""')}"`));
      });
    });
    const csvContent = allRows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().split("T")[0];
    a.download = `blinkit-giftcards-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const allAttachments = scanResult
    ? Object.values(scanResult.byValue)
        .flat()
        .flatMap((row) => row.attachments || [])
    : [];

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 max-w-7xl mx-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <header className="flex items-center justify-between mb-8 pb-6 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <Gift className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              Gift Card Scanner
            </h1>
            <p className="text-xs text-gray-400">Automated Extraction Tool</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="text-gray-400 hover:text-white border-gray-700"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </header>

      <div className="grid lg:grid-cols-[350px_1fr] gap-8 items-start">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-6 shadow-xl shadow-black/20 sticky top-8"
        >
          <h2 className="text-lg font-semibold mb-6 flex items-center text-white">
            <Search className="w-5 h-5 mr-2 text-emerald-400" />
            Scan Parameters
          </h2>

          <form onSubmit={handleScan} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="gs-senderEmail" className="text-gray-300">
                Sender Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="gs-senderEmail"
                  placeholder="e.g. no-reply@blinkit.com"
                  className="pl-10 bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-500"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="gs-startTime"
                className="flex items-center justify-between text-gray-300"
              >
                <span>Scan From</span>
                <span className="text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                  IST Time
                </span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="gs-startTime"
                  type="datetime-local"
                  className="pl-10 bg-gray-800/50 border-gray-700/50 text-white [color-scheme:dark]"
                  value={startTimeIST}
                  onChange={(e) => setStartTimeIST(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled={scanning}
            >
              {scanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning Inbox...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </form>
        </motion.div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!scanning && !scanResult && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[400px] flex flex-col items-center justify-center border border-dashed border-gray-700/50 rounded-2xl bg-gray-900/30 text-center p-8"
              >
                <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
                  <Gift className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Ready to Scan
                </h3>
                <p className="text-sm text-gray-400 max-w-sm">
                  Configure the parameters on the left and hit generate to
                  extract gift cards from Gmail.
                </p>
              </motion.div>
            )}

            {scanning && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[400px] flex flex-col items-center justify-center border border-gray-700/50 rounded-2xl bg-gray-900/50 text-center p-8"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                  <Loader2 className="w-12 h-12 text-emerald-400 animate-spin relative z-10" />
                </div>
                <h3 className="text-lg font-medium text-white animate-pulse">
                  Scanning Emails...
                </h3>
                <p className="text-sm text-gray-400 mt-2">
                  This might take a few moments depending on inbox size.
                </p>
              </motion.div>
            )}

            {scanResult && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
                  <div>
                    <h2 className="text-2xl font-bold text-emerald-400 flex items-center">
                      <CheckCircle2 className="w-6 h-6 mr-2" />
                      Scan Complete
                    </h2>
                    <p className="text-sm text-emerald-300/80 mt-1">
                      Extracted{" "}
                      <strong className="text-white">
                        {scanResult.totalFound}
                      </strong>{" "}
                      valid gift cards.
                      {allAttachments.length > 0 && (
                        <span className="ml-2">
                          <Paperclip className="w-3 h-3 inline mr-1" />
                          {allAttachments.length} attachment
                          {allAttachments.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      onClick={handleDownloadExcel}
                      disabled={scanResult.totalFound === 0}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Excel (.xlsx)
                    </Button>
                    <Button
                      onClick={handleDownloadCSV}
                      disabled={scanResult.totalFound === 0}
                      variant="outline"
                      className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                  </div>
                </div>

                {scanResult.totalFound === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 border border-gray-700/50 rounded-2xl bg-gray-900/50">
                    <AlertCircle className="w-12 h-12 text-gray-500 mb-4" />
                    <p className="text-lg font-medium text-white">
                      No matching emails found
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Try adjusting your start time or sender email.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(scanResult.byValue)
                      .sort(
                        (a, b) =>
                          (parseInt(a[0].replace(/[^0-9]/g, "")) || 0) -
                          (parseInt(b[0].replace(/[^0-9]/g, "")) || 0)
                      )
                      .map(([value, rows], groupIndex) => (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: groupIndex * 0.1 }}
                          key={value}
                          className="bg-gray-900/50 border border-gray-700/50 rounded-2xl overflow-hidden shadow-lg shadow-black/10"
                        >
                          <div className="bg-gray-800/30 px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
                            <h3 className="font-semibold text-lg flex items-center text-white">
                              <span className="w-2 h-6 bg-emerald-500 rounded-full mr-3" />
                              {value} Denomination
                            </h3>
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-300">
                              {rows.length}{" "}
                              {rows.length === 1 ? "card" : "cards"}
                            </span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                              <thead className="bg-gray-800/10 text-gray-400 text-xs uppercase">
                                <tr>
                                  <th className="px-6 py-4 font-medium">
                                    Brand
                                  </th>
                                  <th className="px-6 py-4 font-medium">
                                    Code
                                  </th>
                                  <th className="px-6 py-4 font-medium">
                                    Validity
                                  </th>
                                  <th className="px-6 py-4 font-medium">
                                    Received (IST)
                                  </th>
                                  <th className="px-6 py-4 font-medium">
                                    Files
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-700/50">
                                {rows.map((row, i) => (
                                  <tr
                                    key={i}
                                    className="hover:bg-gray-800/20 transition-colors"
                                  >
                                    <td className="px-6 py-4 font-medium text-white">
                                      {row.brand}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-emerald-400 bg-emerald-500/5">
                                      {row.code}
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="flex items-center text-gray-400">
                                        <Calendar className="w-3 h-3 mr-1.5" />
                                        {row.validity}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">
                                      {row.receivedAt}
                                    </td>
                                    <td className="px-6 py-4">
                                      {row.attachments &&
                                      row.attachments.length > 0 ? (
                                        <div className="flex flex-col gap-1">
                                          {row.attachments.map((att, j) => (
                                            <button
                                              key={j}
                                              onClick={() =>
                                                downloadAttachment(
                                                  att.base64Data,
                                                  att.filename,
                                                  att.mimeType
                                                )
                                              }
                                              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                                            >
                                              <FileText className="w-3 h-3" />
                                              {att.filename}
                                            </button>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-xs text-gray-600">
                                          -
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function GiftScanner() {
  const [sudoPassword, setSudoPassword] = useState<string | null>(null);

  if (!sudoPassword) {
    return <LoginView onLogin={(pwd) => setSudoPassword(pwd)} />;
  }

  return (
    <ScannerView
      sudoPassword={sudoPassword}
      onLogout={() => setSudoPassword(null)}
    />
  );
}
