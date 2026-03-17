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
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async (retries = 3, delayMs = 3000): Promise<boolean> => {
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
          return true;
        }
      } catch (err) {
        console.warn(`Fetch attempt ${attempt} failed:`, err);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    }
    return false;
  };

  useEffect(() => {
    let es: EventSource | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const init = async () => {
      const success = await fetchServices();
      if (!success) {
        setServices(DEFAULT_SERVICES);
      }
      setLoading(false);

      const connectSSE = () => {
        es = new EventSource("/api/services/events");

        es.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (Array.isArray(data) && data.length > 0) setServices(data);
          } catch {}
        };

        es.onerror = () => {
          es?.close();
          es = null;
          if (!pollInterval) {
            pollInterval = setInterval(() => fetchServices(1), 10000);
          }
        };
      };

      connectSSE();
    };

    init();

    return () => {
      es?.close();
      if (pollInterval) clearInterval(pollInterval);
    };
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
