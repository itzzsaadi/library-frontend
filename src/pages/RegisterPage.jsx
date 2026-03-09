import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/authService'

function RegisterPage() {
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: ''
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        // Client side check
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
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

    // Success screen
    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
                    <div className="text-6xl mb-4">📧</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Check Your Email!</h2>
                    <p className="text-gray-500 mb-6">
                        We sent a verification OTP to <strong>{formData.email}</strong>
                    </p>
                    <button
                        onClick={() => navigate('/verify-otp', { state: { email: formData.email } })}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
                    >
                        Enter OTP
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">

                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-indigo-600">📚 LibraryApp</h1>
                    <p className="text-gray-500 mt-2">Create your account</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Ali Hassan"
                            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                            required
                        />
                    </div>

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
                        <label className="text-sm font-medium text-gray-700">Phone (Optional)</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="03001234567"
                            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Min 8 chars, uppercase, number, special"
                            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Repeat password"
                            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-4">
                    Already have an account?{' '}
                    <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                        Login
                    </Link>
                </p>

            </div>
        </div>
    )
}

export default RegisterPage