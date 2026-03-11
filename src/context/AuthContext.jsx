import { createContext, useContext, useState } from 'react'

// 1. Context banao
const AuthContext = createContext()

// 2. Provider — jo data provide karega
export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        // Page refresh pe localStorage se user lo
        const saved = localStorage.getItem('user')
        return saved ? JSON.parse(saved) : null
    })

    const [accessToken, setAccessToken] = useState(() => {
        return localStorage.getItem('accessToken') || null
    })

    // Login function
    const login = (data) => {
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        setAccessToken(data.accessToken)
    }

    // Logout function
    const logout = () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        setUser(null)
        setAccessToken(null)
    }

    const isAdmin = user?.roles?.includes('Admin')
    const isLoggedIn = !!user

    return (
        <AuthContext.Provider value={{
            user,
            accessToken,
            login,
            logout,
            isAdmin,
            isLoggedIn
        }}>
            {children}
        </AuthContext.Provider>
    )
}

// 3. Custom hook — easy use ke liye
export function useAuth() {
    return useContext(AuthContext)
}