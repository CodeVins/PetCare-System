import axiosInstance from './axiosInstance'

export function getReviews(hospitalId) {
  return axiosInstance.get(`/api/hospitals/${hospitalId}/reviews`, { params: { size: 100 } })
}

export function createReview(hospitalId, { rating, content }) {
  return axiosInstance.post(`/api/hospitals/${hospitalId}/reviews`, { rating, content })
}

export function updateReview(hospitalId, reviewId, { rating, content }) {
  return axiosInstance.patch(`/api/hospitals/${hospitalId}/reviews/${reviewId}`, {
    rating,
    content,
  })
}

export function deleteReview(hospitalId, reviewId) {
  return axiosInstance.delete(`/api/hospitals/${hospitalId}/reviews/${reviewId}`)
}

export function reportReview(hospitalId, reviewId, reason) {
  return axiosInstance.post(`/api/hospitals/${hospitalId}/reviews/${reviewId}/report`, {
    reason,
  })
}

export function createReply(hospitalId, reviewId, content) {
  return axiosInstance.post(`/api/hospitals/${hospitalId}/reviews/${reviewId}/reply`, {
    content,
  })
}

export function updateReply(hospitalId, reviewId, content) {
  return axiosInstance.patch(`/api/hospitals/${hospitalId}/reviews/${reviewId}/reply`, {
    content,
  })
}

export function deleteReply(hospitalId, reviewId) {
  return axiosInstance.delete(`/api/hospitals/${hospitalId}/reviews/${reviewId}/reply`)
}
