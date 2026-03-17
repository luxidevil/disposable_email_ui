import React, { createContext, useContext, useState, useEffect } from "react";

export type Service = {
  _id: string;
  name: string;
  color: string;
  img: string;
  active: boolean;
};

type ServicesContextType = {
  services: Service[];
  loading: boolean;
  addService: (service: Omit<Service, "_id" | "active">) => Promise<void>;
  toggleService: (id: string, active: boolean) => Promise<void>;
  removeService: (id: string) => Promise<void>;
};

const ServicesContext = createContext<ServicesContextType | null>(null);

const API_BASE = "/api/services";

const DEFAULT_SERVICES: Service[] = [
  { _id: "default-nf", name: "NF", color: "bg-red-700", img: "/images/netmirror.jpg", active: true },
  { _id: "default-crunchy", name: "Crunchy", color: "bg-orange-600", img: "/images/crunchyroll.png", active: true },
  { _id: "default-yt", name: "YT Premium", color: "bg-red-600", img: "/images/youtube.png", active: true },
  { _id: "default-prime", name: "Prime", color: "bg-sky-500", img: "/images/prime2.png", active: true },
];

export const ServicesProvider = ({ children }: { children: React.ReactNode }) => {
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [loading, setLoading] = useState(false);

  const fetchServices = async (retries = 3, delayMs = 3000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        const res = await fetch(API_BASE, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setServices(data);
          return;
        }
      } catch (err) {
        console.warn(`Fetch attempt ${attempt} failed:`, err);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    }
  };

  useEffect(() => {
    fetchServices();
    const interval = setInterval(() => fetchServices(1), 30000);
    return () => clearInterval(interval);
  }, []);

  const addService = async (service: Omit<Service, "_id" | "active">) => {
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(service),
      });
      const newService = await res.json();
      setServices((prev) => [...prev, newService]);
    } catch (err) {
      console.error("Failed to add service:", err);
    }
  };

  const toggleService = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      const updated = await res.json();
      setServices((prev) => prev.map((s) => (s._id === id ? updated : s)));
    } catch (err) {
      console.error("Failed to toggle service:", err);
    }
  };

  const removeService = async (id: string) => {
    try {
      await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      setServices((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error("Failed to remove service:", err);
    }
  };

  return (
    <ServicesContext.Provider value={{ services, loading, addService, toggleService, removeService }}>
      {children}
    </ServicesContext.Provider>
  );
};

export const useServices = () => {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error("useServices must be used within ServicesProvider");
  return ctx;
};
