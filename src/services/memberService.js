import axiosInstance from './axiosInstance'

// Token manually pass karne ki zaroorat NAHI ab!

export const getProfile = async () => {
    const response = await axiosInstance.get('/Member/profile')
    return response.data
}

export const updateProfile = async (formData) => {
    const response = await axiosInstance.put('/Member/profile', formData)
    return response.data
}

export const updateProfilePhoto = async (photoFile) => {
    const formData = new FormData()
    formData.append('photo', photoFile)
    const response = await axiosInstance.put('/Member/profile/photo', formData)
    return response.data
}