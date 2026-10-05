import type { PageResponse, Review, ReviewReply } from '../types/api'
import axiosInstance, { type ApiPromise } from './axiosInstance'

interface ReviewPayload {
  rating: number
  content: string
}

// 비회원도 조회 가능 (mine은 전부 false)
export function getReviews(hospitalId: number | string): ApiPromise<PageResponse<Review>> {
  return axiosInstance.get(`/api/hospitals/${hospitalId}/reviews`, { params: { size: 100 } })
}

export function createReview(
  hospitalId: number | string,
  { rating, content }: ReviewPayload,
): ApiPromise<Review> {
  return axiosInstance.post(`/api/hospitals/${hospitalId}/reviews`, { rating, content })
}

export function updateReview(
  hospitalId: number | string,
  reviewId: number,
  { rating, content }: ReviewPayload,
): ApiPromise<Review> {
  return axiosInstance.patch(`/api/hospitals/${hospitalId}/reviews/${reviewId}`, {
    rating,
    content,
  })
}

export function deleteReview(hospitalId: number | string, reviewId: number): ApiPromise<null> {
  return axiosInstance.delete(`/api/hospitals/${hospitalId}/reviews/${reviewId}`)
}

export function reportReview(
  hospitalId: number | string,
  reviewId: number,
  reason: string,
): ApiPromise<null> {
  return axiosInstance.post(`/api/hospitals/${hospitalId}/reviews/${reviewId}/report`, {
    reason,
  })
}

export function createReply(
  hospitalId: number | string,
  reviewId: number,
  content: string,
): ApiPromise<ReviewReply> {
  return axiosInstance.post(`/api/hospitals/${hospitalId}/reviews/${reviewId}/reply`, {
    content,
  })
}

export function updateReply(
  hospitalId: number | string,
  reviewId: number,
  content: string,
): ApiPromise<ReviewReply> {
  return axiosInstance.patch(`/api/hospitals/${hospitalId}/reviews/${reviewId}/reply`, {
    content,
  })
}

export function deleteReply(hospitalId: number | string, reviewId: number): ApiPromise<null> {
  return axiosInstance.delete(`/api/hospitals/${hospitalId}/reviews/${reviewId}/reply`)
}

// 리뷰 사진 — 리뷰를 먼저 만든 뒤 한 장씩 올림(리뷰당 최대 3장, 작성자만)
export const MAX_REVIEW_IMAGES = 3

export function uploadReviewImage(
  hospitalId: number | string,
  reviewId: number,
  file: File,
): ApiPromise<Review> {
  const formData = new FormData()
  formData.append('file', file)
  return axiosInstance.post(`/api/hospitals/${hospitalId}/reviews/${reviewId}/images`, formData)
}

// imageUrl의 마지막 경로(서버가 만든 UUID 파일명)로 삭제
export function deleteReviewImage(
  hospitalId: number | string,
  reviewId: number,
  imageUrl: string,
): ApiPromise<Review> {
  const fileName = imageUrl.slice(imageUrl.lastIndexOf('/') + 1)
  return axiosInstance.delete(`/api/hospitals/${hospitalId}/reviews/${reviewId}/images/${fileName}`)
}
