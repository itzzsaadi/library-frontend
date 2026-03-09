import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { login } from '../services/authService'

function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const successMessage = location.state?.message || null

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
            const data = await login(formData)

            // Token save karo
            localStorage.setItem('accessToken', data.accessToken)
            localStorage.setItem('refreshToken', data.refreshToken)
            localStorage.setItem('user', JSON.stringify(data.user))

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
                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">
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
                <button className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-700">
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                    Continue with Google
                </button>

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