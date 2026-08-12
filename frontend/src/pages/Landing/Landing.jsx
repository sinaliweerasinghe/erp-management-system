import "../../App.css";
import bgImage from "../../assets/images/background/background-bg.jpg";
import Features from "./Features";
import { useNavigate } from "react-router-dom"; // Add this import

function Landing() {
  const navigate = useNavigate(); // Add this hook

  const handleStartFreeClick = () => {
    navigate("/register"); // Add this function
  };

  const handleStartFreeClick1 = () => {
    navigate("/login"); // Add this function
  };

  return (
    <>
      <div
        className="landing-container"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="overlay">
          <nav className="navbar">
            <h2 className="logo">ERPify</h2>
            <div className="nav-links">
              <a href="#features">Features</a>
              <a href="/login">Login</a>
              <a href="/register" className="btn-primary">Get Started</a>
            </div>
          </nav>

          <div className="hero">
            <h1>Smart ERP for Growing Businesses</h1>
            <p>
              Manage employees, inventory, orders, and analytics — all in one
              cloud-based platform.
            </p>

            <div className="hero-buttons">
              <button 
                className="btn-primary" 
                onClick={handleStartFreeClick} // Add this onClick
              >
                Start Free
              </button>

              <button 
                className="btn-secondary"
                onClick={handleStartFreeClick1}
              >
                View Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="features">
        <Features />
      </div>
    </>
  );
}

export default Landing;