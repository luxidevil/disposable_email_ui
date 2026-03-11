import React, { useState } from "react";
import { useServices } from "@/context/ServicesContext";

const ADMIN_USER = "devil";
const ADMIN_PASS = "daKsh@3210";

const COLOR_OPTIONS = [
  { label: "Red (Netflix)", value: "bg-red-700" },
  { label: "Orange", value: "bg-orange-600" },
  { label: "Bright Red", value: "bg-red-600" },
  { label: "Sky Blue", value: "bg-sky-500" },
  { label: "Green", value: "bg-green-600" },
  { label: "Purple", value: "bg-purple-600" },
  { label: "Pink", value: "bg-pink-600" },
  { label: "Yellow", value: "bg-yellow-500" },
  { label: "Indigo", value: "bg-indigo-600" },
  { label: "Teal", value: "bg-teal-600" },
];

const COLOR_PREVIEW: Record<string, string> = {
  "bg-red-700": "#b91c1c",
  "bg-orange-600": "#ea580c",
  "bg-red-600": "#dc2626",
  "bg-sky-500": "#0ea5e9",
  "bg-green-600": "#16a34a",
  "bg-purple-600": "#9333ea",
  "bg-pink-600": "#db2777",
  "bg-yellow-500": "#eab308",
  "bg-indigo-600": "#4f46e5",
  "bg-teal-600": "#0d9488",
};

const Admin = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const { services, addService, toggleService, removeService } = useServices();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("bg-red-700");
  const [newImg, setNewImg] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      setLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Invalid username or password.");
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setAddError("Service name is required.");
      return;
    }
    if (!newImg.trim()) {
      setAddError("Image URL is required.");
      return;
    }
    addService({ name: newName.trim(), color: newColor, img: newImg.trim() });
    setNewName("");
    setNewImg("");
    setNewColor("bg-red-700");
    setAddError("");
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 2000);
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.657-1.343-3-3-3S6 9.343 6 11v1H4v8h16v-8h-2v-1c0-1.657-1.343-3-3-3s-3 1.343-3 3v1H9v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Login</h1>
            <p className="text-gray-400 text-sm mt-1">Restricted access</p>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-gray-300 text-sm font-medium mb-1 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-500"
                placeholder="Enter username"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm font-medium mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-500"
                placeholder="Enter password"
              />
            </div>
            {loginError && (
              <p className="text-red-400 text-sm text-center">{loginError}</p>
            )}
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg transition-colors mt-1"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Manage services shown on the main page</p>
          </div>
          <button
            onClick={() => setLoggedIn(false)}
            className="text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Services</h2>
          {services.length === 0 && (
            <p className="text-gray-400 text-sm">No services yet. Add one below.</p>
          )}
          <div className="flex flex-col gap-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex items-center gap-4 bg-gray-700 rounded-xl px-4 py-3"
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLOR_PREVIEW[service.color] || "#888" }}
                />
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={service.img}
                    alt={service.name}
                    className="w-8 h-8 object-contain rounded bg-white p-0.5 flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <span className="font-medium truncate">{service.name}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${service.active ? "bg-green-900 text-green-300" : "bg-gray-600 text-gray-400"}`}>
                    {service.active ? "Active" : "Off"}
                  </span>
                  <button
                    onClick={() => toggleService(service.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      service.active
                        ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                        : "bg-green-700 hover:bg-green-600 text-white"
                    }`}
                  >
                    {service.active ? "Shut Down" : "Activate"}
                  </button>
                  <button
                    onClick={() => removeService(service.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-medium transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Service</h2>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div>
              <label className="text-gray-300 text-sm font-medium mb-1 block">Service Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-500"
                placeholder="e.g. Spotify"
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm font-medium mb-1 block">Image URL</label>
              <input
                type="text"
                value={newImg}
                onChange={(e) => setNewImg(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-500"
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm font-medium mb-1 block">Card Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNewColor(opt.value)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border-2 transition-all ${
                      newColor === opt.value
                        ? "border-white bg-gray-600"
                        : "border-transparent bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: COLOR_PREVIEW[opt.value] }}
                    />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {addError && <p className="text-red-400 text-sm">{addError}</p>}
            {addSuccess && <p className="text-green-400 text-sm">Service added successfully!</p>}
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg transition-colors"
            >
              Add Service
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Admin;
