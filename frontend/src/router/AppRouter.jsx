import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import HomePage from '../pages/HomePage'
import NotFoundPage from '../pages/NotFoundPage'
import AdminHospitalsPage from '../pages/admin/AdminHospitalsPage'
import AdminLayout from '../pages/admin/AdminLayout'
import AdminOverviewPage from '../pages/admin/AdminOverviewPage'
import AdminReservationsPage from '../pages/admin/AdminReservationsPage'
import AdminReviewsPage from '../pages/admin/AdminReviewsPage'
import AdminStatsPage from '../pages/admin/AdminStatsPage'
import AdminUserDetailPage from '../pages/admin/AdminUserDetailPage'
import AdminUsersPage from '../pages/admin/AdminUsersPage'
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
import AccountSettingsPage from '../pages/mypage/AccountSettingsPage'
import MyPage from '../pages/mypage/MyPage'
import NotificationSettingsPage from '../pages/mypage/NotificationSettingsPage'
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
          {/* 관리자 패널 — 소비자 앱 Layout(하단 탭바 등)과 완전히 분리된
              AdminLayout 아래에서 렌더된다. ADMIN 전용, HOSPITAL_OWNER는
              기존처럼 /dashboard를 쓴다. */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminOverviewPage />} />
              <Route path="/admin/stats" element={<AdminStatsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/users/:userId" element={<AdminUserDetailPage />} />
              <Route path="/admin/hospitals" element={<AdminHospitalsPage />} />
              <Route path="/admin/reservations" element={<AdminReservationsPage />} />
              <Route path="/admin/reviews" element={<AdminReviewsPage />} />
            </Route>
          </Route>

          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/pets" element={<PetListPage />} />
            <Route path="/pets/new" element={<PetFormPage />} />
            <Route path="/pets/:petId" element={<PetFormPage />} />
            <Route path="/health-check" element={<HealthCheckPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/mypage/notifications" element={<NotificationSettingsPage />} />
            <Route path="/mypage/account" element={<AccountSettingsPage />} />
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
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
