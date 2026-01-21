import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import BooksAssets from './pages/BooksAssets';
import AuditorDashboard from './components/AuditorDashboard';
import BorrowerDashboard from './components/BorrowerDashboard';
import LenderDashboard from './components/LenderDashboard';
import PublicLoans from './pages/PublicLoans';
import WhoIsBuilding from './pages/WhoIsBuilding';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="builders" element={<WhoIsBuilding />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="books" element={<BooksAssets />} />
        <Route path="auditor" element={<AuditorDashboard />} />
        <Route path="borrower" element={<BorrowerDashboard />} />
        <Route path="lender" element={<LenderDashboard />} />
        <Route path="loans" element={<PublicLoans />} />
      </Route>
    </Routes>
  );
}


export default App;
