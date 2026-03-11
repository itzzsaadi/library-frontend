import axios from 'axios'
import config from '../config'

export const register = async (data) => {
    const response = await axios.post(`${config.API_URL}/Auth/register`, data)
    return response.data
}

export const login = async (data) => {
    const response = await axios.post(`${config.API_URL}/Auth/login`, data)
    return response.data
}

export const googleLogin = async (code) => {
    const response = await axios.post(`${config.API_URL}/Auth/google`, { idToken: code })
    return response.data
}