import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import config from '../config'

function ChangePasswordPage() {
    const { accessToken, isLoggedIn } = useAuth()
    const navigate = useNavigate()

    if (!isLoggedIn) return navigate('/login')

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
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

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        try {
            setLoading(true)
            await axios.post(`${config.API_URL}/Auth/change-password`, {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
            setSuccess(true)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Changed!</h2>
                    <p className="text-gray-500 mb-6 text-sm">Your password has been updated successfully.</p>
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
                    >
                        Back to Profile
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <h1
                        onClick={() => navigate('/')}
                        className="text-2xl font-bold text-indigo-600 cursor-pointer"
                    >
                        📚 LibraryApp
                    </h1>
                    <button
                        onClick={() => navigate('/profile')}
                        className="text-sm text-gray-600 hover:text-indigo-600 transition"
                    >
                        ← Back to Profile
                    </button>
                </div>
            </nav>

            <main className="max-w-md mx-auto px-6 py-10">

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

                    <div className="text-center mb-6">
                        <div className="text-5xl mb-3">🔒</div>
                        <h2 className="text-2xl font-bold text-gray-800">Change Password</h2>
                        <p className="text-gray-500 text-sm mt-1">Enter your current and new password</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Current Password</label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                autoComplete="current-password"
                                placeholder="Your current password"
                                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                autoComplete="new-password"
                                placeholder="Min 8 chars, uppercase, number, special"
                                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                autoComplete="new-password"
                                placeholder="Repeat new password"
                                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    )
}

export default ChangePasswordPage