import React from "react";
import { useNavigate } from "react-router-dom";
import { useServices } from "@/context/ServicesContext";

const SkeletonCard = () => (
  <div className="rounded-xl shadow-lg flex flex-col overflow-hidden animate-pulse" style={{ minHeight: 200 }}>
    <div className="w-full flex justify-center items-center bg-gray-200" style={{ height: 110 }}>
      <div className="w-16 h-16 rounded-full bg-gray-300" />
    </div>
    <div className="w-full flex items-center justify-center py-6 bg-gray-300">
      <div className="h-5 w-24 rounded bg-gray-400" />
    </div>
  </div>
);

const Cards = () => {
  const navigate = useNavigate();
  const { services, loading } = useServices();

  const activeServices = services.filter((s) => s.active);

  const handleCardClick = (name: string, color: string) => {
    navigate(`/${encodeURIComponent(name)}/verification`, { state: { bgColor: color } });
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-5xl px-6 py-10 flex flex-col items-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-10 text-gray-900">Choose a Service</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-4xl px-6">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : activeServices.length === 0 ? (
          <div className="col-span-2 text-center text-gray-400 text-lg py-20">
            No active services available.
          </div>
        ) : (
          activeServices.map((card) => (
            <div
              key={card._id}
              className={`cursor-pointer rounded-xl shadow-lg flex flex-col items-center justify-between text-white text-xl font-semibold transition-transform hover:scale-105 ${card.color}`}
              style={{ minHeight: 200, padding: 0 }}
              onClick={() => handleCardClick(card.name, card.color)}
            >
              <div className="w-full flex justify-center items-center bg-white rounded-t-xl" style={{ height: 110 }}>
                <img src={card.img} alt={card.name} className="h-16 w-16 object-contain" />
              </div>
              <div className="w-full flex items-center justify-center py-6 rounded-b-xl">
                <span className="text-xl font-bold">{card.name}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Cards;
