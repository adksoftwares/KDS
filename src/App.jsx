import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomerApp from './pages/customer/CustomerApp';
import ManagerApp  from './pages/manager/ManagerApp';
import KitchenApp  from './pages/kitchen/KitchenApp';
import UserMobileApp from './pages/customer/UserMobileApp';
import StaffScan from './pages/staff/StaffScan';
import StaffOrder from './pages/staff/StaffOrder';
import StaffKitchen from './pages/staff/StaffKitchen';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Standard Table Routing */}
          <Route path="/customer/:table_id" element={<CustomerApp />} />
          <Route path="/manager/*"          element={<ManagerApp />} />
          <Route path="/kitchen"            element={<KitchenApp />} />
          
          {/* 📱 User Mobile Application Portals (Register / OTP / profile QR / Bell) */}
          <Route path="/user/*"             element={<UserMobileApp />} />

          {/* 💻 Shop Staff / Owner Computer Dashboard Portals */}
          <Route path="/staff/scan"         element={<StaffScan />} />
          <Route path="/staff/order/:reg_id" element={<StaffOrder />} />
          <Route path="/staff/kitchen"      element={<StaffKitchen />} />

          {/* Default: Reroute to Mobile User Signup screen */}
          <Route path="*" element={<Navigate to="/user/register" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
