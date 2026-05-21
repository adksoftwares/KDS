import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomerApp from './pages/customer/CustomerApp';
import ManagerApp  from './pages/manager/ManagerApp';
import KitchenApp  from './pages/kitchen/KitchenApp';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/customer/:table_id" element={<CustomerApp />} />
          <Route path="/manager/*"          element={<ManagerApp />} />
          <Route path="/kitchen"            element={<KitchenApp />} />
          {/* Default: redirect to demo table */}
          <Route path="*" element={<Navigate to="/customer/table_1" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
