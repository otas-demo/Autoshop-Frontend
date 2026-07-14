import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "../services/axios";
import { removeAuthToken } from "../services/axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem("authToken");
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        setIsValid(false);
        return;
      }

      try {
        // Use fetchExpenses API endpoint to validate token
        // This will throw an error if token is invalid/expired
        const response = await axios.get("/expense");
        
        // If successful, token is valid
        if (response.status === 200) {
          setIsValid(true);
        } else {
          // Unexpected status, logout for safety
          handleLogout();
        }
      } catch (error: any) {
        // Check for 500 or 401 status codes (token expired/invalid)
        const status = error?.response?.status;
        if (status === 500 || status === 401 || status === 403) {
          // Token expired or invalid
          handleLogout();
        } else {
          // Other errors (network issues, etc.), still allow access
          // Token might be valid but API might be down
          setIsValid(true);
        }
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem("adminData");
    toast.error("Session expired. Please login again.");
    setIsValid(false);
    navigate("/login", { replace: true });
  };

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600">Validating session...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

