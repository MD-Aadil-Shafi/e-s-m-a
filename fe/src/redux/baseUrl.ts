export const baseUrl: string = 'http://localhost:8000/api/v1'
export const token: any = localStorage.getItem('token')
export const authTokenHeader: any = { Authorization: `Bearer ${token}` }