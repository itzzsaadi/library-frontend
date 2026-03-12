import { Navigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import config from '../config'

function ResetPasswordPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const email = searchParams.get('email') || ''
        // Email query param nahi → forgot-password pe wapis bhejo
    if (!email) {
        return <Navigate to="/forgot-password" replace />
    }

    const [otp, setOtp] = useState(new Array(6).fill(""))
    const inputRefs = useRef([])

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return false

        const newOtp = [...otp]
        newOtp[index] = element.value
        setOtp(newOtp)

        if (element.value !== "" && index < 5) {
            inputRefs.current[index + 1].focus()
        }
    }

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus()
        }
    }

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

        const finalOtp = otp.join("")

        try {
            setLoading(true)
            await axios.post(`${config.API_URL}/Auth/reset-password`, {
                email,
                otp: finalOtp,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword
            })
            navigate('/login', { state: { message: 'Password reset successful! Please login.' } })
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">

                <div className="text-center mb-6">
                    <div className="text-5xl mb-3">🔑</div>
                    <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Enter the code sent to <strong>{email}</strong>
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* OTP Boxes */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">Reset Code</label>
                        <div className="flex justify-between gap-2">
                            {otp.map((data, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    value={data}
                                    onChange={(e) => handleOtpChange(e.target, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    className="w-12 h-14 border-2 border-gray-200 rounded-xl text-center text-2xl font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    required
                                />
                            ))}
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">New Password</label>
                        <input
                            type="password"
                            name="newPassword"
                            autoComplete="new-password"
                            value={formData.newPassword}
                            onChange={handleChange}
                            placeholder="Min 8 chars, uppercase, number, special"
                            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                            required
                        />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            autoComplete="new-password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Repeat new password"
                            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || otp.join("").length !== 6}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <Link to="/login" className="block text-center text-sm text-indigo-600 hover:underline mt-4">
                    Back to Login
                </Link>

            </div>
        </div>
    )
}

export default ResetPasswordPage