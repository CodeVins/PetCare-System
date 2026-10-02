import { errorMessage } from '../../api/axiosInstance'
import { PaperPlaneTilt } from '@phosphor-icons/react'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { getChatMessages, sendChatMessage, subscribeChatRoom } from '../../api/chatApi'
import Alert from '../../components/common/Alert'
import PageHeader from '../../components/common/PageHeader'
import { useAuth } from '../../hooks/useAuth'
import type { ChatMessage } from '../../types/api'

const dayLabel = (value: string) =>
  new Date(value).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

const timeLabel = (value: string) =>
  new Date(value).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })

const appendUnique = (messages: ChatMessage[], message: ChatMessage) =>
  messages.some((m) => m.id === message.id) ? messages : [...messages, message]

export default function ChatRoomPage() {
  const { roomId = '' } = useParams()
  const { userId } = useAuth()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(() => {
    getChatMessages(roomId)
      .then(({ data }) => setMessages(data.data.content))
      .catch((err) =>
        setError(errorMessage(err, '메시지를 불러오지 못했습니다.')),
      )
      .finally(() => setLoading(false))
  }, [roomId])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // 변경(2026-10-02): 알림 SSE를 받을 때마다 목록 전체 재조회 → 채팅방 WebSocket 구독으로 새 메시지만 붙임
  // (이전: 아무 알림에나 재조회했고, 채팅 알림을 끈 유저는 실시간 갱신이 안 됐음)
  useEffect(
    () =>
      subscribeChatRoom(
        roomId,
        (message) => setMessages((prev) => appendUnique(prev, message)),
        loadMessages,
      ),
    [roomId, loadMessages],
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages])

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content) return
    setSending(true)
    setError('')
    try {
      const { data } = await sendChatMessage(roomId, content)
      // 변경(2026-10-02): 중복 없이 추가 — 내 메시지도 WebSocket으로 다시 오고, REST 응답보다 먼저 올 수 있음
      // (이전: 그냥 append)
      setMessages((prev) => appendUnique(prev, data.data))
      setDraft('')
    } catch (err) {
      setError(errorMessage(err, '전송에 실패했습니다.'))
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
