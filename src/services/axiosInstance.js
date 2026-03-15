import axios from 'axios'
import { API_URL } from '../config'

// =====================
// Axios Instance
// =====================
const axiosInstance = axios.create({
    baseURL: API_URL
})

// =====================
// Helper Functions
// =====================
const getAccessToken = () => localStorage.getItem('accessToken')
const getRefreshToken = () => localStorage.getItem('refreshToken')

const saveTokens = (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
}

const clearAuth = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('isGoogleUser')
    window.dispatchEvent(new Event('auth:logout'))
    window.location.href = '/login'
}

// =====================
// Request Interceptor
// Har request mein token lagao
// =====================
axiosInstance.interceptors.request.use(
    (config) => {
        const token = getAccessToken()
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// =====================
// Response Interceptor
// 401 aaye toh refresh karo
// =====================
let isRefreshing = false       // Ek baar hi refresh ho
let failedQueue = []           // Pending requests queue

// Queue process karo — success ya fail
const processQueue = (error, token = null) => {
    failedQueue.forEach(promise => {
        if (error) {
            promise.reject(error)
        } else {
            promise.resolve(token)
        }
    })
    failedQueue = []
}

axiosInstance.interceptors.response.use(
    // Success — seedha return karo
    (response) => response,

    // Error — 401 check karo
    async (error) => {
        const originalRequest = error.config

        // 401 aaya aur yeh retry nahi hai
        if (error.response?.status === 401 && !originalRequest._retry) {

            // Agar pehle se refresh chal raha hai
            if (isRefreshing) {
                // Queue mein daal do — naya token aane pe retry hoga
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`
                    return axiosInstance(originalRequest)
                })
            }

            originalRequest._retry = true
            isRefreshing = true

            const refreshToken = getRefreshToken()

            // Refresh token bhi nahi hai — logout karo
            if (!refreshToken) {
                clearAuth()
                window.location.href = '/login'
                return Promise.reject(error)
            }

            try {
                // Naya token lo
                const response = await axios.post(`${API_URL}/auth/refresh-token`, {
                    refreshToken
                })

                const { accessToken, refreshToken: newRefreshToken } = response.data

                // Tokens save karo
                saveTokens(accessToken, newRefreshToken)

                // Queue mein pending requests ko naya token do
                processQueue(null, accessToken)

                // Original request retry karo
                originalRequest.headers.Authorization = `Bearer ${accessToken}`
                return axiosInstance(originalRequest)

            } catch (refreshError) {
                // Refresh bhi fail — logout karo
                processQueue(refreshError, null)
                clearAuth()
                window.location.href = '/login'
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

export default axiosInstance