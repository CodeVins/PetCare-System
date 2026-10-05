import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import AdminRoute from './AdminRoute'
import OwnerRoute from './OwnerRoute'
import PrivateRoute from './PrivateRoute'

// 변경(2026-09-27): 페이지 전부 React.lazy로 라우트 단위 분리 — 번들 718KB 경고, 특히 /admin/*은
// 일반 사용자에게 불필요 (이전: 전 페이지 정적 import로 단일 번들)
const HomePage = lazy(() => import('../pages/HomePage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))
const AdminHospitalsPage = lazy(() => import('../pages/admin/AdminHospitalsPage'))
const AdminLayout = lazy(() => import('../pages/admin/AdminLayout'))
const AdminOverviewPage = lazy(() => import('../pages/admin/AdminOverviewPage'))
const AdminReservationsPage = lazy(() => import('../pages/admin/AdminReservationsPage'))
const AdminReportsPage = lazy(() => import('../pages/admin/AdminReportsPage'))
const AdminReviewsPage = lazy(() => import('../pages/admin/AdminReviewsPage'))
const AdminStatsPage = lazy(() => import('../pages/admin/AdminStatsPage'))
const AdminUserDetailPage = lazy(() => import('../pages/admin/AdminUserDetailPage'))
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage'))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'))
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'))
const SignupPage = lazy(() => import('../pages/auth/SignupPage'))
const ChatRoomListPage = lazy(() => import('../pages/chat/ChatRoomListPage'))
const ChatRoomPage = lazy(() => import('../pages/chat/ChatRoomPage'))
const OwnerLayout = lazy(() => import('../pages/dashboard/OwnerLayout'))
const OwnerOverviewPage = lazy(() => import('../pages/dashboard/OwnerOverviewPage'))
const OwnerSlotsPage = lazy(() => import('../pages/dashboard/OwnerSlotsPage'))
const OwnerStatsPage = lazy(() => import('../pages/dashboard/OwnerStatsPage'))
const OwnerHospitalPage = lazy(() => import('../pages/dashboard/OwnerHospitalPage'))
const FavoriteHospitalListPage = lazy(() => import('../pages/hospital/FavoriteHospitalListPage'))
const HospitalDetailPage = lazy(() => import('../pages/hospital/HospitalDetailPage'))
const HospitalListPage = lazy(() => import('../pages/hospital/HospitalListPage'))
const AccountSettingsPage = lazy(() => import('../pages/mypage/AccountSettingsPage'))
const MyPage = lazy(() => import('../pages/mypage/MyPage'))
const MyReviewsPage = lazy(() => import('../pages/mypage/MyReviewsPage'))
const NotificationSettingsPage = lazy(() => import('../pages/mypage/NotificationSettingsPage'))
const NotificationListPage = lazy(() => import('../pages/notification/NotificationListPage'))
const HealthCheckPage = lazy(() => import('../pages/pet/HealthCheckPage'))
const PetFormPage = lazy(() => import('../pages/pet/PetFormPage'))
const PetListPage = lazy(() => import('../pages/pet/PetListPage'))
const ReservationListPage = lazy(() => import('../pages/reservation/ReservationListPage'))
const WaitlistPage = lazy(() => import('../pages/reservation/WaitlistPage'))
const NoticeListPage = lazy(() => import('../pages/support/NoticeListPage'))
const NoticeDetailPage = lazy(() => import('../pages/support/NoticeDetailPage'))
const FaqPage = lazy(() => import('../pages/support/FaqPage'))
const TermsPage = lazy(() => import('../pages/support/TermsPage'))
const PrivacyPage = lazy(() => import('../pages/support/PrivacyPage'))

export default function AppRouter() {
  return (
    <BrowserRouter>
      {/* 레이아웃 밖 페이지(로그인 등)·레이아웃 청크 로딩용. 레이아웃 안 페이지는 각 레이아웃의
          Outlet을 감싼 Suspense가 받아서 헤더/사이드바는 그대로 유지된다 */}
      <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* 관리자 패널 — 소비자 앱 Layout(하단 탭바 등)과 완전히 분리된
              AdminLayout 아래에서 렌더된다. ADMIN 전용, HOSPITAL_OWNER는
              기존처럼 /dashboard를 쓴다. 비회원 처리는 AdminRoute가 직접. */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminOverviewPage />} />
              <Route path="/admin/stats" element={<AdminStatsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/users/:userId" element={<AdminUserDetailPage />} />
              <Route path="/admin/hospitals" element={<AdminHospitalsPage />} />
              <Route path="/admin/reservations" element={<AdminReservationsPage />} />
              <Route path="/admin/reviews" element={<AdminReviewsPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
            </Route>
          </Route>

          {/* 변경(2026-09-30): 병원 소유자 대시보드를 소비자 Layout 안의 탭 한 화면에서, 관리자 패널과 같은
              AdminLayout 쉘(OwnerLayout)의 하위 화면들로 분리. HOSPITAL_OWNER 전용 — ADMIN은 /admin으로
              (이전: Layout > PrivateRoute > OwnerRoute(OWNER+ADMIN) 아래 /dashboard 하나, 병원 선택지는 전체 병원) */}
          <Route element={<OwnerRoute />}>
            <Route element={<OwnerLayout />}>
              <Route path="/dashboard" element={<OwnerOverviewPage />} />
              <Route path="/dashboard/reservations" element={<AdminReservationsPage />} />
              <Route path="/dashboard/slots" element={<OwnerSlotsPage />} />
              <Route path="/dashboard/stats" element={<OwnerStatsPage />} />
              <Route path="/dashboard/reviews" element={<AdminReviewsPage />} />
              <Route path="/dashboard/reports" element={<AdminReportsPage />} />
              <Route path="/dashboard/hospital" element={<OwnerHospitalPage />} />
            </Route>
          </Route>

          {/* 변경(2026-09-27): Layout을 바깥으로 빼고 홈·병원 목록/상세는 비회원 공개, 나머지만
              PrivateRoute(비회원이면 "로그인 후 이용" 안내) 아래로 (이전: 전부 PrivateRoute → /login) */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/hospitals" element={<HospitalListPage />} />
            <Route path="/hospitals/:hospitalId" element={<HospitalDetailPage />} />
            <Route path="/notices" element={<NoticeListPage />} />
            <Route path="/notices/:noticeId" element={<NoticeDetailPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            <Route element={<PrivateRoute />}>
              <Route path="/pets" element={<PetListPage />} />
              <Route path="/pets/new" element={<PetFormPage />} />
              <Route path="/pets/:petId" element={<PetFormPage />} />
              <Route path="/health-check" element={<HealthCheckPage />} />
              <Route path="/mypage" element={<MyPage />} />
              <Route path="/mypage/notifications" element={<NotificationSettingsPage />} />
              <Route path="/mypage/account" element={<AccountSettingsPage />} />
              <Route path="/mypage/reviews" element={<MyReviewsPage />} />
              <Route path="/favorites" element={<FavoriteHospitalListPage />} />
              <Route path="/reservations" element={<ReservationListPage />} />
              <Route path="/waitlist" element={<WaitlistPage />} />
              <Route path="/notifications" element={<NotificationListPage />} />
              <Route path="/chats" element={<ChatRoomListPage />} />
              <Route path="/chats/:roomId" element={<ChatRoomPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
