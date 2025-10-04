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
  console.log('Evento arrastrado:', event)

  try {
    await cancelAppointmentById(event.id)
    console.log('La cita antigua fue cancelada con éxito')

    const newAppointmentData = {
      startDate: event.start,
      endDate: event.end,
      patientId: event.extendedProps.patientId,
      professionalId: event.extendedProps.professionalId,
      notes: event.extendedProps.notes,
    }

    const response = await post('/appointment', newAppointmentData)
    console.log('Reprogramación exitosa', response)

    event.setProp('id', response.data._id)
    calendarRef.value.getApi().refetchEvents()
    showSuccess(response, alert)
  } catch (error) {
    console.error('Error al reprogramar:', error)
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
export async function updateNotesProfessional(selectedEvent, editableNotes, editableProfessionalNotes, alert) {
  if (!selectedEvent.value) return

  try {
    const response = await patch(`/appointment/${selectedEvent.value.id}/notes`, {
      notes: editableNotes.value,
      professionalNotes: editableProfessionalNotes.value,
    })
    showSuccess(response, alert)
    selectedEvent.value.setExtendedProp('notes', editableNotes.value)
    selectedEvent.value.setExtendedProp('professionalNotes', editableProfessionalNotes.value)
  } catch (error) {
    showError(error, alert)
  }
}
export async function saveAppointment(form, selectedPatient, selectedProfessional, dialog, alert, calendarRef, fetchAppointmentsFn) {
  if (!form.value.patientId || !form.value.professionalId) return

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
    dialog.value = false
    
    await fetchAppointmentsFn()
    calendarRef.value.getApi().refetchEvents()
  } catch (error) {
    console.error('Error:', error)
    showError(error, alert)
    if (error.messageCode === 'VALIDATION_FAILED') {
      showValidationErrors(alert)
    }
  }
}

export function reloadCalendarEvents(calendarRef) {
  if (calendarRef.value?.getApi) {
    calendarRef.value.getApi().refetchEvents()
  }
}
export async function saveAppointmentOwnPatient(form, user, isPatientAvailable, selectedProfessional, dialog, alert, calendarRef, fetchAppointments) {
  if (!form.value.professionalId) return

  // Asegurar que el patientId está asignado para pacientes logueados
  if (user.value?.profileId && !form.value.patientId) {
    form.value.patientId = user.value.profileId
  }

  if (!form.value.patientId) return

  // Verificar disponibilidad del paciente logueado
  if (!isPatientAvailable.value) {
    alert.type = 'error'
    alert.messageCode = 'PATIENT_NOT_AVAILABLE'
    alert.details = null
    alert.params = {}
    alert.message = ''
    alert.show = true
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

    showSuccess(response)
    // Solo resetear si fue exitoso
    form.value = {
      patientId: user.value?.profileId || '',
      professionalId: '',
      start: null,
      end: null,
      notes: '',
    }
    selectedProfessional.value = null
    dialog.value = false
    await fetchAppointments()
    calendarRef.value.getApi().refetchEvents()
  } catch (error) {
    console.error('Error:', error)

    showError(error)
  }
}

export function showSuccess(response, alert) {
  alert.show = true
  alert.type = 'success'
  alert.messageCode = response?.messageCode || 'OPERATION_SUCCESS'
  alert.message = ''
  alert.details = response?.details || null
  alert.params = response?.params || {}
}

export function showError(error, alert) {
  console.error('Error:', error)
  alert.show = true
  alert.type = 'error'
  alert.messageCode = error?.messageCode || error?.response?.data?.messageCode || 'INTERNAL_SERVER_ERROR'
  alert.message = ''
  alert.details = error?.details || error?.response?.data?.details || null
  alert.params = error?.params || error?.response?.data?.params || {}
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
