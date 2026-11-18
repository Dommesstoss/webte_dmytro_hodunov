<script setup>
    import {computed} from 'vue'
    import FullCalendar from '@fullcalendar/vue3'
    import dayGridPlugin from '@fullcalendar/daygrid'
    import timeGridPlugin from '@fullcalendar/timegrid'
    import interactionPlugin from '@fullcalendar/interaction'
    import bootstrap5Plugin from '@fullcalendar/bootstrap5'
    import { isOverdue } from '../utils/dateHelpers'

    const props = defineProps({
        todos:{
            type: Array,
            required: true
        }
    })

    const emit = defineEmits(['select-date', 'select-todo'])

    const calendarEvents = computed(()=>{
        return props.todos
            .filter((t) => t.startDate || t.endDate)
            .map((todo) => {
            let bgColor = '#0d6efd'
            let borderColor = '#0d6efd'

            if (todo.done) {
                bgColor = '#198754'
                borderColor = '#198754'
            } else if (isOverdue(todo)) {
                bgColor = '#dc3545'
                borderColor = '#dc3545'
            }

            return {
                id: String(todo.id),
                title: todo.done ? `✓ ${todo.title}` : todo.title,
                start: todo.startDate || todo.endDate,
                end: todo.endDate || undefined,
                backgroundColor: bgColor,
                borderColor: borderColor,
                textColor: '#ffffff',
                extendedProps: { todo }
            }
        })
    })
    
    const calendarOptions = computed(()=>({
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, bootstrap5Plugin],
        themeSystem: 'bootstrap5',
        initialView: 'dayGridMonth',
        firstDay: 1,
        locale: 'sk',
        height: 'auto',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        buttonText: {
            today: 'Dnes',
            month: 'Mesiac',
            week: 'Týždeň',
            day: 'Deň'
        },
        events: calendarEvents.value,
        selectable: true,
        dateClick: (info) => {
            emit('select-date', info.dateStr)
        },
        eventClick: (info) => {
            const todo = info.event.extendedProps.todo
            if (todo) {
                emit('select-todo', todo)
            }
        }
    }))
</script>

<template>
    <div class="card shadow-sm">
      <div class="card-body">
        <div class="d-flex flex-wrap align-items-center gap-3 mb-3 small">
          <span><span class="badge bg-primary"> </span> Aktívna</span>
          <span><span class="badge bg-success"> </span> Splnená</span>
          <span><span class="badge bg-danger"> </span> Po termíne</span>
          <span class="text-muted ms-auto">Kliknite na dátum pre novú úlohu alebo na úlohu pre jej úpravu.</span>
        </div>
        <FullCalendar :options="calendarOptions" />
      </div>
    </div>
  </template>

  <style scoped>
    @media (max-width: 576px) {
      :deep(.fc-header-toolbar) {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
      }
    
      :deep(.fc-toolbar-chunk) {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 0.25rem;
      }
    
      :deep(.fc-toolbar-title) {
        font-size: 1.15rem;
      }
    }
    </style>