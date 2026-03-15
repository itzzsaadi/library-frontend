import { Navigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import config from '../config'

function VerifyOtpPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const email = location.state?.email || ''
    // Email nahi aaya → register pe wapis bhejo
    if (!email) {
        return <Navigate to="/register"
            state={{ message: "Please Register first!" }}
            replace
        />
    }

    // 6 khali dabbay (boxes) ka array
    const [otp, setOtp] = useState(new Array(6).fill(""))
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [resendLoading, setResendLoading] = useState(false)
    const [resendMessage, setResendMessage] = useState(null)

    // Har box ka reference taake focus move kar saken
    const inputRefs = useRef([])

    // Logic: Jab user type kare
    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false; // Sirf numbers allow hain

        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        // Agay jao agar number likha gaya hai
        if (element.value !== "" && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    // Logic: Jab user Backspace dabaye
    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError(null);
        const finalOtp = otp.join(""); // Array ko wapis string banao

        try {
            setLoading(true);
            await axios.post(`${config.API_URL}/Auth/verify-otp`, { email, otp: finalOtp });
            navigate('/login', { state: { message: 'Email verified! Please login.' } });
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendMessage(null);
        setError(null);

        try {
            setResendLoading(true);
            await axios.post(`${config.API_URL}/Auth/resend-otp`, { email });
            setResendMessage('New OTP sent! Check your email.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 text-center">

                <div className="text-6xl mb-4">🔐</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h2>
                <p className="text-gray-500 mb-6 text-sm">
                    Enter the code sent to <strong>{email}</strong>
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
                <form onSubmit={handleVerify} className="space-y-6">
                    {/* OTP Individual Boxes — map se render karo */}
                    <div className="flex justify-between gap-2">
                        {otp.map((data, index) => (
                            <input
                                key={index}
                                type="text"
                                maxLength="1"
                                inputMode="numeric" // Mobile par number pad khulay ga
                                ref={(el) => (inputRefs.current[index] = el)}
                                value={data}
                                onChange={(e) => handleChange(e.target, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                className="w-12 h-14 border-2 border-gray-200 rounded-xl text-center text-2xl font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                required
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || otp.join("").length !== 6}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>

                {/* Resend */}
                <p className="text-sm text-gray-500 mt-6">
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