import { Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyOtpPage from './pages/VerifyOtpPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ProfilePage from './pages/profilePage'
import ChangePasswordPage from './pages/ChangePasswordPage'

// Navbar
import Navbar from './components/Navbar'

// 🆕 Guards
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'

// 🆕 Admin Layout
import AdminLayout from './layouts/AdminLayout'

// 🆕 Admin Pages
import AdminBooksPage from './pages/admin/AdminBooksPage'
import AdminAuthorsPage from './pages/admin/AdminAuthorsPage'
import AdminMembersPage from './pages/admin/AdminMembersPage'

function App() {
  const location = useLocation()
  const isAdminPage = location.pathname.startsWith('/admin')

  return (
    <>
      {/* Navbar — Admin pe hide aur baaki public pages pe show */}
      {!isAdminPage && <Navbar />} 

      <Routes>
        {/* ──── Public Routes ──── */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* ──── Protected Routes ──── */}
        <Route path="/profile" element={
          <PrivateRoute><ProfilePage /></PrivateRoute>
        } />
        <Route path="/change-password" element={
          <PrivateRoute><ChangePasswordPage /></PrivateRoute>
        } />

        {/* ──── Admin Routes ──── */}
        <Route path="/admin" element={
          <AdminRoute><AdminLayout /></AdminRoute>
        }>
          <Route path="books" element={<AdminBooksPage />} />
          <Route path="authors" element={<AdminAuthorsPage />} />
          <Route path="members" element={<AdminMembersPage />} />
        </Route>
      </Routes>
    </>
  )
}

export default App