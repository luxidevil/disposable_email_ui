import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowRight } from "lucide-react";

const DeviceVerification = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  // Get bgColor from navigation state, fallback to default
  const bgColor = location.state?.bgColor || "bg-background";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    // Navigate to the dashboard and pass the email in the URL state
    navigate(`/dashboard/${email}`);
  };

  return (
    <div
      className={`min-h-screen bg-background flex flex-col items-center justify-center p-4`}
    >
      <div className="flex gap-4 mb-6">
        <Button
          onClick={() =>
            window.open(
              `https://t.me/Luxuriousdevilott?text=${encodeURIComponent(
                `Hi I am interested to buy in bulk`
              )}`,
              "_blank"
            )
          }
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          Buy on Telegram
        </Button>
        <Button
          onClick={() =>
            window.open(
              `https://wa.me/9890938795?text=${encodeURIComponent(
                `Hi I am interested to buy in bulk`
              )}`,
              "_blank"
            )
          }
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          Buy on WhatsApp
        </Button>
      </div>
      <Card className={`w-full max-w-md`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className={`h-12 w-12 ${bgColor} rounded-full p-2`} />
          </div>
          <CardTitle className="text-2xl">Disposable Email Viewer</CardTitle>
          <p className="text-muted-foreground">
            Enter your temporary email address to view its inbox.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Temporary Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className={`w-full ${bgColor} text-white`}>
              View Inbox
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceVerification;
