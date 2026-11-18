<script setup>
    import {computed, ref} from 'vue'
    import {formatDateDisplay, isOverdue} from '../utils/dateHelpers'

    const props = defineProps({
        todos:{
            type: Array,
            required: true
        }
    })

    const emit = defineEmits(['toggle-done', 'edit', 'delete'])

    const searchQuery = ref('')
    const statusFilter = ref('all')
    const sortBy = ref('default')

    const filteredTodos = computed(() => {
        let result = [...props.todos]

  
        if (searchQuery.value.trim()) {
            const q = searchQuery.value.toLowerCase().trim()
            result = result.filter(
            (t) =>
                t.title?.toLowerCase().includes(q) ||
                t.description?.toLowerCase().includes(q)
            )
        }

  
        if (statusFilter.value === 'done') {
            result = result.filter((t) => t.done)
        } else if (statusFilter.value === 'active') {
            result = result.filter((t) => !t.done)
        } else if (statusFilter.value === 'overdue') {
            result = result.filter((t) => isOverdue(t))
        }


        if (sortBy.value === 'startDate') {
            result.sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0))
        } else if (sortBy.value === 'endDate') {
            result.sort((a, b) => new Date(a.endDate || 0) - new Date(b.endDate || 0))
        }

        return result
    })
    
    const getPriorityBadge = (priority) =>{
        if (priority === 'high') return { text: 'Vysoká', class: 'bg-danger' }
        if (priority === 'medium') return { text: 'Stredná', class: 'bg-warning text-dark' }
        return { text: 'Nízka', class: 'bg-success' }
    }

    const handleDeleteClick = (todo) =>{
        if (confirm(`Naozaj chcete vymazať úlohu "${todo.title}"?`)) {
            emit('delete', todo.id)
        }
    }

</script>

<template>
    <div>
      <div class="row g-2 mb-4">
        <div class="col-md-5">
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input
              v-model="searchQuery"
              type="text"
              class="form-control"
              placeholder="Hľadať podľa názvu alebo popisu..."
            />
          </div>
        </div>
  
        <div class="col-md-4">
          <select v-model="statusFilter" class="form-select">
            <option value="all">Všetky úlohy</option>
            <option value="active">Aktívne (nesplnené)</option>
            <option value="done">Splnené</option>
            <option value="overdue">Po termíne (oneskorené)</option>
          </select>
        </div>
  
        <div class="col-md-3">
          <select v-model="sortBy" class="form-select">
            <option value="default">Predvolené zoradenie</option>
            <option value="startDate">Podľa dátumu začiatku</option>
            <option value="endDate">Podľa termínu dokončenia</option>
          </select>
        </div>
      </div>
  
      <div v-if="filteredTodos.length === 0" class="alert alert-light border text-center py-4">
        Žiadne úlohy nezodpovedajú zvoleným kritériám.
      </div>
  
      <div v-else class="d-flex flex-column gap-3">
        <div
          v-for="todo in filteredTodos"
          :key="todo.id"
          class="card todo-card shadow-sm"
          :class="{
            'border-success bg-light opacity-75': todo.done,
            'border-danger': isOverdue(todo)
          }"
        >
          <div class="card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div class="d-flex align-items-start gap-3">
              <input
                type="checkbox"
                class="form-check-input mt-1 fs-5"
                style="cursor: pointer;"
                :checked="todo.done"
                @change="emit('toggle-done', todo)"
                title="Označiť ako splnené / nesplnené"
              />
  
              <div>
                <div class="d-flex align-items-center flex-wrap gap-2 mb-1">
                  <h5
                    class="card-title mb-0"
                    :class="{ 'text-decoration-line-through text-muted': todo.done }"
                  >
                    {{ todo.title }}
                  </h5>
  
                  <span class="badge" :class="getPriorityBadge(todo.priority).class">
                    {{ getPriorityBadge(todo.priority).text }}
                  </span>
  
                  <span v-if="isOverdue(todo)" class="badge bg-danger">
                    <i class="bi bi-exclamation-triangle-fill me-1"></i>Po termíne
                  </span>
  
                  <span v-if="todo.done" class="badge bg-success">
                    <i class="bi bi-check-circle-fill me-1"></i>Splnené
                  </span>
                </div>
  
                <p v-if="todo.description" class="card-text text-muted mb-2">
                  {{ todo.description }}
                </p>
  
                <div class="small text-secondary d-flex flex-wrap gap-3">
                  <span>
                    <i class="bi bi-play-circle me-1"></i>Začiatok:
                    <strong>{{ formatDateDisplay(todo.startDate) }}</strong>
                  </span>
                  <span>
                    <i class="bi bi-flag me-1"></i>Koniec:
                    <strong :class="{ 'text-danger': isOverdue(todo) }">
                      {{ formatDateDisplay(todo.endDate) }}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
  
            <div class="d-flex gap-2 align-self-end align-self-md-center">
              <button
                class="btn btn-outline-primary btn-sm"
                @click="emit('edit', todo)"
                title="Upraviť úlohu"
              >
                <i class="bi bi-pencil"></i> Upraviť
              </button>
              <button
                class="btn btn-outline-danger btn-sm"
                @click="handleDeleteClick(todo)"
                title="Vymazať úlohu"
              >
                <i class="bi bi-trash"></i> Vymazať
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>