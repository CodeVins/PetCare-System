import { PaperPlaneRight } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getChatMessages, sendChatMessage } from '../../api/chatApi'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'

export default function ChatRoomPage() {
  const { roomId } = useParams()
  const { userId } = useAuth()
  const { lastNotificationAt } = useNotifications()

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const loadMessages = () => {
    getChatMessages(roomId)
      .then(({ data }) => setMessages(data.data.content))
      .catch((err) => setError(err.response?.data?.message || '메시지를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  useEffect(() => {
    // Notification payload doesn't carry roomId, so any SSE "notification"
    // while this page is open just triggers a refetch (harmless over-fetch).
    if (lastNotificationAt) loadMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastNotificationAt])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages])

  const handleSend = async (event) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content) return
    setSending(true)
    setError('')
    try {
      const { data } = await sendChatMessage(roomId, content)
      setMessages((prev) => [...prev, data.data])
      setDraft('')
    } catch (err) {
      setError(err.response?.data?.message || '전송에 실패했습니다.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-stone-900">채팅</h1>

      <div className="flex h-[60vh] flex-col gap-2 overflow-y-auto rounded-2xl border border-stone-200 bg-white p-4">
        {loading && <div className="h-full animate-pulse rounded-xl bg-stone-100" />}

        {!loading && messages.length === 0 && (
          <p className="m-auto text-sm text-stone-400">아직 메시지가 없습니다.</p>
        )}

        {!loading &&
          messages.map((message) => {
            const isMine = message.senderId === userId
            return (
              <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    isMine ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-900'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            )
          })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="메시지를 입력하세요"
          className="flex-1 rounded-full border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          aria-label="전송"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          <PaperPlaneRight size={18} weight="fill" />
        </button>
      </form>
    </div>
  )
}
