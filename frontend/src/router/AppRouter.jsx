import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import HomePage from '../pages/HomePage'
import NotFoundPage from '../pages/NotFoundPage'
import AdminPage from '../pages/admin/AdminPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import LoginPage from '../pages/auth/LoginPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'
import SignupPage from '../pages/auth/SignupPage'
import ChatRoomListPage from '../pages/chat/ChatRoomListPage'
import ChatRoomPage from '../pages/chat/ChatRoomPage'
import OwnerDashboardPage from '../pages/dashboard/OwnerDashboardPage'
import FavoriteHospitalListPage from '../pages/hospital/FavoriteHospitalListPage'
import HospitalDetailPage from '../pages/hospital/HospitalDetailPage'
import HospitalListPage from '../pages/hospital/HospitalListPage'
import MyPage from '../pages/mypage/MyPage'
import NotificationListPage from '../pages/notification/NotificationListPage'
import HealthCheckPage from '../pages/pet/HealthCheckPage'
import PetFormPage from '../pages/pet/PetFormPage'
import PetListPage from '../pages/pet/PetListPage'
import ReservationListPage from '../pages/reservation/ReservationListPage'
import WaitlistPage from '../pages/reservation/WaitlistPage'
import AdminRoute from './AdminRoute'
import OwnerRoute from './OwnerRoute'
import PrivateRoute from './PrivateRoute'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/pets" element={<PetListPage />} />
            <Route path="/pets/new" element={<PetFormPage />} />
            <Route path="/pets/:petId" element={<PetFormPage />} />
            <Route path="/health-check" element={<HealthCheckPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/hospitals" element={<HospitalListPage />} />
            <Route path="/hospitals/:hospitalId" element={<HospitalDetailPage />} />
            <Route path="/favorites" element={<FavoriteHospitalListPage />} />
            <Route path="/reservations" element={<ReservationListPage />} />
            <Route path="/waitlist" element={<WaitlistPage />} />
            <Route path="/notifications" element={<NotificationListPage />} />
            <Route path="/chats" element={<ChatRoomListPage />} />
            <Route path="/chats/:roomId" element={<ChatRoomPage />} />
            <Route element={<OwnerRoute />}>
              <Route path="/dashboard" element={<OwnerDashboardPage />} />
            </Route>
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
