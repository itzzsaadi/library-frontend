// src/pages/HomePage.jsx
// HomePage — Public page, sab dekh sakte hain
// Navbar ab App.jsx se aa raha hai — yahan nahi hoga

import BookCard from '../components/BookCard'
import { useState, useEffect } from 'react'
import { getBooks } from '../services/bookService'

function HomePage() {

    // ─── State ───────────────────────────────────────────
    const [books, setBooks] = useState([])       // Books list
    const [loading, setLoading] = useState(true) // Loading spinner
    const [error, setError] = useState(null)     // Error message
    const [search, setSearch] = useState('')     // Search input value

    // ─── Debounced Search ─────────────────────────────────
    // User type kare toh 500ms baad API call hogi
    // Agar dobara type kare toh purana timer cancel hoga
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBooks(search)
        }, 500)

        return () => clearTimeout(timer) // Cleanup
    }, [search])

    // ─── Books Fetch ──────────────────────────────────────
    const fetchBooks = async (searchTerm = '') => {
        try {
            setLoading(true)
            const data = await getBooks(1, 10, searchTerm)
            setBooks(data.data) // Pagination response mein .data array hota hai
        } catch (err) {
            setError('Failed to load books')
        } finally {
            setLoading(false)
        }
    }

    // ─── Search Input Handler ─────────────────────────────
    // Sirf state update karta hai — API call useEffect karega
    const handleSearch = (e) => {
        setSearch(e.target.value)
    }

    // ─── Render ───────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50">

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">

                {/* Header + Search Bar */}
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

                {/* Loading Spinner */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Books Grid */}
                {!loading && !error && (
                    <>
                        {/* Agar koi book nahi mili */}
                        {books.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                <p className="text-5xl mb-4">📭</p>
                                <p className="text-lg">No books found</p>
                            </div>
                        ) : (
                            // Books map karke BookCard mein pass karo
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