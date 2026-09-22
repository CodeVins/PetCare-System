import { PaperPlaneTilt } from '@phosphor-icons/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getChatMessages, sendChatMessage } from '../../api/chatApi'
import Alert from '../../components/common/Alert'
import PageHeader from '../../components/common/PageHeader'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'

const dayLabel = (value) =>
  new Date(value).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

const timeLabel = (value) =>
  new Date(value).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })

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

  const loadMessages = useCallback(() => {
    getChatMessages(roomId)
      .then(({ data }) => setMessages(data.data.content))
      .catch((err) =>
        setError(err.response?.data?.message || '메시지를 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [roomId])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  useEffect(() => {
    // Notification payload doesn't carry roomId, so any SSE "notification"
    // while this page is open just triggers a refetch (harmless over-fetch).
    if (lastNotificationAt) loadMessages()
  }, [lastNotificationAt, loadMessages])

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
    <div className="mx-auto flex max-w-2xl flex-col">
      <PageHeader back title="채팅" />

      <div className="card flex h-[62vh] flex-col gap-3 overflow-y-auto p-4">
        {loading && <div className="h-full animate-pulse rounded-xl bg-stone-100" />}

        {!loading && messages.length === 0 && (
          <p className="m-auto text-sm text-stone-500">아직 메시지가 없습니다.</p>
        )}

        {!loading &&
          messages.map((message, index) => {
            const isMine = message.senderId === userId
            // 날짜가 바뀌는 첫 메시지 앞에만 날짜 구분선을 넣는다
            const previous = messages[index - 1]
            const showDay =
              !previous ||
              new Date(previous.createdAt).toDateString() !==
                new Date(message.createdAt).toDateString()

            return (
              <div key={message.id} className="contents">
                {showDay && (
                  <span className="badge badge-neutral self-center font-normal text-stone-600">
                    {dayLabel(message.createdAt)}
                  </span>
                )}
                <div
                  className={`flex max-w-[78%] flex-col gap-0.5 ${
                    isMine ? 'items-end self-end' : 'self-start'
                  }`}
                >
                  <div
                    className={`whitespace-pre-wrap px-3.5 py-2.5 ${
                      isMine
                        ? 'rounded-[18px_18px_4px_18px] bg-brand-600 text-white'
                        : 'rounded-[18px_18px_18px_4px] bg-stone-200 text-stone-900'
                    }`}
                  >
                    {message.content}
                  </div>
                  <span
                    className={`text-xs text-stone-600 ${isMine ? 'pr-1' : 'pl-1'}`}
                  >
                    {timeLabel(message.createdAt)}
                  </span>
                </div>
              </div>
            )
          })}
        <div ref={bottomRef} />
      </div>

      <Alert tone="error" className="mt-3">
        {error}
      </Alert>

      <form onSubmit={handleSend} className="mt-3 flex items-center gap-2">
        <label htmlFor="chat-draft" className="sr-only">
          메시지 입력
        </label>
        <input
          id="chat-draft"
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="메시지를 입력하세요"
          className="input flex-1 rounded-full px-4"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          aria-label="보내기"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:bg-stone-300"
        >
          <PaperPlaneTilt size={22} weight="fill" />
        </button>
      </form>
    </div>
  )
}
