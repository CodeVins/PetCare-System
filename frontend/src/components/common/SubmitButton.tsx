import type { ComponentProps } from 'react'
import { useFormStatus } from 'react-dom'
import Button from './Button'

// <form action={...}> 안에서 쓰는 제출 버튼 — React 19 useFormStatus로 부모 폼의
// 진행 상태를 직접 읽어서 loading prop을 따로 내려줄 필요가 없다.
export default function SubmitButton(props: Omit<ComponentProps<typeof Button>, 'type' | 'loading'>) {
  const { pending } = useFormStatus()
  return <Button type="submit" loading={pending} {...props} />
}
