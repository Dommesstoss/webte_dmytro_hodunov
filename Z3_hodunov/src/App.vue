<script setup>
  import { ref, onMounted } from 'vue'
  import todoApi from './services/todoApi'
  import TodoList from './components/TodoList.vue'
  import TodoFormModal from './components/TodoFormModal.vue'
  
  const studentName = ref(sessionStorage.getItem('studentName') || '')
  const inputName = ref(studentName.value)
  
  const todos = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  const isModalOpen = ref(false)
  const editingTodo = ref(null)
  
  const extractTodos = (data) => {
    if (Array.isArray(data)) return data
    if (data && typeof data === 'object') {
      if (Array.isArray(data.todos)) return data.todos
      if (Array.isArray(data.data)) return data.data
      if (Array.isArray(data.items)) return data.items
      const firstArray = Object.values(data).find((val) => Array.isArray(val))
      if (firstArray) return firstArray
    }
    return []
  }
  
  const extractSingleTodo = (data) => {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (data.todo && typeof data.todo === 'object') return data.todo
      if (data.data && typeof data.data === 'object') return data.data
    }
    return data
  }
  
  const fetchTodos = async () => {
    if (!studentName.value.trim()) return
    loading.value = true
    error.value = null
    try {
      const response = await todoApi.getTodos(studentName.value)
      todos.value = extractTodos(response)
    } catch (err) {
      error.value = 'Chyba pri načítaní úloh: ' + err.message
    } finally {
      loading.value = false
    }
  }
  
  const handleLogin = () => {
    if (!inputName.value.trim()) {
      error.value = 'Zadajte identifikátor študenta.'
      studentName.value = ''
      todos.value = []
      sessionStorage.removeItem('studentName')
      return
    }
    error.value = null
    studentName.value = inputName.value.trim()
    sessionStorage.setItem('studentName', studentName.value)
    fetchTodos()
  }
  
  const openCreateModal = () => {
    editingTodo.value = null
    isModalOpen.value = true
  }
  
  const openEditModal = (todo) => {
    editingTodo.value = todo
    isModalOpen.value = true
  }
  
  const handleSaveTodo = async (formData) => {
    try {
      if (editingTodo.value) {
        const response = await todoApi.updateTodo(studentName.value, editingTodo.value.id, formData)
        const updated = extractSingleTodo(response)
        const index = todos.value.findIndex((t) => t.id === editingTodo.value.id)
        if (index !== -1) todos.value[index] = updated
      } else {
        const response = await todoApi.createTodo(studentName.value, formData)
        const created = extractSingleTodo(response)
        todos.value.push(created)
      }
      isModalOpen.value = false
    } catch (err) {
      alert('Chyba pri ukladaní úlohy: ' + err.message)
    }
  }
  
  const handleToggleDone = async (todo) => {
    try {
      const response = todo.done
        ? await todoApi.markAsUndone(studentName.value, todo.id)
        : await todoApi.markAsDone(studentName.value, todo.id)
      const updated = extractSingleTodo(response)
  
      const index = todos.value.findIndex((t) => t.id === todo.id)
      if (index !== -1) todos.value[index] = updated
    } catch (err) {
      alert('Chyba pri zmene stavu úlohy: ' + err.message)
    }
  }
  
  const handleDeleteTodo = async (todoId) => {
    try {
      await todoApi.deleteTodo(studentName.value, todoId)
      todos.value = todos.value.filter((t) => t.id !== todoId)
    } catch (err) {
      alert('Chyba pri mazaní úlohy: ' + err.message)
    }
  }
  
  const handleReset = async () => {
    if (!confirm('Naozaj chcete obnoviť pôvodných 5 testovacích úloh?')) return
    loading.value = true
    try {
      const response = await todoApi.resetTodos(studentName.value)
      todos.value = extractTodos(response)
    } catch (err) {
      error.value = 'Chyba pri obnove úloh: ' + err.message
    } finally {
      loading.value = false
    }
  }
  
  onMounted(() => {
    if (studentName.value) {
      fetchTodos()
    }
  })
  </script>
  
  <template>
    <div class="container py-4">
      <header class="d-flex flex-wrap justify-content-between align-items-center gap-3 pb-3 mb-4 border-bottom">
        <h1 class="h3 mb-0">
          <i class="bi bi-check2-square text-primary me-2"></i>Môj TODO List
        </h1>
  
        <form @submit.prevent="handleLogin" class="d-flex gap-2" novalidate>
          <input
            v-model="inputName"
            type="text"
            class="form-control form-control-sm"
            placeholder="Identifikátor študenta"
          />
          <button type="submit" class="btn btn-outline-primary btn-sm text-nowrap">
            Načítať
          </button>
        </form>
      </header>
  
      <div v-if="error" class="alert alert-danger">
        {{ error }}
      </div>
  
      <div v-else-if="!studentName" class="alert alert-secondary">
        Zadajte identifikátor študenta v pravom hornom rohu pre načítanie úloh.
      </div>
  
      <div v-else-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2 text-muted">Načítavam úlohy...</p>
      </div>
  
      <main v-else>
        <div class="d-flex justify-content-between align-items-center mb-3">
          <span class="text-muted">
            Prihlásený: <strong>{{ studentName }}</strong> (celkom: {{ todos.length }})
          </span>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary btn-sm" @click="handleReset">
              <i class="bi bi-arrow-counterclockwise me-1"></i>Obnoviť testovacie
            </button>
            <button class="btn btn-primary btn-sm" @click="openCreateModal">
              <i class="bi bi-plus-lg me-1"></i>Nová úloha
            </button>
          </div>
        </div>
  
        <TodoList
          :todos="todos"
          @toggle-done="handleToggleDone"
          @edit="openEditModal"
          @delete="handleDeleteTodo"
        />
      </main>
  
      <TodoFormModal
        :show="isModalOpen"
        :todo="editingTodo"
        @close="isModalOpen = false"
        @save="handleSaveTodo"
      />
    </div>
  </template>