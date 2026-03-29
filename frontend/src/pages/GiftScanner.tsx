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
  RefreshCw,
  Gamepad2,
  ShoppingBag,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from "xlsx";

// ── Types ──────────────────────────────────────────────────────────────────

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

interface RazorpayRefundRow {
  rrn: string;
  refundAmount: string;
  refundId: string;
  initiatedOn: string;
  paymentAmount: string;
  paymentId: string;
  paymentVia: string;
  mobileNumber: string;
  email: string;
  status: "successful" | "initiated";
  subject: string;
  receivedAt: string;
}

interface RazorpayPaymentRow {
  merchant: string;
  amount: string;
  paymentId: string;
  method: string;
  paidOn: string;
  email: string;
  mobileNumber: string;
  subject: string;
  receivedAt: string;
}

interface RazorpayScanResult {
  totalFound: number;
  refunds: RazorpayRefundRow[];
  completedRefunds: RazorpayRefundRow[];
  pendingRefunds: RazorpayRefundRow[];
  duplicatesRemoved: number;
  payments: RazorpayPaymentRow[];
}

interface GamesTheShopPdf {
  filename: string;
  mimeType: string;
  base64Data: string;
  sizeBytes: number;
  subject: string;
  receivedAt: string;
}

interface GamesTheShopScanResult {
  totalFound: number;
  pdfs: GamesTheShopPdf[];
}

interface JioGamesOrderRow {
  subject: string;
  gameName: string;
  orderId: string;
  amount: string;
  toEmail: string;
  receivedAt: string;
  attachments: EmailAttachment[];
}

interface JioGamesScanResult {
  totalFound: number;
  orders: JioGamesOrderRow[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const RAZORPAY_SENDER = "no-reply@razorpay.com";
const JIOGAMES_SENDER = "orders@jiogames.com";
const GAMESTHESHOP_SENDER = "no-reply@gamestheshop.com";

function isRazorpay(email: string) {
  return email.trim().toLowerCase() === RAZORPAY_SENDER;
}

function isJioGames(email: string) {
  return email.trim().toLowerCase() === JIOGAMES_SENDER;
}

function isGamesTheShop(email: string) {
  return email.trim().toLowerCase() === GAMESTHESHOP_SENDER;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

function downloadAttachment(base64Data: string, filename: string, mimeType: string) {
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

// ── Login View ─────────────────────────────────────────────────────────────

function LoginView({ onLogin }: { onLogin: (password: string) => void }) {
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { setErrorMsg("Password cannot be empty."); return; }
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sudoPassword: password }),
      });
      if (res.ok) { onLogin(password); }
      else { setErrorMsg("Invalid password. Access denied."); }
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
            <h1 className="text-3xl font-bold text-white mb-2">Restricted Access</h1>
            <p className="text-gray-400 text-sm">Enter the sudo password to access the Gift Card Scanner.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type="password"
                  placeholder="Enter sudo password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMsg(""); }}
                  className={`pl-11 bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:bg-gray-800 ${errorMsg ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  autoFocus
                  disabled={loading}
                />
              </div>
              {errorMsg && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-400 pl-1">
                  {errorMsg}
                </motion.p>
              )}
            </div>
            <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" size="lg" disabled={loading}>
              {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</>) : "Authenticate"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ── Razorpay Results Table ─────────────────────────────────────────────────

function RazorpayResults({
  result,
  onDownloadPaymentsExcel,
  onDownloadRefundsExcel,
  onDownloadCSV,
}: {
  result: RazorpayScanResult;
  onDownloadPaymentsExcel: () => void;
  onDownloadRefundsExcel: () => void;
  onDownloadCSV: () => void;
}) {
  const [tab, setTab] = useState<"payments" | "refunds" | "pending">(
    (result.payments?.length ?? 0) > 0 ? "payments" : "refunds"
  );

  return (
    <motion.div key="razorpay-results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Summary bar */}
      <div className="flex flex-col gap-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-blue-400 flex items-center">
              <CheckCircle2 className="w-6 h-6 mr-2" />Razorpay Scan Complete
            </h2>
            <p className="text-sm text-blue-300/80 mt-1 flex flex-wrap gap-x-3 gap-y-1 items-center">
              {(result.payments?.length ?? 0) > 0 && <><strong className="text-white">{result.payments.length}</strong> payment{result.payments.length !== 1 ? "s" : ""}</>}
              {(result.payments?.length ?? 0) > 0 && (result.refunds?.length ?? 0) > 0 && <span className="text-blue-500">·</span>}
              {(result.refunds?.length ?? 0) > 0 && <><strong className="text-white">{result.refunds.length}</strong> refund{result.refunds.length !== 1 ? "s" : ""}</>}
              {(result.duplicatesRemoved ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-medium">
                  {result.duplicatesRemoved} duplicate{result.duplicatesRemoved !== 1 ? "s" : ""} merged
                </span>
              )}
              {(result.pendingRefunds?.length ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-medium">
                  {result.pendingRefunds.length} pending
                </span>
              )}
              {result.totalFound === 0 && "No emails found"}
            </p>
          </div>
        </div>
        {/* Export buttons */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-blue-500/20">
          <p className="w-full text-xs text-blue-300/60 font-medium uppercase tracking-wider mb-1">Export</p>
          {(result.payments?.length ?? 0) > 0 && (
            <Button onClick={onDownloadPaymentsExcel} className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 text-sm">
              <Download className="w-4 h-4 mr-2" />Successful Payments (.xlsx)
            </Button>
          )}
          {(result.refunds?.length ?? 0) > 0 && (
            <Button onClick={onDownloadRefundsExcel} className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 text-sm">
              <Download className="w-4 h-4 mr-2" />Refunds (.xlsx)
            </Button>
          )}
          <Button onClick={onDownloadCSV} disabled={result.totalFound === 0} variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 text-sm">
            <Download className="w-4 h-4 mr-2" />CSV (All)
          </Button>
        </div>
        {(result.refunds?.length ?? 0) > 0 && (
          <p className="text-xs text-blue-300/50">
            Refunds Excel: <strong className="text-blue-300/80">Sheet 1</strong> — {result.completedRefunds?.length ?? 0} completed (both emails received) · <strong className="text-blue-300/80">Sheet 2</strong> — {result.pendingRefunds?.length ?? 0} initiated only (awaiting completion)
          </p>
        )}
      </div>

      {result.totalFound === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-gray-700/50 rounded-2xl bg-gray-900/50">
          <AlertCircle className="w-12 h-12 text-gray-500 mb-4" />
          <p className="text-lg font-medium text-white">No Razorpay emails found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting the start time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tabs */}
          {((result.payments?.length ?? 0) > 0 || (result.pendingRefunds?.length ?? 0) > 0) && (result.refunds?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {(result.payments?.length ?? 0) > 0 && (
                <button onClick={() => setTab("payments")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === "payments" ? "bg-blue-500 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
                  Payments ({result.payments.length})
                </button>
              )}
              <button onClick={() => setTab("refunds")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === "refunds" ? "bg-blue-500 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
                Refunds / RRN ({result.refunds.length})
              </button>
              {(result.pendingRefunds?.length ?? 0) > 0 && (
                <button onClick={() => setTab("pending")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === "pending" ? "bg-orange-500 text-white" : "bg-gray-800 text-orange-400 hover:text-white"}`}>
                  Pending Only ({result.pendingRefunds.length})
                </button>
              )}
            </div>
          )}

          {/* Payments table */}
          {((result.payments?.length ?? 0) > 0 && (tab === "payments" || (result.refunds?.length ?? 0) === 0)) && (
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl overflow-hidden shadow-lg shadow-black/10">
              <div className="bg-gray-800/30 px-6 py-4 border-b border-gray-700/50 flex items-center gap-3">
                <span className="w-2 h-6 bg-green-500 rounded-full" />
                <h3 className="font-semibold text-lg text-white">Payment Confirmations</h3>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-300 ml-auto">
                  {result.payments.length} record{result.payments.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-800/10 text-gray-400 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-4 font-medium whitespace-nowrap">Merchant</th>
                      <th className="px-4 py-4 font-medium whitespace-nowrap">Amount</th>
                      <th className="px-4 py-4 font-medium whitespace-nowrap">Payment ID</th>
                      <th className="px-4 py-4 font-medium whitespace-nowrap">Method</th>
                      <th className="px-4 py-4 font-medium whitespace-nowrap">Paid On</th>
                      <th className="px-4 py-4 font-medium whitespace-nowrap">Email</th>
                      <th className="px-4 py-4 font-medium whitespace-nowrap">Mobile</th>
                      <th className="px-4 py-4 font-medium whitespace-nowrap">Received (IST)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {result.payments.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-800/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{row.merchant || "—"}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-400 whitespace-nowrap">{row.amount || "—"}</td>
                        <td className="px-4 py-3 font-mono text-blue-400 bg-blue-500/5 whitespace-nowrap">{row.paymentId || "—"}</td>
                        <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{row.method || "—"}</td>
                        <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{row.paidOn || "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs break-all">{row.email || "—"}</td>
                        <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{row.mobileNumber || "—"}</td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{row.receivedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Refunds / Pending table */}
          {((result.refunds?.length ?? 0) > 0 && (tab === "refunds" || tab === "pending" || (result.payments?.length ?? 0) === 0)) && (() => {
            const rows = tab === "pending" && (result.pendingRefunds?.length ?? 0) > 0
              ? result.pendingRefunds
              : result.refunds;
            const isPending = tab === "pending";
            return (
              <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl overflow-hidden shadow-lg shadow-black/10">
                <div className={`bg-gray-800/30 px-6 py-4 border-b border-gray-700/50 flex items-center gap-3`}>
                  <span className={`w-2 h-6 rounded-full ${isPending ? "bg-orange-500" : "bg-blue-500"}`} />
                  <h3 className="font-semibold text-lg text-white">
                    {isPending ? "Pending Refunds (Single Occurrence)" : "Refund Records — Deduplicated"}
                  </h3>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-300 ml-auto">
                    {rows.length} record{rows.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-800/10 text-gray-400 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-4 font-medium whitespace-nowrap">Status</th>
                        <th className="px-4 py-4 font-medium whitespace-nowrap">Refund Amt</th>
                        <th className="px-4 py-4 font-medium whitespace-nowrap">Refund ID</th>
                        <th className="px-4 py-4 font-medium whitespace-nowrap">RRN (Tracking)</th>
                        <th className="px-4 py-4 font-medium whitespace-nowrap">Initiated On</th>
                        <th className="px-4 py-4 font-medium whitespace-nowrap">Payment Amt</th>
                        <th className="px-4 py-4 font-medium whitespace-nowrap">Payment ID</th>
                        <th className="px-4 py-4 font-medium whitespace-nowrap">Payment Via</th>
                        <th className="px-4 py-4 font-medium whitespace-nowrap">Mobile</th>
                        <th className="px-4 py-4 font-medium whitespace-nowrap">Email</th>
                        <th className="px-4 py-4 font-medium whitespace-nowrap">Received (IST)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {rows.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-800/20 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            {row.status === "successful"
                              ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium">✓ Successful</span>
                              : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-medium">⏳ Initiated</span>
                            }
                          </td>
                          <td className="px-4 py-3 font-semibold text-emerald-400 whitespace-nowrap">{row.refundAmount || "—"}</td>
                          <td className="px-4 py-3 font-mono text-blue-400 bg-blue-500/5 whitespace-nowrap">{row.refundId || "—"}</td>
                          <td className="px-4 py-3 font-mono text-yellow-400 whitespace-nowrap">{row.rrn || "—"}</td>
                          <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{row.initiatedOn || "—"}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{row.paymentAmount || "—"}</td>
                          <td className="px-4 py-3 font-mono text-purple-400 whitespace-nowrap">{row.paymentId || "—"}</td>
                          <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{row.paymentVia || "—"}</td>
                          <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{row.mobileNumber || "—"}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs break-all">{row.email || "—"}</td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{row.receivedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </motion.div>
  );
}

// ── JioGames Results ───────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function JioGamesResults({
  result,
  onDownloadExcel,
  onDownloadCSV,
}: {
  result: JioGamesScanResult;
  onDownloadExcel: () => void;
  onDownloadCSV: () => void;
}) {
  const totalPdfs = result.orders.reduce((n, o) => n + o.attachments.length, 0);

  return (
    <motion.div key="jiogames-results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Summary bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6">
        <div>
          <h2 className="text-2xl font-bold text-orange-400 flex items-center">
            <CheckCircle2 className="w-6 h-6 mr-2" />JioGames Scan Complete
          </h2>
          <p className="text-sm text-orange-300/80 mt-1">
            Found <strong className="text-white">{result.totalFound}</strong> order email{result.totalFound !== 1 ? "s" : ""}
            {totalPdfs > 0 && <> · <strong className="text-white">{totalPdfs}</strong> PDF{totalPdfs !== 1 ? "s" : ""}</>}.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={onDownloadExcel} disabled={result.totalFound === 0} className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20">
            <Download className="w-4 h-4 mr-2" />Excel (.xlsx)
          </Button>
          <Button onClick={onDownloadCSV} disabled={result.totalFound === 0} variant="outline" className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
            <Download className="w-4 h-4 mr-2" />CSV
          </Button>
        </div>
      </div>

      {result.totalFound === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-gray-700/50 rounded-2xl bg-gray-900/50">
          <AlertCircle className="w-12 h-12 text-gray-500 mb-4" />
          <p className="text-lg font-medium text-white">No JioGames order emails found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting the start time.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {result.orders.map((order, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-gray-900/60 border border-gray-700/50 rounded-2xl p-5 flex flex-col gap-3 shadow-lg shadow-black/10 hover:border-orange-500/30 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4 text-orange-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm leading-tight truncate">{order.gameName || order.subject}</p>
                  {order.orderId && (
                    <p className="text-xs text-gray-500 font-mono mt-0.5">#{order.orderId}</p>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1 text-xs text-gray-400">
                {order.amount && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400 font-semibold">{order.amount}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span>{order.receivedAt}</span>
                </div>
                {order.toEmail && (
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 shrink-0" />
                    <span className="truncate">{order.toEmail}</span>
                  </div>
                )}
              </div>

              {/* PDFs */}
              {order.attachments.length > 0 ? (
                <div className="mt-auto pt-3 border-t border-gray-700/40 space-y-1.5">
                  {order.attachments.map((att, j) => (
                    <button
                      key={j}
                      onClick={() => downloadAttachment(att.base64Data, att.filename, att.mimeType)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-colors group text-left"
                    >
                      <FileText className="w-4 h-4 text-orange-400 shrink-0" />
                      <span className="text-xs text-orange-300 group-hover:text-orange-200 truncate flex-1 font-medium">{att.filename}</span>
                      {att.sizeBytes > 0 && (
                        <span className="text-[10px] text-gray-500 shrink-0">{formatBytes(att.sizeBytes)}</span>
                      )}
                      <Download className="w-3 h-3 text-orange-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-auto pt-3 border-t border-gray-700/40">
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <Paperclip className="w-3 h-3" />No attachments
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── GamesTheShop PDF Results ───────────────────────────────────────────────

function GamesTheShopResults({
  result,
}: {
  result: GamesTheShopScanResult;
}) {
  return (
    <motion.div key="gamestheshop-results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Summary bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6">
        <div>
          <h2 className="text-2xl font-bold text-purple-400 flex items-center">
            <CheckCircle2 className="w-6 h-6 mr-2" />GamesTheShop Scan Complete
          </h2>
          <p className="text-sm text-purple-300/80 mt-1">
            Found <strong className="text-white">{result.totalFound}</strong> PDF{result.totalFound !== 1 ? "s" : ""} across all emails.
          </p>
        </div>
      </div>

      {result.totalFound === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-gray-700/50 rounded-2xl bg-gray-900/50">
          <AlertCircle className="w-12 h-12 text-gray-500 mb-4" />
          <p className="text-lg font-medium text-white">No PDFs found</p>
          <p className="text-sm text-gray-400 mt-1">No emails from no-reply@gamestheshop.com with PDF attachments were found.</p>
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl overflow-hidden shadow-lg shadow-black/10">
          <div className="bg-gray-800/30 px-6 py-4 border-b border-gray-700/50 flex items-center gap-3">
            <span className="w-2 h-6 bg-purple-500 rounded-full" />
            <h3 className="font-semibold text-lg text-white">PDF Attachments</h3>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-300 ml-auto">
              {result.totalFound} file{result.totalFound !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="divide-y divide-gray-700/50">
            {result.pdfs.map((pdf, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-800/20 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{pdf.filename}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{pdf.subject}</p>
                  <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{pdf.receivedAt}
                    {pdf.sizeBytes > 0 && <span className="ml-2">{formatBytes(pdf.sizeBytes)}</span>}
                  </p>
                </div>
                <button
                  onClick={() => downloadAttachment(pdf.base64Data, pdf.filename, pdf.mimeType)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors text-purple-300 hover:text-purple-200 text-xs font-medium shrink-0"
                >
                  <Download className="w-4 h-4" />Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Scanner View ───────────────────────────────────────────────────────────

function ScannerView({ sudoPassword, onLogout }: { sudoPassword: string; onLogout: () => void }) {
  const { toast } = useToast();
  const [senderEmail, setSenderEmail] = useState("no-reply@blinkit.com");
  const [startTimeIST, setStartTimeIST] = useState(new Date().toISOString().slice(0, 16));
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [razorpayResult, setRazorpayResult] = useState<RazorpayScanResult | null>(null);
  const [jioGamesResult, setJioGamesResult] = useState<JioGamesScanResult | null>(null);
  const [gamesTheShopResult, setGamesTheShopResult] = useState<GamesTheShopScanResult | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderEmail.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please enter a sender email address." });
      return;
    }

    setScanning(true);
    setScanResult(null);
    setRazorpayResult(null);
    setJioGamesResult(null);
    setGamesTheShopResult(null);

    try {
      if (isRazorpay(senderEmail)) {
        // ── Razorpay refund scan ──
        const res = await fetch("/api/razorpay-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sudoPassword, startTimeIST }),
        });
        if (res.status === 401) { toast({ variant: "destructive", title: "Authentication Failed", description: "Invalid sudo password." }); onLogout(); return; }
        if (!res.ok) { const err = await res.json().catch(() => ({ error: "Unknown error" })); throw new Error(err.error || "Scan failed"); }
        const result: RazorpayScanResult = await res.json();
        setRazorpayResult(result);
        toast({ title: "Scan Complete", description: `Found ${result.totalFound} Razorpay record${result.totalFound !== 1 ? "s" : ""}.` });
      } else if (isJioGames(senderEmail)) {
        // ── JioGames order scan ──
        const res = await fetch("/api/jiogames-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sudoPassword, startTimeIST }),
        });
        if (res.status === 401) { toast({ variant: "destructive", title: "Authentication Failed", description: "Invalid sudo password." }); onLogout(); return; }
        if (!res.ok) { const err = await res.json().catch(() => ({ error: "Unknown error" })); throw new Error(err.error || "Scan failed"); }
        const result: JioGamesScanResult = await res.json();
        setJioGamesResult(result);
        toast({ title: "Scan Complete", description: `Found ${result.totalFound} JioGames order email${result.totalFound !== 1 ? "s" : ""}.` });
      } else if (isGamesTheShop(senderEmail)) {
        // ── GamesTheShop PDF scan ──
        const res = await fetch("/api/gamestheshop-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sudoPassword, startTimeIST }),
        });
        if (res.status === 401) { toast({ variant: "destructive", title: "Authentication Failed", description: "Invalid sudo password." }); onLogout(); return; }
        if (!res.ok) { const err = await res.json().catch(() => ({ error: "Unknown error" })); throw new Error(err.error || "Scan failed"); }
        const result: GamesTheShopScanResult = await res.json();
        setGamesTheShopResult(result);
        toast({ title: "Scan Complete", description: `Found ${result.totalFound} PDF${result.totalFound !== 1 ? "s" : ""} from GamesTheShop.` });
      } else {
        // ── Gift card scan ──
        const res = await fetch("/api/gift-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sudoPassword, senderEmail, startTimeIST }),
        });
        if (res.status === 401) { toast({ variant: "destructive", title: "Authentication Failed", description: "Invalid sudo password." }); onLogout(); return; }
        if (!res.ok) { const err = await res.json().catch(() => ({ error: "Unknown error" })); throw new Error(err.error || "Scan failed"); }
        const result: ScanResult = await res.json();
        setScanResult(result);
        toast({ title: "Scan Complete", description: `Found ${result.totalFound} gift cards successfully.` });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Scan Failed", description: error.message || "An unexpected error occurred." });
    } finally {
      setScanning(false);
    }
  };

  // ── Gift card Excel / CSV ──
  const handleDownloadExcel = () => {
    if (!scanResult || scanResult.totalFound === 0) return;
    const wb = XLSX.utils.book_new();
    const sortedValues = Object.keys(scanResult.byValue).sort((a, b) => (parseInt(a.replace(/[^0-9]/g, "")) || 0) - (parseInt(b.replace(/[^0-9]/g, "")) || 0));
    sortedValues.forEach((valueGroup) => {
      const rows = scanResult.byValue[valueGroup];
      const sheetData = rows.map((row) => ({ Brand: row.brand, "Gift Card Value": row.value, Code: row.code, Validity: row.validity, "Received At (IST)": row.receivedAt }));
      const ws = XLSX.utils.json_to_sheet(sheetData);
      ws["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, ws, (valueGroup.replace(/[\\/*?:[\]]/g, "").substring(0, 31)) || "Unknown");
    });
    XLSX.writeFile(wb, `giftcards-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleDownloadCSV = () => {
    if (!scanResult || scanResult.totalFound === 0) return;
    const headers = ["Brand", "Gift Card Value", "Code", "Validity", "Received At (IST)"];
    const allRows: string[][] = [headers];
    Object.keys(scanResult.byValue).sort((a, b) => (parseInt(a.replace(/[^0-9]/g, "")) || 0) - (parseInt(b.replace(/[^0-9]/g, "")) || 0))
      .forEach((vg) => scanResult.byValue[vg].forEach((row) => allRows.push([row.brand, row.value, row.code, row.validity, row.receivedAt].map((v) => `"${(v || "").replace(/"/g, '""')}"`))));
    const blob = new Blob([allRows.map((r) => r.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `giftcards-${new Date().toISOString().split("T")[0]}.csv`; a.click();
  };

  // ── Razorpay Excel / CSV ──
  const refundRowMapper = (r: RazorpayRefundRow) => ({
    "Status": r.status === "successful" ? "Successful" : "Initiated",
    "Refund Amount": r.refundAmount, "Refund ID": r.refundId, "RRN (Tracking No.)": r.rrn,
    "Initiated On": r.initiatedOn, "Payment Amount": r.paymentAmount, "Payment ID": r.paymentId,
    "Payment Via": r.paymentVia, "Mobile Number": r.mobileNumber, "Email": r.email,
    "Received At (IST)": r.receivedAt, "Subject": r.subject,
  });
  const refundCols = [{ wch: 12 }, { wch: 16 }, { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 24 }, { wch: 16 }, { wch: 30 }, { wch: 22 }, { wch: 40 }];

  const handleRazorpayPaymentsExcel = () => {
    if (!razorpayResult || (razorpayResult.payments?.length ?? 0) === 0) return;
    const wb = XLSX.utils.book_new();
    const date = new Date().toISOString().split("T")[0];
    const payData = razorpayResult.payments.map((r) => ({
      "Merchant": r.merchant, "Amount": r.amount, "Payment ID": r.paymentId,
      "Method": r.method, "Paid On": r.paidOn,
      "Email": r.email, "Mobile Number": r.mobileNumber,
      "Received At (IST)": r.receivedAt, "Subject": r.subject,
    }));
    const ws = XLSX.utils.json_to_sheet(payData);
    ws["!cols"] = [{ wch: 22 }, { wch: 12 }, { wch: 22 }, { wch: 28 }, { wch: 24 }, { wch: 30 }, { wch: 16 }, { wch: 22 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws, "Successful Payments");
    XLSX.writeFile(wb, `razorpay-payments-${date}.xlsx`);
  };

  const handleRazorpayRefundsExcel = () => {
    if (!razorpayResult || (razorpayResult.refunds?.length ?? 0) === 0) return;
    const wb = XLSX.utils.book_new();
    const date = new Date().toISOString().split("T")[0];

    // Sheet 1 — completed refunds (appeared in both type-2 and type-3 emails = same refundId twice)
    const completedRows = razorpayResult.completedRefunds ?? [];
    if (completedRows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(completedRows.map(refundRowMapper));
      ws["!cols"] = refundCols;
      XLSX.utils.book_append_sheet(wb, ws, "Completed Refunds");
    }

    // Sheet 2 — pending refunds (appeared only once — initiated but not yet confirmed)
    const pendingRows = razorpayResult.pendingRefunds ?? [];
    if (pendingRows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(pendingRows.map(refundRowMapper));
      ws["!cols"] = refundCols;
      XLSX.utils.book_append_sheet(wb, ws, "Pending Refunds");
    }

    XLSX.writeFile(wb, `razorpay-refunds-${date}.xlsx`);
  };

  const handleRazorpayCSV = () => {
    if (!razorpayResult || razorpayResult.totalFound === 0) return;
    const date = new Date().toISOString().split("T")[0];
    const allRows: string[] = [];

    if ((razorpayResult.payments?.length ?? 0) > 0) {
      const headers = ["Type", "Merchant", "Amount", "Payment ID", "Method", "Paid On", "Email", "Mobile Number", "Received At (IST)", "Subject"];
      allRows.push(headers.map((h) => `"${h}"`).join(","));
      razorpayResult.payments.forEach((r) => {
        allRows.push(["Payment", r.merchant, r.amount, r.paymentId, r.method, r.paidOn, r.email, r.mobileNumber, r.receivedAt, r.subject]
          .map((v) => `"${(v || "").replace(/"/g, '""')}"`).join(","));
      });
      if ((razorpayResult.refunds?.length ?? 0) > 0) allRows.push("");
    }

    if ((razorpayResult.refunds?.length ?? 0) > 0) {
      const headers = ["Type", "Status", "Refund Amount", "Refund ID", "RRN (Tracking No.)", "Initiated On", "Payment Amount", "Payment ID", "Payment Via", "Mobile Number", "Email", "Received At (IST)", "Subject"];
      allRows.push(headers.map((h) => `"${h}"`).join(","));
      razorpayResult.refunds.forEach((r) => {
        allRows.push(["Refund", r.status === "successful" ? "Successful" : "Initiated", r.refundAmount, r.refundId, r.rrn, r.initiatedOn, r.paymentAmount, r.paymentId, r.paymentVia, r.mobileNumber, r.email, r.receivedAt, r.subject]
          .map((v) => `"${(v || "").replace(/"/g, '""')}"`).join(","));
      });
    }

    if ((razorpayResult.pendingRefunds?.length ?? 0) > 0) {
      allRows.push(""); allRows.push('"-- PENDING REFUNDS (Single Occurrence) --"');
      const headers = ["Type", "Status", "Refund Amount", "Refund ID", "RRN (Tracking No.)", "Initiated On", "Payment Amount", "Payment ID", "Payment Via", "Mobile Number", "Email", "Received At (IST)", "Subject"];
      allRows.push(headers.map((h) => `"${h}"`).join(","));
      razorpayResult.pendingRefunds.forEach((r) => {
        allRows.push(["Pending", r.status === "successful" ? "Successful" : "Initiated", r.refundAmount, r.refundId, r.rrn, r.initiatedOn, r.paymentAmount, r.paymentId, r.paymentVia, r.mobileNumber, r.email, r.receivedAt, r.subject]
          .map((v) => `"${(v || "").replace(/"/g, '""')}"`).join(","));
      });
    }

    const blob = new Blob([allRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `razorpay-scan-${date}.csv`; a.click();
  };

  // ── JioGames Excel / CSV ──
  const handleJioGamesExcel = () => {
    if (!jioGamesResult || jioGamesResult.totalFound === 0) return;
    const wb = XLSX.utils.book_new();
    const sheetData = jioGamesResult.orders.map((o) => ({
      "Subject": o.subject,
      "Game / Order Name": o.gameName,
      "Order ID": o.orderId,
      "Amount": o.amount,
      "Email (To)": o.toEmail,
      "Received At (IST)": o.receivedAt,
      "Attachments": o.attachments.map((a) => a.filename).join(", "),
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    ws["!cols"] = [{ wch: 40 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 30 }, { wch: 22 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, ws, "JioGames Orders");
    XLSX.writeFile(wb, `jiogames-orders-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleJioGamesCSV = () => {
    if (!jioGamesResult || jioGamesResult.totalFound === 0) return;
    const headers = ["Subject", "Game / Order Name", "Order ID", "Amount", "Email (To)", "Received At (IST)", "Attachments"];
    const rows = jioGamesResult.orders.map((o) =>
      [o.subject, o.gameName, o.orderId, o.amount, o.toEmail, o.receivedAt, o.attachments.map((a) => a.filename).join("; ")]
        .map((v) => `"${(v || "").replace(/"/g, '""')}"`)
    );
    const blob = new Blob([[headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `jiogames-orders-${new Date().toISOString().split("T")[0]}.csv`; a.click();
  };

  const allAttachments = scanResult ? Object.values(scanResult.byValue).flat().flatMap((row) => row.attachments || []) : [];
  const razorpayMode = isRazorpay(senderEmail);
  const jioGamesMode = isJioGames(senderEmail);
  const gamesTheShopMode = isGamesTheShop(senderEmail);

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 max-w-7xl mx-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <header className="flex items-center justify-between mb-8 pb-6 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${razorpayMode ? "bg-blue-500/20 border-blue-500/30" : jioGamesMode ? "bg-orange-500/20 border-orange-500/30" : gamesTheShopMode ? "bg-purple-500/20 border-purple-500/30" : "bg-emerald-500/20 border-emerald-500/30"}`}>
            {razorpayMode ? <RefreshCw className="w-5 h-5 text-blue-400" /> : jioGamesMode ? <Gamepad2 className="w-5 h-5 text-orange-400" /> : gamesTheShopMode ? <Store className="w-5 h-5 text-purple-400" /> : <Gift className="w-5 h-5 text-emerald-400" />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{razorpayMode ? "Razorpay Refund Scanner" : jioGamesMode ? "JioGames Order Scanner" : gamesTheShopMode ? "GamesTheShop PDF Scanner" : "Gift Card Scanner"}</h1>
            <p className="text-xs text-gray-400">{razorpayMode ? "Refund Tracking & Export Tool" : jioGamesMode ? "Order PDFs & Details Tool" : gamesTheShopMode ? "PDF Attachment Collector" : "Automated Extraction Tool"}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onLogout} className="text-gray-400 hover:text-white border-gray-700">
          <LogOut className="w-4 h-4 mr-2" />Sign Out
        </Button>
      </header>

      <div className="grid lg:grid-cols-[350px_1fr] gap-8 items-start">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-6 shadow-xl shadow-black/20 sticky top-8"
        >
          <h2 className="text-lg font-semibold mb-6 flex items-center text-white">
            <Search className="w-5 h-5 mr-2 text-emerald-400" />Scan Parameters
          </h2>

          <form onSubmit={handleScan} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="gs-senderEmail" className="text-gray-300">Sender Email</Label>
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
              {razorpayMode && (
                <p className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                  Razorpay mode — extracts payments &amp; refunds with separate Excel exports.
                </p>
              )}
              {jioGamesMode && (
                <p className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
                  JioGames mode — collects all order PDFs &amp; exports details to Excel.
                </p>
              )}
              {gamesTheShopMode && (
                <p className="text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                  GamesTheShop mode — lists all PDF attachments from emails for download.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gs-startTime" className="flex items-center justify-between text-gray-300">
                <span>Scan From</span>
                <span className="text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">IST Time</span>
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
              className={`w-full mt-4 text-white ${razorpayMode ? "bg-blue-500 hover:bg-blue-600" : jioGamesMode ? "bg-orange-500 hover:bg-orange-600" : gamesTheShopMode ? "bg-purple-500 hover:bg-purple-600" : "bg-emerald-500 hover:bg-emerald-600"}`}
              disabled={scanning}
            >
              {scanning ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scanning Inbox...</>) : (<><Search className="w-4 h-4 mr-2" />Generate Report</>)}
            </Button>
          </form>

          {/* Quick presets */}
          <div className="mt-6 pt-5 border-t border-gray-700/50">
            <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Quick Presets</p>
            <div className="flex flex-col gap-2">
              {["no-reply@blinkit.com", "no-reply@razorpay.com", "orders@jiogames.com", "no-reply@gamestheshop.com"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSenderEmail(preset)}
                  className={`text-left text-xs px-3 py-2 rounded-lg border transition-colors ${senderEmail === preset ? "bg-gray-700 border-gray-500 text-white" : "bg-gray-800/30 border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-800/60"}`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!scanning && !scanResult && !razorpayResult && !jioGamesResult && !gamesTheShopResult && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-[400px] flex flex-col items-center justify-center border border-dashed border-gray-700/50 rounded-2xl bg-gray-900/30 text-center p-8"
              >
                <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
                  {razorpayMode ? <RefreshCw className="w-8 h-8 text-gray-600" /> : jioGamesMode ? <Gamepad2 className="w-8 h-8 text-gray-600" /> : gamesTheShopMode ? <Store className="w-8 h-8 text-gray-600" /> : <Gift className="w-8 h-8 text-gray-600" />}
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Ready to Scan</h3>
                <p className="text-sm text-gray-400 max-w-sm">
                  {razorpayMode
                    ? "Will scan for Razorpay emails and show separate export options for payments and refunds."
                    : jioGamesMode
                    ? "Will collect all JioGames order emails and their PDF attachments."
                    : gamesTheShopMode
                    ? "Will list all PDF attachments from GamesTheShop emails for download."
                    : "Configure the parameters on the left and hit generate to extract gift cards from Gmail."}
                </p>
              </motion.div>
            )}

            {scanning && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-[400px] flex flex-col items-center justify-center border border-gray-700/50 rounded-2xl bg-gray-900/50 text-center p-8"
              >
                <div className="relative mb-6">
                  <div className={`absolute inset-0 blur-xl rounded-full ${razorpayMode ? "bg-blue-500/20" : jioGamesMode ? "bg-orange-500/20" : gamesTheShopMode ? "bg-purple-500/20" : "bg-emerald-500/20"}`} />
                  <Loader2 className={`w-12 h-12 animate-spin relative z-10 ${razorpayMode ? "text-blue-400" : jioGamesMode ? "text-orange-400" : gamesTheShopMode ? "text-purple-400" : "text-emerald-400"}`} />
                </div>
                <h3 className="text-lg font-medium text-white animate-pulse">Scanning Emails...</h3>
                <p className="text-sm text-gray-400 mt-2">This might take a few moments depending on inbox size.</p>
              </motion.div>
            )}

            {/* ── GamesTheShop results ── */}
            {gamesTheShopResult && (
              <GamesTheShopResults result={gamesTheShopResult} />
            )}

            {/* ── JioGames results ── */}
            {jioGamesResult && (
              <JioGamesResults
                result={jioGamesResult}
                onDownloadExcel={handleJioGamesExcel}
                onDownloadCSV={handleJioGamesCSV}
              />
            )}

            {/* ── Razorpay results ── */}
            {razorpayResult && (
              <RazorpayResults
                result={razorpayResult}
                onDownloadPaymentsExcel={handleRazorpayPaymentsExcel}
                onDownloadRefundsExcel={handleRazorpayRefundsExcel}
                onDownloadCSV={handleRazorpayCSV}
              />
            )}

            {/* ── Gift card results ── */}
            {scanResult && (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
                  <div>
                    <h2 className="text-2xl font-bold text-emerald-400 flex items-center">
                      <CheckCircle2 className="w-6 h-6 mr-2" />Scan Complete
                    </h2>
                    <p className="text-sm text-emerald-300/80 mt-1">
                      Extracted <strong className="text-white">{scanResult.totalFound}</strong> valid gift cards.
                      {allAttachments.length > 0 && (
                        <span className="ml-2"><Paperclip className="w-3 h-3 inline mr-1" />{allAttachments.length} attachment{allAttachments.length !== 1 ? "s" : ""}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button onClick={handleDownloadExcel} disabled={scanResult.totalFound === 0} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                      <Download className="w-4 h-4 mr-2" />Excel (.xlsx)
                    </Button>
                    <Button onClick={handleDownloadCSV} disabled={scanResult.totalFound === 0} variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                      <Download className="w-4 h-4 mr-2" />CSV
                    </Button>
                  </div>
                </div>

                {scanResult.totalFound === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 border border-gray-700/50 rounded-2xl bg-gray-900/50">
                    <AlertCircle className="w-12 h-12 text-gray-500 mb-4" />
                    <p className="text-lg font-medium text-white">No matching emails found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your start time or sender email.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(scanResult.byValue)
                      .sort((a, b) => (parseInt(a[0].replace(/[^0-9]/g, "")) || 0) - (parseInt(b[0].replace(/[^0-9]/g, "")) || 0))
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
                              <span className="w-2 h-6 bg-emerald-500 rounded-full mr-3" />{value} Denomination
                            </h3>
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-300">
                              {rows.length} {rows.length === 1 ? "card" : "cards"}
                            </span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                              <thead className="bg-gray-800/10 text-gray-400 text-xs uppercase">
                                <tr>
                                  <th className="px-6 py-4 font-medium">Brand</th>
                                  <th className="px-6 py-4 font-medium">Code</th>
                                  <th className="px-6 py-4 font-medium">Validity</th>
                                  <th className="px-6 py-4 font-medium">Received (IST)</th>
                                  <th className="px-6 py-4 font-medium">Files</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-700/50">
                                {rows.map((row, i) => (
                                  <tr key={i} className="hover:bg-gray-800/20 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{row.brand}</td>
                                    <td className="px-6 py-4 font-mono text-emerald-400 bg-emerald-500/5">{row.code}</td>
                                    <td className="px-6 py-4">
                                      <span className="flex items-center text-gray-400">
                                        <Calendar className="w-3 h-3 mr-1.5" />{row.validity}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">{row.receivedAt}</td>
                                    <td className="px-6 py-4">
                                      {row.attachments && row.attachments.length > 0 ? (
                                        <div className="flex flex-col gap-1">
                                          {row.attachments.map((att, j) => (
                                            <button key={j} onClick={() => downloadAttachment(att.base64Data, att.filename, att.mimeType)}
                                              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer">
                                              <FileText className="w-3 h-3" />{att.filename}
                                            </button>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-xs text-gray-600">-</span>
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

// ── Entry ──────────────────────────────────────────────────────────────────

export default function GiftScanner() {
  const [sudoPassword, setSudoPassword] = useState<string | null>(null);
  if (!sudoPassword) return <LoginView onLogin={(pwd) => setSudoPassword(pwd)} />;
  return <ScannerView sudoPassword={sudoPassword} onLogout={() => setSudoPassword(null)} />;
}
