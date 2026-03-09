function BookCard({ title, authorName, availableCopies, coverImageUrl }) {
  return (
    <div className="border border-gray-200 rounded-xl shadow-md overflow-hidden w-52 hover:shadow-xl transition-shadow duration-300">
      
      {/* Cover Image */}
      {coverImageUrl ? (
        <img
          src={coverImageUrl}
          alt={title}
          className="w-full h-40 object-cover"
        />
      ) : (
        <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          No Image
        </div>
      )}

      {/* Book Info */}
      <div className="p-3">
        <h3 className="font-bold text-sm text-gray-800 line-clamp-2">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">{authorName}</p>
        <div className="mt-2">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            availableCopies > 0
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {availableCopies > 0 ? `${availableCopies} Available` : 'Not Available'}
          </span>
        </div>
      </div>

    </div>
  )
}

export default BookCard