import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import bgImage from "../../assets/images/background/background-bg.jpg";
import { FaArrowLeft } from "react-icons/fa"; // Import the arrow icon

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ DEMO LOGIN CHECK (NO BACKEND)
    if (email === "demo@erpify.com" && password === "demo123") {
      localStorage.setItem("demo", "true");
      navigate("/demo-dashboard");
      return;
    }

    // 🔐 REAL LOGIN (BACKEND)
    try {
      const res = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // ✅ Clear demo flag when doing real login
      localStorage.removeItem("demo");

      // ✅ Store JWT
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Server error");
    }
  };

  const goToLandingPage = () => {
    navigate("/");
  };

  return (
    <div 
      className="login-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Back Arrow */}
      <div className="back-arrow" onClick={goToLandingPage}>
        <FaArrowLeft />
        <span>Back to Home</span>
      </div>
      
      <div className="login-box">
        <div className="login-header">
          <h2>Login to ERPify</h2>
          <p className="subtitle">Access your company dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="forgot-password">
            <span onClick={() => navigate("/forgot-password")}>
              Forgot password?
            </span>
          </div>

          <button type="submit" className="login-btn">
            Sign In
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <button 
            type="button" 
            className="demo-btn"
            onClick={() => {
              setEmail("demo@erpify.com");
              setPassword("demo123");
            }}
          >
            Try Demo Account
          </button>
        </form>

        <p className="footer-text">
          Don't have an account?{" "}
          <span className="register-link" onClick={() => navigate("/register")}>
            Create company account
          </span>
        </p>

        <div className="privacy-notice">
          By continuing, you agree to our 
          <span> Terms of Service</span> and 
          <span> Privacy Policy</span>
        </div>
      </div>
    </div>
  );
}

export default Login;