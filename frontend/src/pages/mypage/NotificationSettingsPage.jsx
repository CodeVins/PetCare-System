import PageHeader from '../../components/common/PageHeader'
import NotificationPreferenceSection from './NotificationPreferenceSection'

export default function NotificationSettingsPage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader back title="알림 설정" />
      <NotificationPreferenceSection />
    </div>
  )
}
