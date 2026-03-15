// src/services/authorService.js
// Author ke liye sab API calls — axiosInstance use kar raha hai (token auto-attach)

import axiosInstance from './axiosInstance'

// ─── Get All Authors ──────────────────────────────────
export const getAuthors = async () => {
    const response = await axiosInstance.get('/author')
    return response.data
}

// ─── Create Author ────────────────────────────────────
export const createAuthor = async (data) => {
    const response = await axiosInstance.post('/author', data)
    return response.data
}

// ─── Update Author ────────────────────────────────────
export const updateAuthor = async (id, data) => {
    const response = await axiosInstance.put(`/author/${id}`, data)
    return response.data
}

// ─── Delete Author ────────────────────────────────────
export const deleteAuthor = async (id) => {
    const response = await axiosInstance.delete(`/author/${id}`)
    return response.data
}