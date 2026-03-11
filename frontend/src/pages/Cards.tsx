import React from "react";
import { useNavigate } from "react-router-dom";
import { useServices } from "@/context/ServicesContext";

const Cards = () => {
  const navigate = useNavigate();
  const { services, loading } = useServices();

  const activeServices = services.filter((s) => s.active);

  const handleCardClick = (name: string, color: string) => {
    navigate(`/${encodeURIComponent(name)}/verification`, { state: { bgColor: color } });
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading services...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-5xl px-6 py-10 flex flex-col items-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-10 text-gray-900">Choose a Service</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-4xl px-6">
        {activeServices.map((card) => (
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
        ))}
        {activeServices.length === 0 && (
          <div className="col-span-2 text-center text-gray-400 text-lg py-20">
            No active services available.
          </div>
        )}
      </div>
    </div>
  );
};

export default Cards;
