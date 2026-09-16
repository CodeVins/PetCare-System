import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/auth/LoginPage'
import SignupPage from '../pages/auth/SignupPage'
import HospitalDetailPage from '../pages/hospital/HospitalDetailPage'
import HospitalListPage from '../pages/hospital/HospitalListPage'
import MyPage from '../pages/mypage/MyPage'
import NotificationListPage from '../pages/notification/NotificationListPage'
import PetFormPage from '../pages/pet/PetFormPage'
import PetListPage from '../pages/pet/PetListPage'
import ReservationListPage from '../pages/reservation/ReservationListPage'
import PrivateRoute from './PrivateRoute'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/pets" element={<PetListPage />} />
            <Route path="/pets/new" element={<PetFormPage />} />
            <Route path="/pets/:petId" element={<PetFormPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/hospitals" element={<HospitalListPage />} />
            <Route path="/hospitals/:hospitalId" element={<HospitalDetailPage />} />
            <Route path="/reservations" element={<ReservationListPage />} />
            <Route path="/notifications" element={<NotificationListPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
