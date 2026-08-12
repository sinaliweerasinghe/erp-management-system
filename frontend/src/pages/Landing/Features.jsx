import FeatureCard from "../../components/FeatureCard";
import "./Features.css";

function Features() {
  return (
    <section className="features-section">
      <h2>Powerful ERP Features</h2>
      <p className="features-subtitle">
        Everything you need to manage and grow your business efficiently.
      </p>

      <div className="features-grid">
        <FeatureCard
          icon="👤"
          title="User & Role Management"
          description="Admin, Manager, and Employee roles with secure access control."
        />
        <FeatureCard
          icon="🏢"
          title="Multi-Company Support"
          description="One ERP system to manage multiple companies securely."
        />
        <FeatureCard
          icon="📦"
          title="Inventory Management"
          description="Track products, stock levels, and low-stock alerts."
        />
        <FeatureCard
          icon="🛒"
          title="Orders & Sales"
          description="Manage orders, monitor sales, and view transaction history."
        />
        <FeatureCard
          icon="📊"
          title="Dashboard & Analytics"
          description="Visual reports with sales trends and performance metrics."
        />
        <FeatureCard
          icon="🤖"
          title="Smart Insights"
          description="AI-powered insights to predict demand and optimize inventory."
        />
      </div>
    </section>
  );
}

export default Features;
