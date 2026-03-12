import axios from 'axios'
import config from '../config'

export const getProfile = async (token) => {
    const response = await axios.get(`${config.API_URL}/Member/profile`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
}

export const updateProfile = async (token, data) => {
    const response = await axios.put(`${config.API_URL}/Member/profile`, data, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
}
//Profile Photo Update Funtion
export const updateProfilePhoto = async (token, photoFile) => {
    const formData = new FormData()
    formData.append('photo', photoFile)

    const response = await axios.put(`${config.API_URL}/member/profile/photo`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        }
    })
    return response.data
}