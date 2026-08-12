import Sidebar from "../Sidebar/Sidebar";
import Header from "../Header/Header";
import "./DashboardLayout.css";

function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="content-area">
          <div className="content-wrapper">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
