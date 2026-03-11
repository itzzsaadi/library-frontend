import { Navigate } from 'react-router-dom'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import config from '../config'

function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        try {
            setLoading(true)
            await axios.post(`${config.API_URL}/Auth/forgot-password`, { email })
            setSuccess(true)
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
                    <div className="text-6xl mb-4">📧</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Check Your Email!</h2>
                    <p className="text-gray-500 mb-6 text-sm">
                        If <strong>{email}</strong> is registered, a reset code has been sent.
                    </p>
                    <button
                        onClick={() => window.location.href = `/reset-password?email=${email}`}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
                    >
                        Enter Reset Code
                    </button>
                    <Link to="/login" className="block text-sm text-indigo-600 hover:underline mt-4">
                        Back to Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">

                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-indigo-600">📚 LibraryApp</h1>
                    <p className="text-gray-500 mt-2">Reset your password</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ali@gmail.com"
                            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending...' : 'Send Reset Code'}
                    </button>
                </form>

                <Link to="/login" className="block text-center text-sm text-indigo-600 hover:underline mt-4">
                    Back to Login
                </Link>

            </div>
        </div>
    )
}

export default ForgotPasswordPage