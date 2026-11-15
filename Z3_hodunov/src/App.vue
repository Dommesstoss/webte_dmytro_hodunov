<script setup>
  import { ref, onMounted } from 'vue'
  import todoApi from './services/todoApi'
  
  const studentName = ref(sessionStorage.getItem('studentName') || '')
  const inputName = ref(studentName.value)
  
  const todos = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchTodos = async () => {
    if (!studentName.value.trim()) return
  
    loading.value = true
    error.value = null
    try {
      todos.value = await todoApi.getTodos(studentName.value)
    } catch (err) {
      error.value = 'Chyba pri načítaní úloh zo servera: ' + err.message
    } finally {
      loading.value = false
    }
  }
  

  const handleLogin = () => {
    if (!inputName.value.trim()) return
    studentName.value = inputName.value.trim()
    sessionStorage.setItem('studentName', studentName.value)
    fetchTodos()
  }
  
  
  onMounted(() => {
    if (studentName.value) {
      fetchTodos()
    }
  })
  </script>
  
  <template>
    <div class="container py-5">
      <h1 class="mb-4">Test pripojenia k API (Deň 1)</h1>
  
    
      <form @submit.prevent="handleLogin" class="row g-2 mb-4" style="max-width: 500px;">
        <div class="col">
          <input
            v-model="inputName"
            type="text"
            class="form-control"
            placeholder="Zadajte váš identifikátor (napr. hodunov)"
            required
          />
        </div>
        <div class="col-auto">
          <button type="submit" class="btn btn-primary">Načítať úlohy</button>
        </div>
      </form>
  
    
      <div v-if="!studentName" class="alert alert-secondary">
        Zadajte identifikátor študenta pre načítanie úloh zo servera.
      </div>
  
    
      <div v-else-if="loading" class="alert alert-info">
        Načítavam úlohy pre <strong>{{ studentName }}</strong>...
      </div>
  
    
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>
  
    
      <div v-else>
        <p class="text-success fw-bold">
          Študent: {{ studentName }} | Úspešne načítaných úloh: {{ todos.length }}
        </p>
        <ul class="list-group">
          <li v-for="todo in todos" :key="todo.id" class="list-group-item">
            <strong>{{ todo.title }}</strong> — {{ todo.description }}
            <span class="badge bg-secondary ms-2">{{ todo.priority }}</span>
          </li>
        </ul>
      </div>
    </div>
  </template>