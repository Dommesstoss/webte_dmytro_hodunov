import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'https://wt1zadanie.iolab.sk',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
})

const getUserEndpoint = (name) => {
  if (!name || !name.trim()) {
    throw new Error('Identifikátor študenta nie je zadaný.')
  }
  return `/api/${encodeURIComponent(name.trim())}`
}
 
export default {
  async getTodos(name) {
    const response = await apiClient.get(getUserEndpoint(name))
    return response.data
  },

  async createTodo(name, todoData) {
    const response = await apiClient.post(getUserEndpoint(name), todoData)
    return response.data
  },

  async updateTodo(name, todoId, todoData) {
    const response = await apiClient.put(`${getUserEndpoint(name)}/${todoId}`, todoData)
    return response.data
  },

  async deleteTodo(name, todoId) {
    const response = await apiClient.delete(`${getUserEndpoint(name)}/${todoId}`)
    return response.data
  },

  async markAsDone(name, todoId) {
    const response = await apiClient.patch(`${getUserEndpoint(name)}/${todoId}/done`)
    return response.data
  },

  async markAsUndone(name, todoId) {
    const response = await apiClient.patch(`${getUserEndpoint(name)}/${todoId}/undone`)
    return response.data
  },

  async resetTodos(name) {
    const response = await apiClient.post(`${getUserEndpoint(name)}/reset`)
    return response.data
  }
}