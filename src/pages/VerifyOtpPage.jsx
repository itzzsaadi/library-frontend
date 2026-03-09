import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import config from '../config'

function VerifyOtpPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const email = location.state?.email || ''

    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [resendLoading, setResendLoading] = useState(false)
    const [resendMessage, setResendMessage] = useState(null)

    const handleVerify = async (e) => {
        e.preventDefault()
        setError(null)

        try {
            setLoading(true)
            await axios.post(`${config.API_URL}/Auth/verify-otp`, { email, otp })
            navigate('/login', { state: { message: 'Email verified! Please login.' } })
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP')
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        setResendMessage(null)
        setError(null)

        try {
            setResendLoading(true)
            await axios.post(`${config.API_URL}/Auth/resend-otp`, { email })
            setResendMessage('New OTP sent! Check your email.')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP')
        } finally {
            setResendLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 text-center">

                <div className="text-6xl mb-4">🔐</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
                <p className="text-gray-500 mb-6 text-sm">
                    Enter the 6-digit code sent to <strong>{email}</strong>
                </p>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                {/* Resend Success */}
                {resendMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">
                        {resendMessage}
                    </div>
                )}

                {/* OTP Form */}
                <form onSubmit={handleVerify} className="space-y-4">
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-center text-2xl font-bold tracking-widest"
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>

                {/* Resend */}
                <p className="text-sm text-gray-500 mt-4">
                    Didn't receive the code?{' '}
                    <button
                        onClick={handleResend}
                        disabled={resendLoading}
                        className="text-indigo-600 font-medium hover:underline disabled:opacity-50"
                    >
                        {resendLoading ? 'Sending...' : 'Resend OTP'}
                    </button>
                </p>

            </div>
        </div>
    )
}

export default VerifyOtpPage