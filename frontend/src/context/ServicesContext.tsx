import React, { createContext, useContext, useState, useEffect } from "react";

export type Service = {
  id: string;
  name: string;
  color: string;
  img: string;
  active: boolean;
};

const DEFAULT_SERVICES: Service[] = [
  { id: "nf", name: "NF", color: "bg-red-700", img: "/images/netmirror.jpg", active: true },
  { id: "crunchy", name: "Crunchy", color: "bg-orange-600", img: "/images/crunchyroll.png", active: true },
  { id: "yt", name: "YT Premium", color: "bg-red-600", img: "/images/youtube.png", active: true },
  { id: "prime", name: "Prime", color: "bg-sky-500", img: "/images/prime2.png", active: true },
];

type ServicesContextType = {
  services: Service[];
  addService: (service: Omit<Service, "id" | "active">) => void;
  toggleService: (id: string) => void;
  removeService: (id: string) => void;
};

const ServicesContext = createContext<ServicesContextType | null>(null);

export const ServicesProvider = ({ children }: { children: React.ReactNode }) => {
  const [services, setServices] = useState<Service[]>(() => {
    try {
      const stored = localStorage.getItem("admin_services");
      return stored ? JSON.parse(stored) : DEFAULT_SERVICES;
    } catch {
      return DEFAULT_SERVICES;
    }
  });

  useEffect(() => {
    localStorage.setItem("admin_services", JSON.stringify(services));
  }, [services]);

  const addService = (service: Omit<Service, "id" | "active">) => {
    const newService: Service = {
      ...service,
      id: Date.now().toString(),
      active: true,
    };
    setServices((prev) => [...prev, newService]);
  };

  const toggleService = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const removeService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <ServicesContext.Provider value={{ services, addService, toggleService, removeService }}>
      {children}
    </ServicesContext.Provider>
  );
};

export const useServices = () => {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error("useServices must be used within ServicesProvider");
  return ctx;
};
