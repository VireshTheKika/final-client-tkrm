import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import React from "react";

export default function Login() {
  const navigate = useNavigate();

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/google-login`,
        { token: credential },
        { withCredentials: true }
      );

      console.log("✅ Google Login Response:", data);

      if (!data || !data.email) {
        alert("No user data returned from server!");
        return;
      }

      sessionStorage.setItem("userInfo", JSON.stringify(data));
      navigate("/dashboard");
    } catch (error) {
      console.error("❌ Google login failed:", error);
      alert("Google login failed!");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-md text-center w-[350px]">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Welcome to TKRM
        </h1>
        <p className="text-gray-500 mb-6">Login using your Google account</p>

        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => alert("Login Failed")}
        />

        <p className="mt-6 text-sm text-gray-400">Powered by The Kika Agency</p>
      </div>
    </div>
  );
}
