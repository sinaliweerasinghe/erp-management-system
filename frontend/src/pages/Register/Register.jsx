import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";
import bgImage from "../../assets/images/background/background-bg.jpg";
import { FaArrowLeft, FaCheck, FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    companyName: "",
    adminName: "",
    email: "",
    password: "",
  });

  const [passwordError, setPasswordError] = useState("");
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  
  const [showPassword, setShowPassword] = useState(false); // Add this line

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value,
    });

    // Check password requirements when password changes
    if (name === "password") {
      checkPasswordRequirements(value);
    }
  };

  const checkPasswordRequirements = (password) => {
    const newRequirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    
    setRequirements(newRequirements);
    
    // All requirements met?
    const allMet = Object.values(newRequirements).every(req => req);
    setPasswordError(allMet ? "" : "Password does not meet requirements");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password
    const allRequirementsMet = Object.values(requirements).every(req => req);
    if (!allRequirementsMet) {
      setPasswordError("Please meet all password requirements");
      return;
    }

    // ✅ MAP frontend → backend
    const payload = {
      companyName: formData.companyName,
      adminEmail: formData.email,
      password: formData.password,
    };

    try {
      const res = await fetch("http://localhost:5001/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Registration failed");
        return;
      }

      alert("Company registered successfully 🎉");
      navigate("/login");

    } catch (error) {
      console.error(error);
      alert("Server error. Please try again.");
    }
  };


  return (
    <div
      className="register-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Back Arrow */}
      <div className="back-arrow" onClick={() => navigate("/")}>
        <FaArrowLeft />
        <span>Back to Home</span>
      </div>

      <div className="register-box">
        <div className="register-header">
          <h2>Create Company Account</h2>
          <p className="subtitle">
            Set up your company ERP workspace
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Company Name</label>
            <input
              name="companyName"
              placeholder="Your Company Ltd"
              value={formData.companyName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Admin Name</label>
            <input
              name="adminName"
              placeholder="John Doe"
              value={formData.adminName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Admin Email</label>
            <input
              type="email"
              name="email"
              placeholder="admin@company.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            {/* Add password input container with eye toggle */}
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create a secure password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            
            {/* Password Requirements */}
            {formData.password && (
              <div className="password-requirements">
                <h4><FaCheck size={12} /> Password must contain:</h4>
                <ul>
                  <li style={{ color: requirements.length ? '#38a169' : '#e53e3e' }}>
                    {requirements.length ? <FaCheck size={10} /> : <FaTimes size={10} />} 
                    8+ characters
                  </li>
                  <li style={{ color: requirements.uppercase ? '#38a169' : '#e53e3e' }}>
                    {requirements.uppercase ? <FaCheck size={10} /> : <FaTimes size={10} />} 
                    Uppercase letter
                  </li>
                  <li style={{ color: requirements.lowercase ? '#38a169' : '#e53e3e' }}>
                    {requirements.lowercase ? <FaCheck size={10} /> : <FaTimes size={10} />} 
                    Lowercase letter
                  </li>
                  <li style={{ color: requirements.number ? '#38a169' : '#e53e3e' }}>
                    {requirements.number ? <FaCheck size={10} /> : <FaTimes size={10} />} 
                    Number
                  </li>
                  <li style={{ color: requirements.special ? '#38a169' : '#e53e3e' }}>
                    {requirements.special ? <FaCheck size={10} /> : <FaTimes size={10} />} 
                    Special character
                  </li>
                </ul>
              </div>
            )}
            
            {passwordError && (
              <p style={{ color: '#e53e3e', fontSize: '12px', marginTop: '5px' }}>
                {passwordError}
              </p>
            )}
          </div>

          <button 
            type="submit" 
            className="register-btn"
            disabled={passwordError && !Object.values(requirements).every(req => req)}
          >
            Create Company
          </button>
        </form>

        <p className="footer-text">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>
            Login here
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

export default Register;