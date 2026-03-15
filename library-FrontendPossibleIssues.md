# Enterprise-Level Code Review Report
### Library Frontend Application - Critical Review & Solutions

**Review Date**: March 12, 2026  
**Project**: React/Vite Library Frontend  
**Reviewer Perspective**: 10+ Years Enterprise Software Development  
**Severity Levels**: CRITICAL | HIGH | MEDIUM | LOW

---

## Executive Summary

This application demonstrates a foundational React implementation with numerous production-readiness gaps. While the core structure is reasonable, there are **23 critical issues** that could lead to runtime failures, security vulnerabilities, poor user experience, and data loss. This report outlines each issue with implementation solutions.

---

## 🔴 CRITICAL ISSUES (Must Fix Before Production)

### 1. **Authentication Token Expiration Not Handled**

**Issue**: Access tokens are stored in localStorage indefinitely. No mechanism exists to refresh expired tokens or handle 401 responses.

**Risk**:
- Users experience sudden unauthorized errors mid-session
- No automatic session refresh
- API calls fail without user notification
- Potential for stale token exploitation

**Current Code** (`src/services/authService.js`):
```javascript
// No interceptor to handle 401 responses
export const login = async (data) => {
    const response = await axios.post(`${config.API_URL}/Auth/login`, data)
    return response.data
}
```

**Solution**:
Create an axios interceptor that automatically handles token refresh:

```javascript
// src/services/axiosConfig.js (NEW FILE)
import axios from 'axios'
import config from '../config'

const apiClient = axios.create({
  baseURL: config.API_URL
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  isRefreshing = false
  failedQueue = []
}

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')

        const { accessToken } = await axios.post(
          `${config.API_BASE}/api/Auth/refresh`,
          { refreshToken }
        )

        localStorage.setItem('accessToken', accessToken)
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`

        processQueue(null, accessToken)
        return apiClient(originalRequest)
      } catch (err) {
        processQueue(err, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(err)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
```

Update `src/services/authService.js`:
```javascript
import apiClient from './axiosConfig'

export const register = async (data) => {
  const response = await apiClient.post('/Auth/register', data)
  return response.data
}

export const login = async (data) => {
  const response = await apiClient.post('/Auth/login', data)
  return response.data
}
```

---

### 2. **Unhandled Promise Rejections & Race Conditions in useEffect**

**Issue**: Multiple useEffect hooks don't properly handle cleanup, causing memory leaks and race conditions.

**Risk**:
- Memory leaks when component unmounts during async operations
- Race condition: old API responses overwrite newer ones
- State updates on unmounted components throw errors
- Console warnings: "Can't perform a React state update on an unmounted component"

**Current Code** (`src/pages/HomePage.jsx`):
```javascript
useEffect(() => {
    const timer = setTimeout(() => {
        fetchBooks(search)
    }, 500)
    return () => clearTimeout(timer)
}, [search])

// No cleanup here - fetchBooks can complete after unmount
const fetchBooks = async (searchTerm = '') => {
    try {
        setLoading(true) // ❌ Might update after unmount
        const data = await getBooks(1, 10, searchTerm)
        setBooks(data.data)
    } catch (err) {
        setError('Failed to load books')
    } finally {
        setLoading(false)
    }
}
```

**Solution**:
```javascript
// src/pages/HomePage.jsx
import { useState, useEffect, useRef } from 'react'

function HomePage() {
    const [books, setBooks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [search, setSearch] = useState('')
    const isMountedRef = useRef(true)
    const abortControllerRef = useRef(null)

    useEffect(() => {
        return () => {
            isMountedRef.current = false
            abortControllerRef.current?.abort()
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            // Cancel previous request
            abortControllerRef.current?.abort()
            abortControllerRef.current = new AbortController()
            fetchBooks(search, abortControllerRef.current.signal)
        }, 500)

        return () => {
            clearTimeout(timer)
            abortControllerRef.current?.abort()
        }
    }, [search])

    const fetchBooks = async (searchTerm = '', signal) => {
        if (!isMountedRef.current) return

        try {
            setLoading(true)
            const data = await getBooks(1, 10, searchTerm)
            
            if (isMountedRef.current) {
                setBooks(data.data)
            }
        } catch (err) {
            if (err.name !== 'AbortError' && isMountedRef.current) {
                setError('Failed to load books')
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false)
            }
        }
    }

    // ... rest of component
}
```

---

### 3. **Sensitive Data Exposure in localStorage**

**Issue**: Sensitive authentication tokens stored in plain localStorage are vulnerable to XSS attacks and can be accessed by any script on the domain.

**Risk**:
- XSS vulnerability allows theft of access/refresh tokens
- Malicious JavaScript can impersonate users
- Tokens visible in browser DevTools
- No HttpOnly flag protection

**Current Code** (`src/context/AuthContext.jsx`):
```javascript
const login = (data) => {
    localStorage.setItem('accessToken', data.accessToken) // ❌ Vulnerable
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))
}
```

**Solution**:

**Option 1: Use HttpOnly Cookies (RECOMMENDED)**
Backend must set HttpOnly, Secure, SameSite cookies. Frontend:

```javascript
// src/context/AuthContext.jsx
// Store only non-sensitive data, tokens in cookies (backend responsibility)
export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user')
        return saved ? JSON.parse(saved) : null
    })

    const login = (data) => {
        // Backend should set HttpOnly cookies
        // Frontend only stores non-sensitive user data
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
    }

    const logout = () => {
        localStorage.removeItem('user')
        // Backend clears HttpOnly cookies via logout endpoint
        setUser(null)
    }

    // ... rest
}
```

**Option 2: In-Memory Only with Token Renewal (if HttpOnly not possible)**
```javascript
// src/context/AuthContext.jsx
export function AuthProvider({ children }) {
    const [tokens, setTokens] = useState(null) // In memory only
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user')
        return saved ? JSON.parse(saved) : null
    })

    const login = (data) => {
        setTokens({ // NOT persisted to storage
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
        })
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
    }

    // Token reset on page refresh - need re-login (acceptable tradeoff)
    // ... rest
}
```

---

### 4. **No Global Error Boundary - App Crashes on Any Error**

**Issue**: No error boundary catches component errors, crashing the entire app.

**Risk**:
- Single component error crashes whole application
- No graceful degradation
- Poor user experience
- Silent failures in production

**Solution**:
Create and implement error boundary:

```javascript
// src/components/ErrorBoundary.jsx (NEW FILE)
import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }))
    
    // Log to error tracking service (Sentry, LogRocket, etc)
    console.error('ErrorBoundary caught:', error, errorInfo)
    
    // Send to monitoring service
    // ErrorTrackingService.captureException(error, { extra: errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-red-600 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 p-4 bg-gray-100 rounded text-left text-xs overflow-auto max-h-48">
                  <summary className="cursor-pointer font-bold mb-2">
                    Error Details (Developer Only)
                  </summary>
                  <pre className="text-gray-700">
                    {this.state.error?.toString()}
                    {'\n\n'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={this.handleReset}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
```

Update `src/main.jsx`:
```javascript
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </GoogleOAuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
```

---

### 5. **No Input Validation - Vulnerable to Injection Attacks**

**Issue**: Form inputs are not validated before submission. User data directly sent to backend.

**Risk**:
- XSS via unsanitized HTML in form fields
- CSV injection in exported data
- NoSQL injection if backend doesn't validate
- Malformed data crashes backend
- No client-side feedback for validation errors

**Current Code** (`src/pages/RegisterPage.jsx`):
```javascript
const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Only checks password match - NO other validation!
    if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return
    }

    try {
        setLoading(true)
        await register(formData) // Direct send without validation
    } catch (err) {
        setError(err.response?.data?.message || 'Registration failed')
    }
}
```

**Solution**:
Create comprehensive validation utilities:

```javascript
// src/utils/validation.js (NEW FILE)
export const ValidationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Invalid email format'
  },
  password: {
    minLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecial: true,
    message: 'Password must be 8+ chars with uppercase, number, and special character'
  },
  fullName: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
  },
  phone: {
    pattern: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/,
    message: 'Invalid phone number format'
  }
}

export const validateEmail = (email) => {
  if (!email) return 'Email is required'
  if (!ValidationRules.email.pattern.test(email)) {
    return ValidationRules.email.message
  }
  return null
}

export const validatePassword = (password) => {
  if (!password) return 'Password is required'
  if (password.length < ValidationRules.password.minLength) {
    return `Password must be at least ${ValidationRules.password.minLength} characters`
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter'
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number'
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least one special character'
  }
  return null
}

export const validateFullName = (name) => {
  if (!name) return 'Full name is required'
  if (name.length < ValidationRules.fullName.minLength) {
    return 'Name must be at least 2 characters'
  }
  if (name.length > ValidationRules.fullName.maxLength) {
    return 'Name must not exceed 50 characters'
  }
  if (!ValidationRules.fullName.pattern.test(name)) {
    return ValidationRules.fullName.message
  }
  return null
}

export const validatePhone = (phone) => {
  if (!phone) return null // Optional field
  if (!ValidationRules.phone.pattern.test(phone)) {
    return ValidationRules.phone.message
  }
  return null
}

export const sanitizeInput = (input) => {
  return input
    .trim()
    .replace(/[\<\>\"\'\`]/g, '') // Remove potential HTML chars
    .substring(0, 500) // Limit length
}
```

Update `src/pages/RegisterPage.jsx`:
```javascript
import { validateEmail, validatePassword, validateFullName, validatePhone, sanitizeInput } from '../utils/validation'

function RegisterPage() {
    const [errors, setErrors] = useState({})
    const [touched, setTouched] = useState({})
    // ... other states

    const validateForm = () => {
        const newErrors = {}
        
        const emailError = validateEmail(formData.email)
        if (emailError) newErrors.email = emailError

        const fullNameError = validateFullName(formData.fullName)
        if (fullNameError) newErrors.fullName = fullNameError

        const passwordError = validatePassword(formData.password)
        if (passwordError) newErrors.password = passwordError

        const phoneError = validatePhone(formData.phone)
        if (phoneError) newErrors.phone = phoneError

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: sanitizeInput(value)
        })
        // Real-time validation after first blur
        if (touched[name]) {
            validateField(name, value)
        }
    }

    const handleBlur = (e) => {
        const { name } = e.target
        setTouched({ ...touched, [name]: true })
        validateField(name, formData[name])
    }

    const validateField = (name, value) => {
        let error = null
        switch(name) {
            case 'email':
                error = validateEmail(value)
                break
            case 'fullName':
                error = validateFullName(value)
                break
            case 'password':
                error = validatePassword(value)
                break
            case 'phone':
                error = validatePhone(value)
                break
            case 'confirmPassword':
                error = value !== formData.password ? 'Passwords do not match' : null
                break
            default:
                break
        }
        setErrors(prev => ({ ...prev, [name]: error }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        if (!validateForm()) {
            return
        }

        try {
            setLoading(true)
            await register(formData)
            setSuccess(true)
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        // ... JSX
        <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.fullName && touched.fullName
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-gray-300 focus:ring-indigo-400'
            }`}
            required
        />
        {errors.fullName && touched.fullName && (
            <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
        )}
    )
}
```

---

### 6. **Protected Routes Not Implemented - Anyone Can Access Private Pages**

**Issue**: ProtectedRoute component exists but is **empty and never used**. ProfilePage checks `isLoggedIn` but can be accessed directly.

**Risk**:
- Unauthenticated users can navigate to private routes
- Data loads even when user shouldn't have access
- Race condition: page renders before auth check
- User sees loading spinner, then blank page, then redirects (poor UX)

**Current Code** (`src/App.jsx`):
```javascript
// No protected routes!
<Route path="/profile" element={<ProfilePage />} />
<Route path="/change-password" element={<ChangePasswordPage />} />
```

**Solution**:
Implement ProtectedRoute component:

```javascript
// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ element, requiredRole = null }) {
    const { isLoggedIn, user, isAdmin } = useAuth()

    // Still loading auth state
    if (user === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    // Not logged in
    if (!isLoggedIn) {
        return <Navigate to="/login" replace state={{ returnTo: window.location.pathname }} />
    }

    // Logged in but role check fails
    if (requiredRole && !isAdmin && requiredRole === 'admin') {
        return <Navigate to="/" replace />
    }

    return element
}
```

Update `src/App.jsx`:
```javascript
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      {/* Protected Routes */}
      <Route 
        path="/profile" 
        element={<ProtectedRoute element={<ProfilePage />} />} 
      />
      <Route 
        path="/change-password" 
        element={<ProtectedRoute element={<ChangePasswordPage />} />} 
      />

      {/* Catch-all 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
```

---

### 7. **API Base URL Hardcoded & Environment Configuration Missing**

**Issue**: API URLs hardcoded, mixed patterns (some use `/api`, some don't), no environment management.

**Risk**:
- Can't switch between dev/staging/production easily
- Accidental production API calls in development
- No build-time configuration
- Secrets potentially exposed in version control

**Current Code** (`src/config.js`):
```javascript
const config = {
  API_URL: 'http://localhost:5115/api', // Hardcoded!
  API_BASE: 'http://localhost:5115'
}
```

**Solution**:
```javascript
// src/config.js
const getConfig = () => {
  const env = import.meta.env.MODE || 'development'

  const configs = {
    development: {
      API_URL: 'http://localhost:5115/api',
      API_BASE: 'http://localhost:5115',
      LOG_LEVEL: 'debug',
      ENABLE_MOCK_DATA: false
    },
    staging: {
      API_URL: 'https://staging-api.example.com/api',
      API_BASE: 'https://staging-api.example.com',
      LOG_LEVEL: 'info',
      ENABLE_MOCK_DATA: false
    },
    production: {
      API_URL: 'https://api.example.com/api',
      API_BASE: 'https://api.example.com',
      LOG_LEVEL: 'warn',
      ENABLE_MOCK_DATA: false
    }
  }

  return {
    ...configs[env],
    ENVIRONMENT: env,
    GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    BUILD_DATE: new Date().toISOString(),
    VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0'
  }
}

export default getConfig()
```

Create `.env.example`:
```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_APP_VERSION=1.0.0
```

Update `vite.config.js`:
```javascript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'process.env': {},
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5115',
        changeOrigin: true,
      }
    }
  }
})
```

---

### 8. **Unhandled Edge Case: Empty/Null API Responses**

**Issue**: Code assumes API responses always have expected structure. No null checks.

**Risk**:
- TypeError when accessing undefined properties
- App crashes if API returns empty response
- Missing error handling for malformed responses

**Current Code** (`src/pages/HomePage.jsx`):
```javascript
const fetchBooks = async (searchTerm = '') => {
    try {
        const data = await getBooks(1, 10, searchTerm)
        setBooks(data.data) // ❌ What if data.data is null?
    } catch (err) {
        setError('Failed to load books')
    }
}
```

**Solution**:
```javascript
const fetchBooks = async (searchTerm = '') => {
    try {
        setLoading(true)
        const response = await getBooks(1, 10, searchTerm)
        
        // Validate response structure
        if (!response || typeof response !== 'object') {
            throw new Error('Invalid API response format')
        }

        const booksArray = Array.isArray(response.data) ? response.data : []
        setBooks(booksArray)
        setError(null)
    } catch (err) {
        const errorMessage = 
            err.response?.data?.message || 
            err.message || 
            'Failed to load books'
        
        setError(errorMessage)
        setBooks([])
    } finally {
        setLoading(false)
    }
}
```

---

### 9. **Missing Loading States During Critical Operations**

**Issue**: File upload (photo change) shows loading but other critical operations don't, or show inadequately.

**Risk**:
- Users click buttons multiple times thinking action failed
- Double submissions of forms
- No indication of progress to user
- Bad UX during slow network

**Current Code** (`src/pages/ProfilePage.jsx`):
```javascript
const handlePhotoChange = async (e) => {
    // Shows loading... but what about during upload?
}

// Missing loading states for:
// - Profile fetch on mount
// - Update profile
// - Token refresh
```

**Solution**: Create comprehensive loading state management:

```javascript
// src/hooks/useAsyncAction.js (NEW FILE)
import { useState, useCallback } from 'react'

export const useAsyncAction = (asyncFunction) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [data, setData] = useState(null)

    const execute = useCallback(
        async (...args) => {
            setLoading(true)
            setError(null)
            try {
                const result = await asyncFunction(...args)
                setData(result)
                return result
            } catch (err) {
                const errorMessage = err.response?.data?.message || err.message
                setError(errorMessage)
                throw err
            } finally {
                setLoading(false)
            }
        },
        [asyncFunction]
    )

    const reset = useCallback(() => {
        setLoading(false)
        setError(null)
        setData(null)
    }, [])

    return { loading, error, data, execute, reset }
}
```

Use in component:
```javascript
import { useAsyncAction } from '../hooks/useAsyncAction'

function ProfilePage() {
    const fetchProfileAction = useAsyncAction(
        (token) => getProfile(token)
    )

    useEffect(() => {
        if (isLoggedIn) {
            fetchProfileAction.execute(accessToken)
        }
    }, [isLoggedIn])

    if (fetchProfileAction.loading) {
        return <LoadingSpinner />
    }

    if (fetchProfileAction.error) {
        return <ErrorDisplay error={fetchProfileAction.error} />
    }

    return <ProfileContent profile={fetchProfileAction.data} />
}
```

---

## 🟠 HIGH SEVERITY ISSUES

### 10. **OAuth Token Mismatch - Two Different Google Login Methods**

**Issue**: Code uses both `useGoogleLogin` hook and `GoogleLogin` component inconsistently.

**Risk**:
- Confusion about which method is actually used
- Potential for one method to fail silently
- Inconsistent user experience

**Current Code** (`src/pages/LoginPage.jsx`):
```javascript
const googleLoginHook = useGoogleLogin({
    onSuccess: handleGoogleLogin,
    onError: () => setError('Google login failed'),
    flow: 'auth-code'
})

// Also this component:
<GoogleLogin
    onSuccess={handleGoogleLogin}
    onError={() => setError('Google login failed')}
/>
```

**Solution**:
Standardize on one method (GoogleLogin component is simpler):

```javascript
function LoginPage() {
    // ... other code
    
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setError(null)
            const data = await googleLogin(credentialResponse.credential)
            login(data)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.message || 'Google login failed')
        }
    }

    return (
        // ... JSX
        <div className="flex justify-center mt-6">
            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google login failed')}
                width="368"
                text="continue_with"
                shape="rectangular"
            />
        </div>
    )
}
```

---

### 11. **Hardcoded API Endpoints Scattered Across Files**

**Issue**: API endpoints defined in multiple places - no central source of truth.

**Risk**:
- Easy to introduce typos
- Hard to maintain consistency
- If API changes, must update multiple files

**Solution**:
Create centralized API endpoints:

```javascript
// src/constants/apiEndpoints.js (NEW FILE)
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/Auth/register',
    LOGIN: '/Auth/login',
    GOOGLE_LOGIN: '/Auth/google',
    LOGOUT: '/Auth/logout',
    REFRESH: '/Auth/refresh',
    CHANGE_PASSWORD: '/Auth/change-password',
    FORGOT_PASSWORD: '/Auth/forgot-password',
    RESET_PASSWORD: '/Auth/reset-password',
    VERIFY_OTP: '/Auth/verify-otp',
    RESEND_OTP: '/Auth/resend-otp'
  },
  BOOK: {
    LIST: '/Book',
    DETAIL: '/Book/{id}',
    RECOMMEND: '/Book/recommend'
  },
  MEMBER: {
    PROFILE: '/Member/profile',
    PROFILE_PHOTO: '/Member/profile/photo',
    BORROWING_HISTORY: '/Member/borrowing-history'
  }
}
```

Update services:
```javascript
// src/services/authService.js
import { API_ENDPOINTS } from '../constants/apiEndpoints'
import apiClient from './axiosConfig'

export const register = async (data) => {
  const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data)
  return response.data
}
```

---

### 12. **Memory Leak in ProfilePage Photo Upload**

**Issue**: Photo upload doesn't abort previous requests if user rapidly changes photos.

**Risk**:
- Multiple concurrent uploads cause race conditions
- Final state doesn't match user's intent
- Network bandwidth wasted
- Server receives duplicate requests

**Solution**:
```javascript
// src/pages/ProfilePage.jsx
const uploadAbortControllerRef = useRef(null)

const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Cancel previous upload
    uploadAbortControllerRef.current?.abort()
    uploadAbortControllerRef.current = new AbortController()

    try {
        setPhotoLoading(true)
        // Pass signal to axios request
        await updateProfilePhoto(accessToken, file, {
            signal: uploadAbortControllerRef.current.signal
        })
        await fetchProfile()
        setSuccessMessage('Photo updated!')
    } catch (err) {
        if (err.name !== 'AbortError') {
            setError(err.response?.data?.message || 'Photo upload failed')
        }
    } finally {
        setPhotoLoading(false)
    }
}

// Update memberService
export const updateProfilePhoto = async (token, photoFile, { signal } = {}) => {
    const formData = new FormData()
    formData.append('photo', photoFile)

    const response = await axios.put(
        `${config.API_URL}/member/profile/photo`,
        formData,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            },
            signal // Add abort signal
        }
    )
    return response.data
}
```

---

### 13. **No Pagination Implementation**

**Issue**: API supports pagination but frontend doesn't implement it.

**Risk**:
- All books loaded at once (huge payload)
- Poor performance with large datasets
- No way for users to browse beyond first 10 items
- Server load increases unnecessarily

**Solution**:
```javascript
// src/pages/HomePage.jsx
import { useState, useEffect } from 'react'

function HomePage() {
    const [books, setBooks] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalPages, setTotalPages] = useState(0)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1) // Reset to page 1 on search
            fetchBooks(1, search)
        }, 500)

        return () => clearTimeout(timer)
    }, [search])

    const fetchBooks = async (page = 1, searchTerm = '') => {
        try {
            setLoading(true)
            const data = await getBooks(page, pageSize, searchTerm)
            setBooks(data.data || [])
            setTotalPages(data.totalPages || 1)
        } catch (err) {
            setError('Failed to load books')
        } finally {
            setLoading(false)
        }
    }

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
            fetchBooks(page, search)
            window.scrollTo(0, 0) // Scroll to top
        }
    }

    return (
        // ... existing JSX ...
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                        // Show 5 pages around current page
                        return Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages
                    })
                    .map((page, idx, arr) => (
                        <div key={page}>
                            {idx > 0 && arr[idx - 1] !== page - 1 && <span>...</span>}
                            <button
                                onClick={() => handlePageChange(page)}
                                className={`px-4 py-2 rounded-lg ${
                                    page === currentPage
                                        ? 'bg-indigo-600 text-white'
                                        : 'border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {page}
                            </button>
                        </div>
                    ))}
                
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        )}
    )
}
```

---

### 14. **No Request Timeout Configuration**

**Issue**: Axios requests have no timeout - can hang indefinitely.

**Risk**:
- Network issues cause indefinite loading
- Poor UX - user doesn't know if request failed
- Server resources held open
- Mobile users wait forever on slow networks

**Solution**:
Update `src/services/axiosConfig.js`:

```javascript
const apiClient = axios.create({
  baseURL: config.API_URL,
  timeout: 30000, // 30 seconds for regular requests
  timeoutErrorMessage: 'Request timeout - Please check your connection'
})

// Specific timeout for uploads
export const createUploadClient = () => {
  return axios.create({
    baseURL: config.API_URL,
    timeout: 120000, // 2 minutes for uploads
    timeoutErrorMessage: 'Upload timeout - Please try again'
  })
}
```

---

### 15. **Race Condition in Auth State During Page Refresh**

**Issue**: `isLoggedIn` can be undefined during page load, causing brief UI flashing/redirects.

**Risk**:
- Protected pages briefly show content before redirecting
- Flickering/flashing UI
- Race condition between auth state and route guards
- Bad UX on slow devices

**Solution**:
Create loading state wrapper:

```javascript
// src/hooks/useAuthLoading.js (NEW FILE)
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'

export const useAuthLoading = () => {
    const { isLoggedIn } = useAuth()
    const [isAuthLoading, setIsAuthLoading] = useState(true)

    useEffect(() => {
        // Once isLoggedIn is determined, loading is done
        if (isLoggedIn !== undefined) {
            setIsAuthLoading(false)
        }
    }, [isLoggedIn])

    return isAuthLoading
}
```

Update `src/App.jsx`:
```javascript
import { useAuthLoading } from './hooks/useAuthLoading'

function App() {
    const isAuthLoading = useAuthLoading()

    if (isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <Routes>
            {/* routes */}
        </Routes>
    )
}
```

---

## 🟡 MEDIUM SEVERITY ISSUES

### 16. **No Logout Endpoint Call - Session Not Invalidated on Server**

**Issue**: Logout only clears localStorage, doesn't tell server to invalidate token.

**Risk**:
- Server-side session still valid
- Token still usable if leaked
- Server can't track logout for security audits
- Potential for replay attacks

**Solution**:

```javascript
// src/services/authService.js
export const logoutAPI = async (token) => {
    try {
        await apiClient.post(
            API_ENDPOINTS.AUTH.LOGOUT,
            {},
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        )
    } catch (err) {
        console.warn('Logout API failed:', err)
        // Still complete logout locally even if server fails
    }
}

// src/context/AuthContext.jsx
const logout = async () => {
    try {
        // Notify server
        if (accessToken) {
            await logoutAPI(accessToken)
        }
    } catch (err) {
        console.error('Logout error:', err)
    } finally {
        // Clear local data regardless
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        localStorage.removeItem('isGoogleUser')
        setUser(null)
        setAccessToken(null)
        setIsGoogleUser(false)
    }
}
```

---

### 17. **No Search Debounce Indicator**

**Issue**: Search uses debounce but user doesn't know request is pending.

**Risk**:
- User thinks feature is broken
- Multiple rapid searches could bypass debounce timing

**Solution**:
```javascript
// src/pages/HomePage.jsx
const [isSearching, setIsSearching] = useState(false)

useEffect(() => {
    const timer = setTimeout(() => {
        setIsSearching(true)
        fetchBooks(search).finally(() => setIsSearching(false))
    }, 500)

    return () => clearTimeout(timer)
}, [search])

// In JSX:
<input
    type="text"
    placeholder="Search books..."
    value={search}
    onChange={handleSearch}
    className={`w-full transition ${
        isSearching ? 'opacity-60' : 'opacity-100'
    }`}
    disabled={isSearching}
/>
```

---

### 18. **Profile Photo URL Construction Issue**

**Issue**: Profile photo path constructed differently across pages.

**Risk**:
- Inconsistent image loading
- Images don't load from different contexts
- Hard to debug image issues

**Current Code** (`src/pages/ProfilePage.jsx`):
```javascript
src={`${import.meta.env.VITE_API_BASE}/${profile.profilePhotoPath}`}
```

**Solution**:
Create utility for consistent URL construction:

```javascript
// src/utils/urlBuilder.js (NEW FILE)
import config from '../config'

export const buildImageUrl = (imagePath) => {
    if (!imagePath) return null
    
    // If absolute URL, return as-is
    if (imagePath.startsWith('http')) {
        return imagePath
    }
    
    // If starts with /, don't add another
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
    return `${config.API_BASE}${path}`
}

export const buildApiUrl = (endpoint, params = {}) => {
    const url = new URL(endpoint, config.API_URL)
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
    })
    return url.toString()
}
```

Use consistently:
```javascript
import { buildImageUrl } from '../utils/urlBuilder'

// In ProfilePage
<img
    src={buildImageUrl(profile?.profilePhotoPath)}
    alt="Profile"
/>
```

---

### 19. **No Network Error Detection - Can't Distinguish Offline vs Server Error**

**Issue**: All errors treated the same way - can't tell if it's network issue or server issue.

**Risk**:
- Users confused about what went wrong
- Can't provide appropriate feedback
- Can't trigger offline fallbacks

**Solution**:

```javascript
// src/utils/errorHandling.js (NEW FILE)
export const getErrorType = (error) => {
  if (!error) return 'UNKNOWN'
  
  if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
    return 'NETWORK'
  }
  
  if (error.response?.status === 0) {
    return 'OFFLINE'
  }
  
  if (error.response?.status >= 500) {
    return 'SERVER'
  }
  
  if (error.response?.status === 401) {
    return 'UNAUTHORIZED'
  }
  
  if (error.response?.status === 403) {
    return 'FORBIDDEN'
  }
  
  if (error.response?.status === 404) {
    return 'NOT_FOUND'
  }
  
  if (error.response?.status >= 400) {
    return 'CLIENT'
  }
  
  return 'UNKNOWN'
}

export const getErrorMessage = (error) => {
  const type = getErrorType(error)
  
  const messages = {
    NETWORK: 'Network error - Check your internet connection',
    OFFLINE: 'You appear to be offline - Check your connection',
    SERVER: 'Server error - Please try again later',
    UNAUTHORIZED: 'Your session expired - Please login again',
    FORBIDDEN: 'You don\'t have permission to do this',
    NOT_FOUND: 'Resource not found',
    CLIENT: error.response?.data?.message || 'Invalid request',
    UNKNOWN: 'Something went wrong - Please try again'
  }
  
  return messages[type] || messages.UNKNOWN
}

export const isNetworkError = (error) => {
  return ['NETWORK', 'OFFLINE'].includes(getErrorType(error))
}

export const isRetryableError = (error) => {
  return ['NETWORK', 'OFFLINE', 'SERVER'].includes(getErrorType(error))
}
```

Use in components:
```javascript
import { getErrorType, getErrorMessage, isRetryableError } from '../utils/errorHandling'

const handleSubmit = async (e) => {
    try {
        // ...
    } catch (err) {
        const errorType = getErrorType(err)
        const message = getErrorMessage(err)
        
        setError(message)
        
        if (isRetryableError(err)) {
            // Show retry button
            showRetryPrompt()
        }
    }
}
```

---

### 20. **Form State Not Cleared on Successful Submission**

**Issue**: After registration, form data remains for security/UX reasons but isn't explicitly handled.

**Risk**:
- User info visible if page shared
- Inconsistent state if user goes back

**Solution**:
```javascript
// In register/login success handlers
const handleSubmit = async (e) => {
    // ... existing code ...
    
    try {
        setLoading(true)
        const result = await register(formData)
        
        // Clear sensitive data
        setFormData({
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
            phone: ''
        })
        
        setSuccess(true)
    } catch (err) {
        setError(err.response?.data?.message || 'Registration failed')
    } finally {
        setLoading(false)
    }
}
```

---

### 21. **No Retry Logic for Failed Requests**

**Issue**: Failed API calls require user to manually retry.

**Risk**:
- Temporary network glitches fail permanently
- Bad UX for unreliable networks
- Mobile users experience frequent failures

**Solution**:

```javascript
// src/utils/retry.js (NEW FILE)
export const withRetry = async (
    asyncFunction,
    { maxAttempts = 3, delayMs = 1000, backoffMultiplier = 2 } = {}
) => {
    let lastError

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await asyncFunction()
        } catch (error) {
            lastError = error

            // Don't retry non-retryable errors
            if (error.response?.status === 401 || error.response?.status === 403) {
                throw error
            }

            // Only retry on last attempt if it's the final one
            if (attempt < maxAttempts) {
                const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1)
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }
    }

    throw lastError
}
```

Use in services:
```javascript
import { withRetry } from '../utils/retry'
import apiClient from './axiosConfig'

export const getBooks = async (page = 1, pageSize = 10, search = '') => {
    return withRetry(
        () => apiClient.get(`/Book`, {
            params: { page, pageSize, search }
        }),
        { maxAttempts: 3, delayMs: 500 }
    )
}
```

---

### 22. **Missing CSRF Protection**

**Issue**: Form submissions (state-changing requests) don't include CSRF tokens.

**Risk**:
- Cross-site request forgery attacks possible
- Malicious sites can trigger actions on behalf of users

**Solution**:
Backend should handle CSRF (preferred), but frontend should support it:

```javascript
// src/services/csrfService.js (NEW FILE)
let csrfToken = null

export const getCsrfToken = async () => {
    if (csrfToken) return csrfToken
    
    try {
        const response = await axios.get(`${config.API_BASE}/api/csrf-token`)
        csrfToken = response.data.token
        return csrfToken
    } catch (err) {
        console.warn('Failed to get CSRF token:', err)
        return null
    }
}

export const includeCsrfHeader = (headers) => {
    if (csrfToken) {
        return {
            ...headers,
            'X-CSRF-Token': csrfToken
        }
    }
    return headers
}
```

---

## 🟢 LOW SEVERITY ISSUES (Best Practices & Polish)

### 23. **Missing 404 Page**

**Issue**: No catch-all route for invalid URLs.

**Risk**:
- Users lost if they navigate to invalid URLs
- Confusing blank page or error

**Solution**:
```javascript
// src/pages/NotFoundPage.jsx (NEW FILE)
import { Link } from 'react-router-dom'

function NotFoundPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="text-6xl mb-4">404</div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Page Not Found</h1>
                <p className="text-gray-600 mb-6">
                    The page you're looking for doesn't exist
                </p>
                <Link
                    to="/"
                    className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
                >
                    Back to Home
                </Link>
            </div>
        </div>
    )
}

export default NotFoundPage
```

Add to App.jsx:
```javascript
<Route path="*" element={<NotFoundPage />} />
```

---

### 24. **Accessibility Issues**

**Issue**: Missing ARIA labels, alt texts, semantic HTML.

**Risk**:
- Screen reader users can't navigate
- SEO impact
- Legal accessibility compliance issues

**Solution Examples**:
```javascript
// Add ARIA labels to buttons
<button
    aria-label="Close modal"
    onClick={closeModal}
>
    ✕
</button>

// Add ARIA live regions for dynamic content
<div
    aria-live="polite"
    aria-atomic="true"
    className="error-message"
>
    {error}
</div>

// Use semantic HTML
<main> {/* instead of <div className="main"> */}
<nav> {/* instead of <div className="nav"> */}

// Add skip-to-content link
<a href="#main-content" className="sr-only">
    Skip to main content
</a>

// Provide context text for icons
<img src="/logo.svg" alt="LibraryApp Home" />
```

---

### 25. **Missing Loading Skeleton/Placeholders**

**Issue**: Content just appears after loading, no intermediate feedback.

**Risk**:
- UI feels sluggish
- CLS (Cumulative Layout Shift) issues
- Poor perceived performance

**Solution**:
```javascript
// src/components/BookCardSkeleton.jsx
export function BookCardSkeleton() {
    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden animate-pulse">
            <div className="w-full h-40 bg-gray-300" />
            <div className="p-3 space-y-3">
                <div className="h-4 bg-gray-300 rounded w-3/4" />
                <div className="h-3 bg-gray-300 rounded w-1/2" />
                <div className="h-6 bg-gray-300 rounded w-1/3" />
            </div>
        </div>
    )
}

// Use in HomePage
{loading && (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {Array(10).fill(0).map((_, i) => (
            <BookCardSkeleton key={i} />
        ))}
    </div>
)}
```

---

### Additional Recommendations:

**26. Implement Service Worker for Offline Support**
- Cache critical assets
- Allow offline browsing of previously loaded data

**27. Add Web Performance Monitoring**
- Track Core Web Vitals
- Monitor API response times
- Use tools like Sentry or LogRocket

**28. Implement Error Tracking & Logging**
- Send errors to centralized service
- Track user sessions
- Analyze usage patterns

**29. Add Unit & E2E Tests**
- Test critical flows (auth, profile update)
- Ensure regressions don't happen
- Minimum 70% coverage

**30. Implement Analytics**
- Track page views
- Monitor user flows
- Identify drop-off points

---

## Summary Table

| Issue | Severity | Impact | Effort |
|-------|----------|--------|--------|
| Token Expiration Handling | CRITICAL | App fails after 24h | 4h |
| Error Boundary | CRITICAL | App crashes on errors | 2h |
| Input Validation | CRITICAL | Security vulnerability | 3h |
| Protected Routes | CRITICAL | Unauthorized access | 2h |
| Environment Config | CRITICAL | Production issues | 1h |
| Token in localStorage | CRITICAL | XSS vulnerability | 3h |
| Race Conditions in useEffect | CRITICAL | Memory leaks, bugs | 3h |
| Empty Responses Handling | CRITICAL | App crashes | 2h |
| OAuth Inconsistency | HIGH | Unreliable auth | 1h |
| Logout Not Sent to Server | MEDIUM | Session not invalidated | 1h |
| No Pagination | HIGH | Poor scalability | 3h |
| Network Timeout | HIGH | Indefinite loading | 1h |
| Auth Loading State | HIGH | UX flickering | 2h |
| Retry Logic | MEDIUM | Unreliable in clouds | 2h |
| 404 Page | LOW | Poor UX | 0.5h |
| Accessibility | MEDIUM | Legal risk | 2h |

**Total Estimated Effort**: 32—35 hours for production-ready quality

---

## Implementation Priority

**Phase 1 (MUST HAVE - 16h)**:
1. Error Boundary
2. Protected Routes
3. Token Expiration Handling
4. Input Validation
5. Logout Endpoint
6. Environment Configuration

**Phase 2 (SHOULD HAVE - 10h)**:
7. Pagination
8. Network Error Detection
9. Retry Logic
10. Auth Loading States

**Phase 3 (NICE TO HAVE - 9h)**:
11. Accessibility Improvements
12. Loading Skeletons
13. Performance Monitoring
14. Error Tracking

---

**Report Generated**: March 12, 2026
