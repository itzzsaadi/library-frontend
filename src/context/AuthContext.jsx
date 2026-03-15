import { createContext, useContext, useState, useEffect } from 'react'

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
        localStorage.setItem('isGoogleUser', data.isGoogleUser ? 'true' : 'false')
        setUser(data.user)
        setAccessToken(data.accessToken)
        setIsGoogleUser(data.isGoogleUser ? true : false)
    }

    // Logout function
    const logout = () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        localStorage.removeItem('isGoogleUser')
        setUser(null)
        setAccessToken(null)
        setIsGoogleUser(false)
    }

    useEffect(() => {
        window.addEventListener('auth:logout', logout)
        return () => window.removeEventListener('auth:logout', logout) // cleanup
    }, [])

    // State mein add karo
    const [isGoogleUser, setIsGoogleUser] = useState(() => {
        return localStorage.getItem('isGoogleUser') === 'true'
    })

    const isAdmin = user?.roles?.includes('Admin')
    const isLoggedIn = !!user

    return (
        <AuthContext.Provider value={{
            user,
            accessToken,
            login,
            logout,
            isAdmin,
            isLoggedIn,
            isGoogleUser
        }}>
            {children}
        </AuthContext.Provider>
    )
}

// 3. Custom hook — easy use ke liye
export function useAuth() {
    return useContext(AuthContext)
}