import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
    const { isLoggedIn, isAdmin, user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

                {/* Logo */}
                <Link to="/" className="text-xl font-bold text-indigo-600">
                    📚 LibraryApp
                </Link>

                {/* Right Side */}
                <div className="flex items-center gap-3">

                    {isLoggedIn ? (
                        <>
                            {/* Admin Badge */}
                            {isAdmin && (
                                <Link
                                    to="/admin/books"
                                    className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
                                >
                                    🛠️ Admin Panel
                                </Link>
                            )}

                            {/* Profile */}
                            <Link
                                to="/profile"
                                className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition"
                            >
                                👤 {user?.fullName || 'Profile'}
                            </Link>

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default Navbar