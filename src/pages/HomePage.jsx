// src/pages/HomePage.jsx
// Importing BokCard Template
import BookCard from '../components/BookCard'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getBooks } from '../services/bookService'
import { useAuth } from '../context/AuthContext'

// Main App Component
function HomePage() {

    // Auth Context se user info aur logout function le lo
    const { user, isLoggedIn, logout } = useAuth()
    // State to manage the list of books
    const [books, setBooks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [search, setSearch] = useState('')

    // Debounce — search change hone ke 500ms baad API call
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBooks(search)
        }, 500)

        // Cleanup — agar user dobara type kare toh purana timer cancel karo
        return () => clearTimeout(timer)
    }, [search]) // search change hone pe chalega

    const fetchBooks = async (searchTerm = '') => {
        try {
            setLoading(true)
            const data = await getBooks(1, 10, searchTerm)
            setBooks(data.data) // pagination response mein data array hai
        } catch (err) {
            setError('Failed to load books')
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e) => {
        setSearch(e.target.value) // Sirf state update — API call nahi
    }

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-indigo-600">📚 LibraryApp</h1>
                    {/* Conditionally render Login/Register or User Profile */}
                    {isLoggedIn ? (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">👋 {user?.fullName}</span>
                            <button
                                onClick={logout}
                                className="text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-1">
                            <Link to="/login" className="text-sm text-gray-600 px-4 py-2 hover:text-indigo-600 transition">
                                Login
                            </Link>
                            <Link to="/register" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">

                {/* Header + Search */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">Browse Books</h2>
                        <p className="text-gray-500 mt-1">Discover your next great read</p>
                    </div>
                    <input
                        type="text"
                        placeholder="Search books or authors..."
                        value={search}
                        onChange={handleSearch}
                        className="w-full sm:w-72 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                    />
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Books Grid — map se render karo */}
                {!loading && !error && (
                    <>
                        {books.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                <p className="text-5xl mb-4">📭</p>
                                <p className="text-lg">No books found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {books.map(book => (
                                    <BookCard
                                        key={book.id}
                                        title={book.title}
                                        authorName={book.authorName}
                                        availableCopies={book.availableCopies}
                                        coverImageUrl={book.coverImageUrl}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}

export default HomePage