import { post, get, put, patch } from '../services/api'


export function hasTimeOverlap(start1, end1, start2, end2) {
  const start1Time = new Date(start1).getTime()
  const end1Time = new Date(end1).getTime()
  const start2Time = new Date(start2).getTime()
  const end2Time = new Date(end2).getTime()
  
  return start1Time < end2Time && end1Time > start2Time
}

export function findProfessionalConflicts(professionalId, formStart, formEnd, appointments) {
  return appointments.filter((appointment) => {
    if (appointment.status?.cancelled) return false
    if (appointment.professionalId !== professionalId) return false
    
    return hasTimeOverlap(formStart, formEnd, appointment.startDate, appointment.endDate)
  })
}

export function findPatientConflicts(patientId, formStart, formEnd, appointments) {
  return appointments.filter((appointment) => {
    if (appointment.status?.cancelled) return false
    if (appointment.patientId !== patientId) return false
    
    return hasTimeOverlap(formStart, formEnd, appointment.startDate, appointment.endDate)
  })
}

export function isPersonAvailable(personId, formStart, formEnd, appointments, personType = 'professional') {
  const findConflicts = personType === 'professional' 
    ? findProfessionalConflicts 
    : findPatientConflicts
    
  const conflicts = findConflicts(personId, formStart, formEnd, appointments)
  return conflicts.length === 0
}
export function reloadCalendarEvents(calendarRef) {
  if (calendarRef && calendarRef.value) {
    const calendarApi = calendarRef.value.getApi()
    calendarApi.refetchEvents()
  }
}
export function showSuccess(response, alert) {
  if (!alert) {
    return
  }
  
  alert.show = true
  alert.type = 'success'
  
  // Extraer el mensaje del objeto de respuesta
  if (typeof response === 'string') {
    alert.message = response
    alert.messageCode = 'OPERATION_SUCCESS'
  } else if (response && typeof response === 'object') {
    // Extraer messageCode de la respuesta
    const messageCode = response.messageCode || response.data?.messageCode || 'OPERATION_SUCCESS'
    
    alert.message = response.message || response.data?.message || ''
    alert.messageCode = messageCode
    // Asegurar que details sea un array o null
    alert.details = Array.isArray(response.details) ? response.details : 
                   Array.isArray(response.data?.details) ? response.data.details : null
    alert.params = response.params || response.data?.params || {}
  } else {
    alert.message = ''
    alert.messageCode = 'OPERATION_SUCCESS'
  }
  
  if (!alert.details) alert.details = null
  if (!alert.params) alert.params = {}
}

export function showError(error, alert) {
  if (!alert) {
    return
  }
  
  alert.show = true
  alert.type = 'error'
  
  // Extraer propiedades del objeto de error
  if (typeof error === 'string') {
    alert.message = error
    alert.messageCode = 'OPERATION_ERROR'
    alert.details = null
    alert.params = {}
  } else if (error && typeof error === 'object') {
    // Manejar errores de API con estructura response.data
    const errorData = error.response?.data || error
    
    // Extraer messageCode del error
    const messageCode = errorData.messageCode || error.messageCode || 'INTERNAL_SERVER_ERROR'
    
    alert.message = errorData.message || error.message || ''
    alert.messageCode = messageCode
    // Asegurar que details sea un array o null
    alert.details = Array.isArray(errorData.details) ? errorData.details : 
                   Array.isArray(error.details) ? error.details : null
    alert.params = errorData.params || error.params || {}
  } else {
    alert.message = ''
    alert.messageCode = 'INTERNAL_SERVER_ERROR'
    alert.details = null
    alert.params = {}
  }
}

export function showValidationErrors(alert) {
  alert.show = true
  alert.type = 'error'
  alert.messageCode = 'VALIDATION_FAILED'
  alert.message = ''
  alert.details = null
  alert.params = {}
}

export function resetAlert(alert) {
  alert.show = false
  alert.type = 'success'
  alert.messageCode = ''
  alert.message = ''
  alert.details = null
  alert.params = {}
}

export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const options = { weekday: 'short', hour: '2-digit', minute: '2-digit' }
  return d.toLocaleString('es-ES', options)
}

export async function cancelAppointmentById(id) {
  if (!id) throw new Error('Invalid appointment ID')
  
  const response = await put(`/appointment/${id}`, {
    status: { cancelled: true },
  })
  return response
}

export async function fetchProfessionals() {
  const response = await get('/professionals')
  return response.data || []
}

export async function fetchPatients() {
  const response = await get('/patients')
  return response.data || []
}

export async function fetchAppointments() {
  const response = await get('/appointment')
  return response.data || []
}

export async function cancelAppointment(selectedEvent, alert, calendarRef, fetchAppointmentsFn) {
  if (!selectedEvent.value || !selectedEvent.value.id) return
  
  try {
    const response = await put(`/appointment/${selectedEvent.value.id}`, {
      status: { 
        cancelled: true,
        timestamp: new Date()
      },
    })
    
    showSuccess(response, alert)
    await fetchAppointmentsFn()
    calendarRef.value.getApi().refetchEvents()
  } catch (error) {
    showError(error, alert)
  }
}

export async function handleEventDrop(info, { calendarRef, alert, fetchAppointmentsFn }) {
  const event = info.event

  try {
    await cancelAppointmentById(event.id)

    const newAppointmentData = {
      startDate: event.start,
      endDate: event.end,
      patientId: event.extendedProps.patientId,
      professionalId: event.extendedProps.professionalId,
      notes: event.extendedProps.notes,
    }

    const response = await post('/appointment', newAppointmentData)

    event.setProp('id', response.data._id)
    calendarRef.value.getApi().refetchEvents()
    showSuccess(response, alert)
    if (fetchAppointmentsFn) {
      await fetchAppointmentsFn()
    }
  } catch (error) {
    info.revert()
    showError(error, alert)
  }
}

export async function updateNotes(selectedEvent, editableNotes, alert) {
  if (!selectedEvent.value) return

  try {
    const response = await patch(`/appointment/${selectedEvent.value.id}/notes`, {
      notes: editableNotes.value,
    })
    showSuccess(response, alert)
    selectedEvent.value.setExtendedProp('notes', editableNotes.value)
  } catch (error) {
    showError(error, alert)
  }
}
export async function updateNotesProfessional(selectedEvent, editableNotes, editableProfessionalNotes, alert, fetchAppointmentsFn) {
  if (!selectedEvent || !selectedEvent.id) {
    showError('No event selected', alert)
    return
  }

  try {
    const response = await patch(`/appointment/${selectedEvent.id}/notes`, {
      notes: editableNotes,
      professionalNotes: editableProfessionalNotes,
    })

    showSuccess(response, alert)
    
    // Actualizar las propiedades del evento
    selectedEvent.setExtendedProp('notes', editableNotes)
    selectedEvent.setExtendedProp('professionalNotes', editableProfessionalNotes)
    if (fetchAppointmentsFn) {
      await fetchAppointmentsFn()
    }

  } catch (error) {
    showError(error, alert)
    throw error
  }
}
export async function saveAppointment(form, selectedPatient, selectedProfessional, dialog, alert, calendarRef, fetchAppointmentsFn) {
  if (!form.value.patientId || !form.value.professionalId) {
    showError('Patient and professional must be selected', alert)
    return
  }

  const event = {
    startDate: form.value.start,
    endDate: form.value.end,
    patientId: form.value.patientId,
    professionalId: form.value.professionalId,
    notes: form.value.notes || '',
  }
  
  try {
    const response = await post('/appointment', event)
    
    showSuccess(response, alert)
    
    // Reset form
    form.value = { patientId: '', professionalId: '', start: null, end: null, notes: '' }
    selectedPatient.value = null
    selectedProfessional.value = null
    
    await fetchAppointmentsFn()
    if (calendarRef && calendarRef.value) {
      calendarRef.value.getApi().refetchEvents()
    }
  } catch (error) {
    showError(error, alert)
    throw error
  }
}

export async function saveAppointmentOwnPatient(formData, alert, calendarRef, fetchAppointmentsFn) {
  try {
    if (!alert) {
      return
    }

    if (!formData.professionalId) {
      showError('Professional must be selected', alert)
      return
    }
    
    if (!formData.patientId) {
      showError('Patient ID is required', alert)
      return
    }

    const appointmentData = {
      startDate: formData.start,
      endDate: formData.end,
      patientId: formData.patientId,
      professionalId: formData.professionalId,
      notes: formData.notes || '',
    }

    const response = await post('/appointment', appointmentData)
    
    showSuccess(response, alert)
    
    if (fetchAppointmentsFn) {
      await fetchAppointmentsFn()
    }
    
    if (calendarRef && calendarRef.value) {
      calendarRef.value.getApi().refetchEvents()
    }
    
  } catch (error) {
    showError(error, alert)
    throw error
  }
}

// Nueva función específica para profesionales
export async function saveAppointmentProfessional(form, selectedPatient, alert, calendarRef, fetchAppointmentsFn) {
  if (!form.value.patientId || !form.value.professionalId) {
    showError('Patient and professional must be selected', alert)
    return
  }

  const event = {
    startDate: form.value.start,
    endDate: form.value.end,
    patientId: form.value.patientId,
    professionalId: form.value.professionalId,
    notes: form.value.notes || '',
  }
  
  try {
    const response = await post('/appointment', event)
    
    showSuccess(response, alert)
    
    // Reset form
    form.value = { 
      patientId: '', 
      professionalId: '', 
      start: null, 
      end: null, 
      notes: '' 
    }
    
    // Solo resetear selectedPatient (no hay selectedProfessional en contexto profesional)
    if (selectedPatient && selectedPatient.value !== undefined) {
      selectedPatient.value = null
    }
    
    await fetchAppointmentsFn()
    if (calendarRef && calendarRef.value) {
      calendarRef.value.getApi().refetchEvents()
    }
    
  } catch (error) {
    showError(error, alert)
    throw error
  }
}
