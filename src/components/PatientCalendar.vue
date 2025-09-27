<template>
  <v-container>
    <v-card class="pa-4">
      <v-card-title class="text-h5 mb-4">
        📅 {{ t('views.appointments.myAppointments') }}
      </v-card-title>
      <FullCalendar 
        ref="calendarRef" 
        :options="calendarOptions" 
        style="max-width: 100%;" 
      />
    </v-card>

    <!-- Dialog simplificado para pacientes - Solo reservar citas disponibles -->
    <v-dialog v-model="dialog" max-width="400">
      <v-card>
        <v-card-title>{{ t('views.appointments.bookAppointment') }}</v-card-title>
        <v-card-text>
          <v-text-field 
            :value="form.start && form.end ? `${formatDate(form.start)} - ${formatDate(form.end)}` : ''"
            :label="t('views.appointments.selectedTime')" 
            outlined 
            dense 
            readonly 
          />
          
          <v-select 
            v-model="selectedProfessional" 
            :items="availableProfessionals" 
            item-value="_id"
            :item-title="item => `Dr. ${item.lastName}, ${item.firstName} - ${getProfessionName(item.profession)}`"
            :label="t('views.appointments.selectProfessional')" 
            outlined 
            dense
          />

          <v-alert v-if="!availableProfessionals.length" type="warning" class="mt-3">
            {{ t('views.appointments.noProfessionalsAvailable') }}
          </v-alert>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn color="red" variant="tonal" @click="dialog = false">
            {{ t('common.buttons.cancel') }}
          </v-btn>
          <v-btn 
            color="primary" 
            @click="bookAppointment"
            :disabled="!selectedProfessional"
          >
            {{ t('common.buttons.book') }}
          </v-btn>
        </v-card-actions>
        
        <Alert :show="alert.show" :type="alert.type" :message-code="alert.messageCode" 
               :details="alert.details" :message-params="alert.params" :fallback-message="alert.message" />
      </v-card>
    </v-dialog>

    <!-- Dialog de detalles de cita -->
    <v-dialog v-model="showEventDialog" max-width="500">
      <v-card>
        <v-card-title>{{ t('views.appointments.appointmentDetails') }}</v-card-title>
        <v-card-text v-if="selectedEvent">
          <!-- Solo mostrar detalles de SUS citas -->
          <div v-if="isMyAppointment(selectedEvent)">
            <div class="mb-2">
              <strong>{{ t('views.appointments.professional') }}:</strong> 
              Dr. {{ selectedEvent.extendedProps.professionalLastName }}, {{ selectedEvent.extendedProps.professionalFirstName }}
            </div>
            <div class="mb-2">
              <strong>{{ t('views.appointments.date') }}:</strong> 
              {{ formatFullDate(selectedEvent.start) }}
            </div>
            <div class="mb-2">
              <strong>{{ t('views.appointments.time') }}:</strong> 
              {{ formatTimeRange(selectedEvent.start, selectedEvent.end) }}
            </div>
            <div v-if="selectedEvent.extendedProps.notes" class="mb-2">
              <strong>{{ t('views.appointments.notes') }}:</strong>
              <p class="mt-1">{{ selectedEvent.extendedProps.notes }}</p>
            </div>
          </div>
          
          <!-- Información limitada para citas de otros -->
          <div v-else>
            <div class="mb-2">
              <strong>{{ t('views.appointments.date') }}:</strong> 
              {{ formatFullDate(selectedEvent.start) }}
            </div>
            <div class="mb-2">
              <strong>{{ t('views.appointments.time') }}:</strong> 
              {{ formatTimeRange(selectedEvent.start, selectedEvent.end) }}
            </div>
            <v-alert type="info" variant="tonal" class="mt-3">
              {{ t('views.appointments.appointmentOccupied') }}
            </v-alert>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <!-- Solo mostrar cancelar si es SU cita -->
          <v-btn 
            v-if="isMyAppointment(selectedEvent)" 
            color="red" 
            variant="tonal" 
            @click="cancelMyAppointment"
          >
            {{ t('common.buttons.cancelAppointment') }}
          </v-btn>
          <v-btn color="primary" variant="tonal" @click="showEventDialog = false">
            {{ t('common.buttons.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import esLocale from '@fullcalendar/core/locales/es'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth.js'
import { get, post } from '@/services/api'
import Alert from './AlertMessage.vue'
import professionsData from '@/assets/data/professions.json'

const { t, locale } = useI18n()
const { user } = useAuth()

// State
const professionals = ref([])
const appointments = ref([])
const selectedProfessional = ref(null)
const selectedEvent = ref(null)
const showEventDialog = ref(false)
const dialog = ref(false)
const calendarRef = ref(null)

const form = ref({
  start: null,
  end: null
})

const alert = reactive({
  show: false,
  message: '',
  type: 'success',
  messageCode: 'OPERATION_SUCCESS',
  details: null,
  params: {},
})

// Helper functions
const getText = (val) => {
  if (typeof val === 'string') return val
  if (val && typeof val === 'object') {
    return val[locale.value] || val.en || Object.values(val)[0] || ''
  }
  return ''
}

const getProfessionName = (code) => {
  for (const p of professionsData.professions) {
    if (p.code === code) return getText(p.text)
  }
  return '—'
}

const isMyAppointment = (event) => {
  return event && event.extendedProps && event.extendedProps.patientId === user.value?.profileId
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('es-ES', { 
    weekday: 'short', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const formatFullDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('es-ES', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatTimeRange = (start, end) => {
  if (!start || !end) return ''
  const startTime = new Date(start).toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  const endTime = new Date(end).toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  return `${startTime} - ${endTime}`
}

// Computed
const availableProfessionals = computed(() => {
  if (!form.value.start || !form.value.end) {
    return professionals.value
  }

  const formStart = new Date(form.value.start).getTime()
  const formEnd = new Date(form.value.end).getTime()

  return professionals.value.filter(pro => {
    const conflicts = appointments.value.filter(appointment => {
      if (appointment.status?.cancelled) return false
      if (appointment.professionalId !== pro._id) return false

      const appointmentStart = new Date(appointment.startDate).getTime()
      const appointmentEnd = new Date(appointment.endDate).getTime()

      return formStart < appointmentEnd && formEnd > appointmentStart
    })

    return conflicts.length === 0
  })
})

// Methods
const resetAlert = () => {
  alert.show = false
  alert.message = ''
  alert.type = 'success'
  alert.messageCode = 'OPERATION_SUCCESS'
  alert.details = null
  alert.params = {}
}

const bookAppointment = async () => {
  if (!selectedProfessional.value || !user.value?.profileId) return

  const appointmentData = {
    startDate: form.value.start,
    endDate: form.value.end,
    patientId: user.value.profileId, // Automáticamente usar el ID del paciente logueado
    professionalId: selectedProfessional.value,
    notes: '' // Los pacientes no pueden agregar notas iniciales
  }

  try {
    const response = await post('/appointment', appointmentData)

    alert.type = 'success'
    alert.messageCode = response.messageCode || 'APPOINTMENT_BOOKED'
    alert.show = true

    form.value = { start: null, end: null }
    selectedProfessional.value = null
    dialog.value = false
    
    await fetchAppointments()
    calendarRef.value?.getApi().refetchEvents()

  } catch (error) {
    console.error('Error booking appointment:', error)
    alert.type = 'error'
    alert.messageCode = error.messageCode || 'APPOINTMENT_BOOKING_FAILED'
    alert.details = error.details || null
    alert.show = true
  }
}

const cancelMyAppointment = async () => {
  if (!selectedEvent.value || !isMyAppointment(selectedEvent.value)) return

  try {
    const response = await fetch(`http://localhost:3000/api/appointment/${selectedEvent.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: { cancelled: true, timestamp: new Date() }
      }),
    })

    if (response.ok) {
      const result = await response.json()
      alert.type = 'success'
      alert.messageCode = result.messageCode || 'APPOINTMENT_CANCELLED'
      alert.show = true
      showEventDialog.value = false
      
      await fetchAppointments()
      calendarRef.value?.getApi().refetchEvents()
    }
  } catch (error) {
    console.error('Error cancelling appointment:', error)
    alert.type = 'error'
    alert.messageCode = 'APPOINTMENT_CANCEL_FAILED'
    alert.show = true
  }
}

const fetchAppointments = async () => {
  try {
    const response = await get('/appointment')
    appointments.value = response.data || []
  } catch (error) {
    console.error('Error fetching appointments:', error)
  }
}

const fetchProfessionals = async () => {
  try {
    const response = await get('/professionals')
    professionals.value = response.data || []
  } catch (error) {
    console.error('Error fetching professionals:', error)
  }
}

// Calendar configuration
const calendarOptions = ref({
  plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin],
  initialView: 'timeGridWeek',
  selectable: true, // Los pacientes pueden seleccionar slots
  editable: false,  // Los pacientes NO pueden arrastrar/editar citas
  locales: [esLocale],
  locale: 'es',
  selectMirror: true,
  height: 'auto',
  
  events: async (fetchInfo, successCallback, failureCallback) => {
    try {
      const response = await get("/appointment")
      const data = response.data || []
      
      const filtered = data.filter(ev => !ev.status?.cancelled)
      
      const events = filtered.map(event => {
        const patient = { firstName: 'Paciente', lastName: '' }
        const professional = professionals.value.find(p => p._id === event.professionalId) || {}
        const isMyEvent = event.patientId === user.value?.profileId
        
        return {
          title: isMyEvent 
            ? `Mi cita - Dr. ${professional.lastName || 'Profesional'}`
            : 'Ocupado',
          id: event._id,
          start: event.startDate,
          end: event.endDate,
          backgroundColor: isMyEvent ? '#28a745' : '#6c757d',
          borderColor: isMyEvent ? '#1e7e34' : '#5a6268',
          extendedProps: {
            patientId: event.patientId,
            professionalId: event.professionalId,
            professionalFirstName: professional.firstName || '',
            professionalLastName: professional.lastName || '',
            notes: isMyEvent ? event.notes : null, // Solo mostrar notas propias
            isMyAppointment: isMyEvent
          }
        }
      })
      
      successCallback(events)
    } catch (error) {
      failureCallback(error)
    }
  },
  
  select: async (info) => {
    resetAlert()
    form.value.start = info.startStr
    form.value.end = info.endStr
    await fetchAppointments()
    dialog.value = true
  },
  
  firstDay: 1,
  headerToolbar: {
    left: 'prev,today,next',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  slotMinTime: '07:00:00',
  slotMaxTime: '22:00:00',
  
  eventClick: (info) => {
    resetAlert()
    selectedEvent.value = info.event
    showEventDialog.value = true
  }
})

// Lifecycle
onMounted(async () => {
  await fetchProfessionals()
  await fetchAppointments()
  calendarRef.value?.getApi().refetchEvents()
})
</script>

<style scoped>
.v-card-title {
  color: #1976d2;
}
</style>