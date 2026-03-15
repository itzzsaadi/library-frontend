import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AdminRoute({ children }) {
    const { isLoggedIn, isAdmin } = useAuth()

    if (!isLoggedIn) {
        return <Navigate to="/login" state={{ message: "Please login first!" }} replace />
    }

    if (!isAdmin) {
        return <Navigate to="/" state={{ message: "Only for Admin!" }} replace />
    }

    return children
}

export default AdminRoute