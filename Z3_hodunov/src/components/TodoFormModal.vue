<script setup>
    import {ref, watch, computed} from 'vue'
    import {toLocalInputFormat, toIsoFormat} from '../utils/dateHelpers'

    const props = defineProps({
        show:{
            type:Boolean,
            required:true
        },
        todo:{
            type: Object,
            default: null
        }
    })

    const emit = defineEmits(['close', 'save'])

    const title = ref('')
    const description = ref('')
    const priority = ref('medium')
    const startDate = ref('')
    const endDate = ref('')
    const errors = ref({})

    const isEditMode = computed(() => Boolean(props.todo))

    watch(() => props.show, (isOpen) => {
        if(!isOpen){
            return
        }
        errors.value = {}
        if(props.todo){
            title.value = props.todo.title || ''
            description.value = props.todo.description || ''
            priority.value = props.todo.priority || 'medium'
            startDate.value = toLocalInputFormat(props.todo.startDate)
            endDate.value = toLocalInputFormat(props.todo.endDate)
        }
        else{
            title.value = ref('')
            description.value = ref('')
            priority.value = ref('medium')
            startDate.value = ref('')
            endDate.value = ref('')
        }
    })

    const validate = () =>{
        const newErrors = {}
        if(!title.value.trim()){
            newErrors.title = 'Názov úlohy je povinný.' 
        }
        else if(title.value.trim().length>200){
            newErrors.title = 'Názov môže mať maximálne 200 znakov.'
        }

        if(description.value.length > 1000){
            newErrors.description = 'Popis môže mať maximálne 1000 znakov.'
        }

        if(startDate.value && endDate.value){
            if(new Date(startDate.value) > new Date(endDate.value)){
                newErrors.endDate='Dátum konca nemôže byť skôr ako dátum začiatku.'
            }
        }

        errors.value = newErrors
        return Object.keys(newErrors).length === 0

    }

    const handleSubmit = () => {
        if(!validate()) return
        const payload = {
            title: title.value.trim(),
            description: description.value.trim(),
            priority: priority.value,
            startDate: toIsoFormat(startDate.value),
            endDate: toIsoFormat(endDate.value),
            done: props.todo ? props.todo.done : false
        }
        emit('save', payload)
    }
</script>

<template>
    <div v-if="show">
      <div class="modal-backdrop fade show"></div>
  
      <div class="modal fade show d-block" tabindex="-1" @click.self="emit('close')">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content shadow">
            <div class="modal-header">
              <h5 class="modal-title">
                {{ isEditMode ? 'Upraviť úlohu' : 'Nová úloha' }}
              </h5>
              <button type="button" class="btn-close" @click="emit('close')"></button>
            </div>
  
            <form @submit.prevent="handleSubmit" novalidate>
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Názov úlohy *</label>
                  <input
                    v-model="title"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': errors.title }"
                    maxlength="200"
                    placeholder="Napr. Dokončiť zadanie z WEBTE1"
                  />
                  <div class="d-flex justify-content-between mt-1">
                    <div v-if="errors.title" class="text-danger small">{{ errors.title }}</div>
                    <small class="text-muted ms-auto">{{ title.length }}/200</small>
                  </div>
                </div>
  
                <div class="mb-3">
                  <label class="form-label">Popis</label>
                  <textarea
                    v-model="description"
                    class="form-control"
                    :class="{ 'is-invalid': errors.description }"
                    rows="3"
                    maxlength="1000"
                    placeholder="Podrobnosti k úlohe (voliteľné)..."
                  ></textarea>
                  <div class="d-flex justify-content-between mt-1">
                    <div v-if="errors.description" class="text-danger small">{{ errors.description }}</div>
                    <small class="text-muted ms-auto">{{ description.length }}/1000</small>
                  </div>
                </div>
  
                <div class="mb-3">
                  <label class="form-label">Priorita</label>
                  <select v-model="priority" class="form-select">
                    <option value="low">Nízka</option>
                    <option value="medium">Stredná</option>
                    <option value="high">Vysoká</option>
                  </select>
                </div>
  
                <div class="row g-2">
                  <div class="col-md-6">
                    <label class="form-label">Začiatok</label>
                    <input v-model="startDate" type="datetime-local" class="form-control" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Koniec (termín)</label>
                    <input
                      v-model="endDate"
                      type="datetime-local"
                      class="form-control"
                      :class="{ 'is-invalid': errors.endDate }"
                    />
                    <div v-if="errors.endDate" class="invalid-feedback">{{ errors.endDate }}</div>
                  </div>
                </div>
              </div>
  
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="emit('close')">
                  Zrušiť
                </button>
                <button type="submit" class="btn btn-primary">
                  {{ isEditMode ? 'Uložiť zmeny' : 'Vytvoriť úlohu' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </template>