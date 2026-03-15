// src/layouts/AdminLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AdminLayout() {
    const { logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const navLinks = [
        { to: '/admin/books',   label: 'Books',   icon: '📚' },
        { to: '/admin/authors', label: 'Authors', icon: '✍️' },
        { to: '/admin/members', label: 'Members', icon: '👥' },
    ]

    return (
        <div className="flex min-h-screen bg-gray-100">

            {/* Sidebar */}
            <aside className="w-64 bg-indigo-900 text-white flex flex-col">
                <div className="p-6 border-b border-indigo-700">
                    <h1 className="text-xl font-bold">📚 LibraryApp</h1>
                    <p className="text-indigo-300 text-sm mt-1">Admin Panel</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navLinks.map(link => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg transition
                                ${isActive
                                    ? 'bg-indigo-600 text-white font-semibold'
                                    : 'text-indigo-200 hover:bg-indigo-700'
                                }`
                            }
                        >
                            <span>{link.icon}</span>
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-indigo-700">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-200 hover:bg-indigo-700 transition"
                    >
                        <span>🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <Outlet /> {/* ← Yahan admin pages render honge */}
            </main>

        </div>
    )
}

export default AdminLayout