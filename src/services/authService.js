import axios from 'axios'
import axiosInstance from './axiosInstance'
import { API_URL } from '../config'

// ─── Auth calls (no token needed) 
export const login = async (formData) => {
    const response = await axios.post(`${API_URL}/auth/login`, formData)
    return response.data
}

export const register = async (data) => {
    const response = await axios.post(`${API_URL}/auth/register`, data)
    return response.data
}

export const googleLogin = async (idToken) => {
    const response = await axios.post(`${API_URL}/auth/google`, { idToken })
    return response.data
}

//  Member calls (token axiosInstance se auto-attach)
export const getProfile = async () => {
    const response = await axiosInstance.get('/member/profile')
    return response.data
}

export const updateProfile = async (formData) => {
    const response = await axiosInstance.put('/member/profile', formData)
    return response.data
}

export const updateProfilePhoto = async (photoFile) => {
    const formData = new FormData()
    formData.append('photo', photoFile)
    const response = await axiosInstance.put('/member/profile/photo', formData)
    return response.data
}