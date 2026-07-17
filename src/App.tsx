import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './dashboard/Dashboard';
import AddStudent from './student/AddStudent';
import Register from './auth/Register';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/students/add" element={<AddStudent />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}