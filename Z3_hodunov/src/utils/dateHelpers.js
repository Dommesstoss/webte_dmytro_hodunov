export const formatDateDisplay = (isoString) => {
    if (!isoString) return '—'
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return '—'
  
    return date.toLocaleString('sk-SK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  export const toLocalInputFormat = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ''
  
    const offsetMs = date.getTimezoneOffset() * 60000
    const localDate = new Date(date.getTime() - offsetMs)
    return localDate.toISOString().slice(0, 16)
  }

  export const toIsoFormat = (localInputString) =>{
    if(!localInputString) return null
    const date = new Date(localInputString);
    if(isNaN(date.getTime())){
        return null
    }
    else{
        return date.toISOString()
    }
  }

  export const isOverdue = (todo) =>{
    if(todo.done === true || !todo.endDate) return false
    const deadline = new Date(todo.endDate).getTime()
    if(Date.now() > deadline){
        return true
    }
    else{
        return false
    }
  }