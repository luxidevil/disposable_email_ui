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

export const ServicesProvider = ({ children }: { children: React.ReactNode }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error("Failed to fetch services:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
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
