import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function Layout() {
  return (
    <div className="min-h-dvh bg-stone-50">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:pb-10">
        <Outlet />
      </main>
    </div>
  )
}
