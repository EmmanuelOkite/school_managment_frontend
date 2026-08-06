import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './dashboard/Dashboard';
import AddStudent from './student/AddStudent';
import ManageStudents from './student/ManageStudents';
import StudentAttendance from './student/StudentAttendance';
import CreateAnnouncement from './announcement/CreateAnnouncement';
import Register from './auth/Register';
import Login from './auth/Login';
import ResetPassword from './auth/ResetPassword';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<ManageStudents />} />
        <Route path="/students/add" element={<AddStudent />} />
        <Route path="/attendance/students" element={<StudentAttendance />} />
        <Route path="/communication/announcements/create" element={<CreateAnnouncement />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}