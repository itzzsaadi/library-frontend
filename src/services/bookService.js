import axios from 'axios'
import config from '../config'

export const getBooks = async (page = 1, pageSize = 10, search = '') => {
    const response = await axios.get(`${config.API_URL}/Book`, {
        params: { page, pageSize, search }
    })
    return response.data
}