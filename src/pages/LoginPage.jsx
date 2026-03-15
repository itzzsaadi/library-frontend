import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { login as loginService } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { googleLogin } from '../services/authService'
import { GoogleLogin } from '@react-oauth/google'


function LoginPage() {
    const { isLoggedIn } = useAuth()
    // Already logged in → ghar bhejo
    if (isLoggedIn) {
        return <Navigate to="/" replace />
    }
    // Component andar:
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const successMessage = location.state?.message || null
    console.log('Location state:', location.state)  // ← yeh add karo

    const handleGoogleLogin = async (credentialResponse) => {
        try {
            // credentialResponse.credential = IdToken ✅
            const data = await googleLogin(credentialResponse.credential)
            login(data)
            navigate('/')
        } catch (err) {
            setError('Google login failed. Please try again.')
        }
    }

    const googleLoginHook = useGoogleLogin({
        onSuccess: handleGoogleLogin,
        onError: () => setError('Google login failed'),
        flow: 'auth-code'
    })

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        try {
            setLoading(true)
            // Token save karo, context handle karega
            const data = await loginService(formData)
            // Context update hoga automatically (persistence included)
            login(data)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">

                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-indigo-600">📚 LibraryApp</h1>
                    <p className="text-gray-500 mt-2">Welcome back!</p>
                </div>

                {/* Success message — OTP verify ke baad */}
                {successMessage && (
                    <div className={`px-4 py-3 rounded-lg mb-4 text-sm border ${location.state?.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                        : 'bg-green-50 border-green-200 text-green-600'
                        }`}>
                        {location.state?.type === 'warning' ? '⚠️ ' : '✅ '}
                        {successMessage}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="ali@gmail.com"
                            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Your password"
                            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                            required
                        />
                        <div className="text-right mt-1">
                            <Link to="/forgot-password" className="text-xs text-indigo-600 hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center my-4">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <span className="px-3 text-xs text-gray-400">OR</span>
                    <div className="flex-1 border-t border-gray-200"></div>
                </div>

                {/* Google Login */}
                <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => setError('Google login failed')}
                        width="368"
                        text="continue_with"
                        shape="rectangular"
                    />
                </div>

                <p className="text-center text-sm text-gray-500 mt-4">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-indigo-600 font-medium hover:underline">
                        Register
                    </Link>
                </p>

            </div>
        </div>
    )
}

export default LoginPage