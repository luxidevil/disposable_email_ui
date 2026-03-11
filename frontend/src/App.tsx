import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ServicesProvider } from "@/context/ServicesContext";
import DeviceVerification from "./pages/deviceVerification";
import EmailDashboard from "./pages/EmailDashboard";
import NotFound from "./pages/NotFound";
import Cards from "./pages/Cards";
import Search from "./pages/Search";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ServicesProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Cards />} />
            <Route path="/:name/verification" element={<DeviceVerification />} />
            <Route path="/dashboard/:emailAddress" element={<EmailDashboard />} />
            <Route path="/search" element={<Search />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ServicesProvider>
  </QueryClientProvider>
);

export default App;
