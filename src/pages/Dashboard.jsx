import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminPanel from "./AdminPanel";
import ManagerPanel from "./ManagerPanel";
import EmployeePanel from "./EmployeePanel";
import React from "react";
import logo from "../assets/kika-logo.png";
export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
    if (!userInfo) {
      navigate("/");
    } else {
      setUser(userInfo);
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/logout`,
        {},
        { withCredentials: true }
      );
      sessionStorage.removeItem("userInfo");
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!user) return <p>Loading user data...</p>;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#010110] shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">
          <img className="w-[80px] h-[80px]" src={logo} />
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-white">{user.name}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="p-6">
        {user.role === "Admin" && <AdminPanel user={user} />}
        {user.role === "Manager" && <ManagerPanel user={user} />}
        {user.role === "Employee" && <EmployeePanel user={user} />}
      </main>
    </div>
  );
}
