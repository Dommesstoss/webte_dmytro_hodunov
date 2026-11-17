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

const mapFromServer = (item) => {
  if (!item || typeof item !== 'object') return item
  return {
    ...item,
    startDate: item.date_from ?? item.startDate ?? null,
    endDate: item.date_to ?? item.endDate ?? null,
    done: Boolean(item.is_finished ?? item.done),
    priority: item.priority || 'medium'
  }
}

const mapToServer = (todoData) => {
  const payload = {
    title: todoData.title,
    description: todoData.description || '',
    is_finished: Boolean(todoData.done)
  }
  if (todoData.startDate) payload.date_from = todoData.startDate
  if (todoData.endDate) payload.date_to = todoData.endDate
  return payload
}

const mapListFromServer = (data) => {
  if (Array.isArray(data)) return data.map(mapFromServer)
  if (data && typeof data === 'object') {
    const arr = data.todos || data.data || data.items || Object.values(data).find(Array.isArray)
    if (Array.isArray(arr)) return arr.map(mapFromServer)
  }
  return []
}

export default {
  async getTodos(name) {
    const response = await apiClient.get(getUserEndpoint(name))
    return mapListFromServer(response.data)
  },

  async createTodo(name, todoData) {
    const response = await apiClient.post(getUserEndpoint(name), mapToServer(todoData))
    const raw = response.data?.todo || response.data?.data || response.data
    return mapFromServer(raw)
  },

  async updateTodo(name, todoId, todoData) {
    const response = await apiClient.put(`${getUserEndpoint(name)}/${todoId}`, mapToServer(todoData))
    const raw = response.data?.todo || response.data?.data || response.data
    return mapFromServer(raw)
  },

  async deleteTodo(name, todoId) {
    const response = await apiClient.delete(`${getUserEndpoint(name)}/${todoId}`)
    return response.data
  },

  async markAsDone(name, todoId) {
    const response = await apiClient.patch(`${getUserEndpoint(name)}/${todoId}/done`)
    const raw = response.data?.todo || response.data?.data || response.data
    return mapFromServer(raw)
  },

  async markAsUndone(name, todoId) {
    const response = await apiClient.patch(`${getUserEndpoint(name)}/${todoId}/undone`)
    const raw = response.data?.todo || response.data?.data || response.data
    return mapFromServer(raw)
  },

  async resetTodos(name) {
    const response = await apiClient.post(`${getUserEndpoint(name)}/reset`)
    return mapListFromServer(response.data)
  }
}