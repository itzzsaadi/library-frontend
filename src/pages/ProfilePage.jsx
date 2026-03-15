// src/pages/ProfilePage.jsx
// Protected page — sirf logged in users ke liye
// Navbar App.jsx se aa raha hai — yahan nahi hoga
// PrivateRoute already guard kar raha hai — useEffect auth check zaroorat nahi

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProfile, updateProfile, updateProfilePhoto } from '../services/memberService'

function ProfilePage() {
    const { isGoogleUser } = useAuth()  // isLoggedIn aur navigate hata diye — PrivateRoute handle kar raha hai
    const navigate = useNavigate()

    // ─── State ───────────────────────────────────────────
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [photoLoading, setPhotoLoading] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [formData, setFormData] = useState({ fullName: '', phone: '' })
    const [updateLoading, setUpdateLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState(null)

    // ─── Profile Fetch on Mount ───────────────────────────
    useEffect(() => {
        fetchProfile()
    }, [])

    // ─── Fetch Profile ────────────────────────────────────
    const fetchProfile = async () => {
        try {
            setLoading(true)
            const data = await getProfile()
            setProfile(data)
            setFormData({ fullName: data.fullName, phone: data.phone || '' })
        } catch (err) {
            setError('Failed to load profile')
        } finally {
            setLoading(false)
        }
    }

    // ─── Update Profile (Name + Phone) ───────────────────
    const handleUpdate = async (e) => {
        e.preventDefault()
        setSuccessMessage(null)
        setError(null)

        try {
            setUpdateLoading(true)
            await updateProfile(formData)
            setSuccessMessage('Profile updated successfully!')
            setEditMode(false)
            fetchProfile() // Latest data dobara fetch karo
        } catch (err) {
            setError(err.response?.data?.message || 'Update failed')
        } finally {
            setUpdateLoading(false)
        }
    }

    // ─── Photo Upload Handler ─────────────────────────────
    const handlePhotoChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            setPhotoLoading(true)
            await updateProfilePhoto(file)
            await fetchProfile() // Photo update ke baad profile refresh
            setSuccessMessage('Photo update ho gayi! 🎉')
        } catch (err) {
            setError(err.response?.data?.message || 'Photo upload failed')
        } finally {
            setPhotoLoading(false)
        }
    }

    // ─── Loading State ────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    )

    // ─── Render ───────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50">

            <main className="max-w-2xl mx-auto px-6 py-10">

                {/* Profile Photo Section */}
                <div className="text-center mb-8">
                    <div className="relative group w-28 h-28 mx-auto mb-4">

                        {/* Photo ya Placeholder */}
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-indigo-100 shadow-sm transition-all duration-300 group-hover:border-indigo-300">
                            {profile?.profilePhotoPath ? (
                                <img
                                    src={`${import.meta.env.VITE_API_BASE}/${profile.profilePhotoPath}`}
                                    alt="Profile"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full bg-indigo-50 flex items-center justify-center transition-colors duration-300 group-hover:bg-indigo-100">
                                    <span className="text-6xl transition-transform duration-300 group-hover:scale-110">👤</span>
                                </div>
                            )}

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                        </div>

                        {/* Camera Button — Photo Upload Trigger */}
                        <label className="absolute bottom-1 right-1 bg-indigo-600 text-white w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shadow-lg transform transition-all duration-300 hover:scale-110 active:scale-95 group-hover:bg-indigo-700 ring-2 ring-white">
                            {photoLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <span className="text-lg">📷</span>
                            )}
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handlePhotoChange}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800">{profile?.fullName}</h2>
                    <p className="text-gray-500 text-sm mt-1">{profile?.email}</p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">
                        ✅ {successMessage}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                        ❌ {error}
                    </div>
                )}

                {/* Personal Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800">Personal Info</h3>
                        {!editMode && (
                            <button
                                onClick={() => setEditMode(true)}
                                className="text-sm text-indigo-600 hover:underline"
                            >
                                Edit
                            </button>
                        )}
                    </div>

                    {/* Edit Form ya View Mode */}
                    {editMode ? (
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Phone</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={updateLoading}
                                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                                >
                                    {updateLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditMode(false)}
                                    className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        // View Mode — Profile Info
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Full Name</span>
                                <span className="font-medium text-gray-800">{profile?.fullName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Email</span>
                                <span className="font-medium text-gray-800">{profile?.email}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Phone</span>
                                <span className="font-medium text-gray-800">{profile?.phone || '—'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Member Since</span>
                                <span className="font-medium text-gray-800">
                                    {new Date(profile?.joinDate).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Membership Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Membership</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Type</span>
                            <span className={`font-semibold px-2 py-1 rounded-full text-xs ${
                                profile?.membershipType === 1
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-blue-100 text-blue-700'
                            }`}>
                                {profile?.membershipType === 1 ? '⭐ Premium' : '📘 Basic'}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Status</span>
                            <span className={`font-semibold px-2 py-1 rounded-full text-xs ${
                                profile?.status === 0
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                            }`}>
                                {profile?.status === 0 ? '✅ Active' : '🚫 Suspended'}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Expiry Date</span>
                            <span className="font-medium text-gray-800">
                                {new Date(profile?.membershipExpiryDate).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Books Borrowed</span>
                            <span className="font-medium text-gray-800">
                                {profile?.currentBooksCount} / {profile?.maxBooksAllowed}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Change Password ya Google User Message */}
                {isGoogleUser ? (
                    <div className="mt-4 px-4 py-3 bg-gray-50 rounded-lg text-center">
                        <p className="text-xs text-gray-500">🔗 Authenticated with <b>Google</b></p>
                        <p className="text-xs text-gray-400 mt-1">Password change not available</p>
                    </div>
                ) : (
                    <button
                        onClick={() => navigate('/change-password')}
                        className="w-full mt-4 border border-indigo-300 text-indigo-600 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition"
                    >
                        🔒 Change Password
                    </button>
                )}

            </main>
        </div>
    )
}

export default ProfilePage