import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const sessionId = params.get("session_id");

      if (!sessionId) {
        toast.error("No session ID found");
        navigate("/");
        return;
      }

      try {
        const response = await axios.post(
          `${API}/auth/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );

        toast.success("Login successful!");
        navigate("/dashboard", { state: { user: response.data.user } });
      } catch (error) {
        console.error("Auth error:", error);
        toast.error("Authentication failed");
        navigate("/");
      }
    };

    processSession();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-900 text-lg font-semibold mb-2">Authenticating...</p>
        <p className="text-gray-600 text-sm">Please wait while we log you in</p>
      </div>
    </div>
  );
};

export default AuthCallback;