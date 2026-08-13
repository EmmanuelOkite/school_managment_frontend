import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Dashboard from './dashboard/Dashboard';
import AddStudent from './student/AddStudent';
import ManageStudents from './student/ManageStudents';
import StudentAttendance from './student/StudentAttendance';
import CreateAnnouncement from './announcement/CreateAnnouncement';
import ManageParents from './parent/ManageParents';
import AddTeacher from './teacher/AddTeacher';
import ManageTeachers from './teacher/ManageTeachers';
import TeacherAttendance from './teacher/TeacherAttendance';
import CreateExam from './exam/CreateExam';
import EnterMarks from './exam/EnterMarks';
import GradeManagement from './exam/GradeManagement';
import Register from './auth/Register';
import Login from './auth/Login';
import ResetPassword from './auth/ResetPassword';
import RouteModal from './components/RouteModal';

function AppRoutes() {
  const location = useLocation();
  const background = (location.state as { background?: typeof location } | null)?.background;

  return (
    <>
      <Routes location={background ?? location}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<ManageStudents />} />
        <Route path="/students/add" element={<AddStudent />} />
        <Route path="/attendance/students" element={<StudentAttendance />} />
        <Route path="/communication/announcements/create" element={<CreateAnnouncement />} />
        <Route path="/parents" element={<ManageParents />} />
        <Route path="/teachers/add" element={<AddTeacher />} />
        <Route path="/teachers" element={<ManageTeachers />} />
        <Route path="/attendance/teachers" element={<TeacherAttendance />} />
        <Route path="/exams/create" element={<CreateExam />} />
        <Route path="/exams/marks" element={<EnterMarks />} />
        <Route path="/exams/grading" element={<GradeManagement />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>

      {background && (
        <Routes>
          <Route path="/students" element={<RouteModal><ManageStudents embedded /></RouteModal>} />
          <Route path="/students/add" element={<RouteModal maxWidth={920}><AddStudent embedded /></RouteModal>} />
          <Route path="/attendance/students" element={<RouteModal maxWidth={1300}><StudentAttendance embedded /></RouteModal>} />
          <Route path="/communication/announcements/create" element={<RouteModal maxWidth={940}><CreateAnnouncement embedded /></RouteModal>} />
          <Route path="/parents" element={<RouteModal maxWidth={1100}><ManageParents embedded /></RouteModal>} />
          <Route path="/teachers/add" element={<RouteModal maxWidth={960}><AddTeacher embedded /></RouteModal>} />
          <Route path="/teachers" element={<RouteModal maxWidth={1400}><ManageTeachers embedded /></RouteModal>} />
          <Route path="/attendance/teachers" element={<RouteModal maxWidth={1350}><TeacherAttendance embedded /></RouteModal>} />
          <Route path="/exams/create" element={<RouteModal maxWidth={960}><CreateExam embedded /></RouteModal>} />
          <Route path="/exams/marks" element={<RouteModal maxWidth={1400}><EnterMarks embedded /></RouteModal>} />
          <Route path="/exams/grading" element={<RouteModal maxWidth={1400}><GradeManagement embedded /></RouteModal>} />
        </Routes>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
