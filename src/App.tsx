import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import BooksAssets from './pages/BooksAssets';
import AuditorDashboard from './components/AuditorDashboard';
import BorrowerDashboard from './components/BorrowerDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="books" element={<BooksAssets />} />
        <Route path="auditor" element={<AuditorDashboard />} />
        <Route path="borrower" element={<BorrowerDashboard />} />
      </Route>
    </Routes>
  );
}


export default App;
