<script setup>
    import {computed} from 'vue'
    import {isOverdue} from '../utils/dateHelpers'

   const props = defineProps({
        todos:{
            type: Array,
            required: true
        }
    })

    const stats = computed(() => {
        const total = props.todos.length
        const done = props.todos.filter((t) => t.done).length
        const overdue = props.todos.filter((t) => isOverdue(t)).length
        const active = total - done
        const percent = total > 0 ? Math.round((done/total)*100):0

        return {total, done, active, overdue, percent}
    })
</script>

<template>
    <div class="mb-4">
      <div class="row g-2 mb-2">
        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm text-center py-2">
            <div class="small text-muted">Celkom úloh</div>
            <div class="h4 mb-0 fw-bold text-dark">{{ stats.total }}</div>
          </div>
        </div>
  
        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm text-center py-2">
            <div class="small text-muted">Aktívne</div>
            <div class="h4 mb-0 fw-bold text-primary">{{ stats.active }}</div>
          </div>
        </div>
  
        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm text-center py-2">
            <div class="small text-muted">Splnené</div>
            <div class="h4 mb-0 fw-bold text-success">{{ stats.done }}</div>
          </div>
        </div>
  
        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm text-center py-2">
            <div class="small text-muted">Po termíne</div>
            <div class="h4 mb-0 fw-bold text-danger">{{ stats.overdue }}</div>
          </div>
        </div>
      </div>
  
      <div class="progress" style="height: 6px;" title="Celkový progres splnenia">
        <div
          class="progress-bar bg-success"
          role="progressbar"
          :style="{ width: stats.percent + '%' }"
          :aria-valuenow="stats.percent"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
    </div>
  </template>