// Type for fetched email
type FetchedEmail = {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  body: string;
  timestamp: string | number;
};
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RefreshCw } from "lucide-react";
import DOMPurify from "dompurify";
import parse from "html-react-parser";

interface SafeEmailBodyProps {
  htmlContent: string;
}

const SafeEmailBody: React.FC<SafeEmailBodyProps> = ({ htmlContent }) => {
  // Sanitize the HTML string to prevent XSS
  const cleanHTML: string = DOMPurify.sanitize(htmlContent);

  return (
    <div
      className="w-full h-auto overflow-x-auto prose max-w-none"
      style={{
        wordBreak: "break-word",
        overflowWrap: "break-word",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        {parse(cleanHTML)}
      </div>

      {/* Extra CSS to make embedded content responsive */}
      <style>{`
        .prose img {
          max-width: 100%;
          height: auto;
        }
        .prose table {
          width: 100%;
          border-collapse: collapse;
        }
        .prose iframe, .prose video {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
};;
const EmailDashboard = () => {
  const [emails, setEmails] = useState<FetchedEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<FetchedEmail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { emailAddress } = useParams<{ emailAddress: string }>();
  const navigate = useNavigate();

  const fetchEmails = async () => {
    if (!emailAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      // const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const apiUrl="https://api.luxidevilott.com"

      const response = await fetch(
        `${apiUrl}/api?to=${encodeURIComponent(emailAddress)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch emails from server.");
      }
      const data: FetchedEmail[] = await response.json();
      setEmails(data);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [emailAddress]);

  if (!emailAddress) {
    return <div>Error: No email address provided.</div>;
  }

  // View for displaying the list of emails
  if (!selectedEmail) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Inbox for {emailAddress}</h1>
            <p className="text-muted-foreground">
              {emails.length} message(s) found.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={fetchEmails} disabled={isLoading}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Loading emails...
          </div>
        )}

        {error && <p className="text-destructive">Error: {error}</p>}

        {!isLoading && !error && emails.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-xl font-semibold mb-2">No emails found</h3>
            <p className="text-muted-foreground max-w-sm">
              No emails have arrived for <span className="font-medium">{emailAddress}</span> yet. Check back later.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {emails.map((email) => (
            <Card
              key={email.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => setSelectedEmail(email)}
            >
              <CardContent className="p-4 flex justify-between">
                <div>
                  <p className="font-semibold">{email.from}</p>
                  <p className="font-bold">{email.subject}</p>
                  <p className="text-sm text-muted-foreground">
                    {email.snippet}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(email.timestamp).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // View for displaying a single selected email's content
  return (
    <div className="container mx-auto p-4">
      <Button
        variant="outline"
        onClick={() => setSelectedEmail(null)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Inbox
      </Button>
      <Card>
        <CardHeader>
          <p className="text-sm text-muted-foreground">
            From: {selectedEmail.from}
          </p>
          <CardTitle>{selectedEmail.subject}</CardTitle>
          <p className="text-sm text-muted-foreground">
            At: {new Date(selectedEmail.timestamp).toLocaleString()}
          </p>
        </CardHeader>
        <CardContent>
          <SafeEmailBody htmlContent={selectedEmail.body} />
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailDashboard;

