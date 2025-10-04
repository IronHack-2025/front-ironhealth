<template>
  <v-container>
    <v-card class="pa-4">
      <FullCalendar ref="calendarRef" :options="calendarOptions" style="max-width: 100%" />
    </v-card>
    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title>📅 {{ t('views.appointments.newAppointment') }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="form.start"
            :value="
              form.start && form.end ? `${formatDate(form.start)} - ${formatDate(form.end)}` : ''
            "
            :label="t('views.appointments.time')"
            outlined
            dense
            required
            readonly
          />
          <v-select
            v-model="selectedPatient"
            :items="availablePatients"
            item-value="_id"
            :item-title="(item) => `${item.lastName}, ${item.firstName}`"
            :label="t('views.appointments.patients')"
            outlined
            dense
          ></v-select>
          <v-alert
            v-if="form.start && form.end && !isProfessionalAvailable"
            type="warning"
            dense
            class="mt-2"
          >
            {{ t('views.appointments.selectDifferentTime') }}
          </v-alert>
          <v-text-field
            v-model="form.notes"
            :label="t('views.appointments.notes')"
            outlined
            dense
            maxlength="500"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="red" variant="tonal" @click="dialog = false">{{
            t('common.buttons.close')
          }}</v-btn>
          <v-btn
            color="primary"
            @click="handleSaveAppointment"
            :disabled="!selectedPatient || !isProfessionalAvailable"
          >
            {{ t('common.buttons.save') }}
          </v-btn>
        </v-card-actions>
        <AlertMessage
          :show="alert.show"
          :type="alert.type"
          :message-code="alert.messageCode"
          :details="alert.details"
          :message-params="alert.params"
          :message="alert.message"
        />
      </v-card>
    </v-dialog>

    <v-dialog v-model="showEventDialog" max-width="600">
      <v-card>
        <v-card-title>{{ t('views.appointments.details') }}</v-card-title>
        <v-card-text v-if="selectedEvent && selectedEvent.extendedProps">
          <div>
            <strong>{{ t('views.appointments.patient') }}</strong>
            {{
              `${selectedEvent.extendedProps.patientLastName}, ${selectedEvent.extendedProps.patientFirstName}`
            }}
          </div>
          <div>
            <strong>{{ t('views.appointments.start') }}</strong>
            {{ formatDate(selectedEvent.start) }}
          </div>
          <div>
            <strong>{{ t('views.appointments.end') }}</strong> {{ formatDate(selectedEvent.end) }}
          </div>
          <div class="mt-4">
            <strong>{{ t('views.appointments.notes') }}</strong>
            <v-text-field
              v-model="editableNotes"
              outlined
              dense
              rows="3"
              maxlength="500"
              counter
              class="mt-2"
            />
          </div>
          <div class="mt-4">
            <strong>{{ t('views.appointments.professionalNotes') }}</strong>
            <v-textarea
              v-model="editableProfessionalNotes"
              outlined
              rows="4"
              maxlength="1000"
              counter
              auto-grow
            />
          </div>
        </v-card-text>
        <v-card-text v-else>
          <div>{{ t('messages.error.ERROR_LOADING_APPOINTMENTS') }}</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="red" variant="tonal" @click="handleCancelAppointment">{{
            t('common.buttons.cancel')
          }}</v-btn>
          <v-btn color="blue" variant="tonal" @click="handleUpdateNotesProfessional">{{ t('common.buttons.saveNotes') }}</v-btn>
          <v-btn color="primary" variant="tonal" @click="showEventDialog = false">{{
            t('common.buttons.close')
          }}</v-btn>
        </v-card-actions>
        <AlertMessage
          :show="alert.show"
          :type="alert.type"
          :message-code="alert.messageCode"
          :details="alert.details"
          :message-params="alert.params"
          :fallback-message="alert.message"
        />
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { get } from '../services/api'
import { ref, onMounted, watch, reactive, computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import AlertMessage from './AlertMessage.vue'
import esLocale from '@fullcalendar/core/locales/es'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'
import { 
  cancelAppointment,
  handleEventDrop,
  updateNotesProfessional,
  saveAppointmentProfessional, // ← Cambiar de saveAppointment a saveAppointmentProfessional
  formatDate,
  fetchProfessionals,
  fetchPatients,
  fetchAppointments,
  reloadCalendarEvents,
  resetAlert,
  showError,
  isPersonAvailable
} from '../utils/calendarFunctions'

const { t } = useI18n()
const { user, isProfessional } = useAuth()

const props = defineProps({
  calendarLocale: {
    type: String,
    default: 'es',
  },
})

const patients = ref([])
const professionals = ref([])
const selectedPatient = ref(null)
const selectedEvent = ref(null)
const showEventDialog = ref(false)
const calendarRef = ref(null)
const appointments = ref([])
const isDataLoaded = ref(false)

const isProfessionalAvailable = computed(() => {
  if (!form.value.start || !form.value.end || !user.value?.profileId) {
    return true
  }

  return isPersonAvailable(
    user.value.profileId,
    form.value.start,
    form.value.end,
    appointments.value,
    'professional'
  )
})

 const availablePatients = computed(() => {
  if (!form.value.start || !form.value.end) {
    return patients.value.map((pat) => ({ ...pat, disabled: false }))
  }

  const availablePatients = patients.value.filter((pat) => {
    return isPersonAvailable(pat._id, form.value.start, form.value.end, appointments.value, 'patient')
  })

  return availablePatients
})

const alert = reactive({
  show: false,
  message: '',
  type: 'success',
  messageCode: 'OPERATION_SUCCESS',
  details: null,
  params: {},
})
// Sincroniza la selección del v-select con el formulario
watch(selectedPatient, (newVal) => {
  form.value.patientId = newVal
})

// Watcher para actualizar el idioma del calendario
watch(
  () => props.calendarLocale,
  (newLocale) => {
    calendarOptions.value.locale = newLocale
    // Forzar actualización del calendario
    if (calendarRef.value) {
      calendarRef.value.getApi().refetchEvents()
    }
  },
)
// Watcher para recargar eventos cuando cambien los datos
watch(
  [patients, professionals],
  () => {
    if (isDataLoaded.value) {
      reloadCalendarEvents(calendarRef)
    }
  },
  { deep: true },
)

const dialog = ref(false)

const editableNotes = ref('')
const editableProfessionalNotes = ref('')

const form = ref({
  patientId: '',
  professionalId: '',
  start: null,
  end: null,
  notes: '',
  professionalNotes: '',
})

const calendarOptions = ref({
  plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin],
  initialView: 'listWeek',
  selectable: true,
  editable: true,
  selectAllow(selectInfo) {
    const now = new Date()
    return selectInfo.start >= now
  },
  locales: [esLocale],
  locale: props.calendarLocale,
  selectMirror: true,
  expandRows: false,
  height: 'auto',

  eventContent: (arg) => {
    const { event, view } = arg

    // Solo añadir botón en vista de lista
    if (view.type === 'listWeek') {
      const container = document.createElement('div')
      container.style.display = 'flex'
      container.style.justifyContent = 'space-between'
      container.style.alignItems = 'center'
      container.style.width = '100%'

      // Título del evento
      const title = document.createElement('span')
      title.textContent = event.title
      title.style.flex = '1'
      title.style.paddingRight = '8px'

      // Botón de historial
      const historyBtn = document.createElement('button')
      historyBtn.innerHTML = `📋 ${t('views.appointments.viewHistory')}`
      historyBtn.className = 'v-btn v-btn--size-small v-btn--variant-tonal'
      historyBtn.style.marginLeft = '8px'
      historyBtn.style.padding = '4px 8px'
      historyBtn.style.fontSize = '12px'
      historyBtn.style.minWidth = 'auto'
      historyBtn.style.height = 'auto'
      historyBtn.style.backgroundColor = 'rgb(var(--v-theme-primary))'
      historyBtn.style.color = 'white'
      historyBtn.style.border = '1px solid rgb(var(--v-theme-primary))'
      historyBtn.style.borderRadius = '4px'
      historyBtn.style.cursor = 'pointer'
      historyBtn.style.transition = 'all 0.2s ease'

      // Hover effects
      historyBtn.addEventListener('mouseenter', () => {
        historyBtn.style.backgroundColor = 'rgb(var(--v-theme-primary))'
        historyBtn.style.color = 'rgb(var(--v-theme-on-primary))'
        historyBtn.style.transform = 'translateY(-1px)'
        historyBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
      })

      historyBtn.addEventListener('mouseleave', () => {
        historyBtn.style.backgroundColor = 'rgb(var(--v-theme-primary))'
        historyBtn.style.color = 'white'
        historyBtn.style.transform = 'translateY(0)'
        historyBtn.style.boxShadow = 'none'
      })

      // Evento click del botón usando la función ya definida
      historyBtn.onclick = (e) => {
        e.stopPropagation() // Evitar que se abra el modal del evento
        const patientId = event.extendedProps.patientId
        goToPatientHistory(patientId) // Usar la función ya definida
      }

      container.appendChild(title)
      container.appendChild(historyBtn)

      return { domNodes: [container] }
    }

    // Para otras vistas, usar el contenido por defecto
    return { html: event.title }
  },

  events: async (fetchInfo, successCallback, failureCallback) => {
    try {
      if (!isDataLoaded.value) {
        successCallback([])
        return
      }
      const response = await get('/appointment')
      const data = response.data || []

      // Validar que data sea un array
      if (!Array.isArray(data)) {
        console.error('API response data is not an array:', data)
        successCallback([])
        return
      }

      // Filtrar eventos no cancelados y del profesional logueado
      const filtered = data.filter((ev) => {
        if (ev.status?.cancelled) return false

        // Si es un profesional logueado, mostrar solo sus citas
        if (isProfessional.value && user.value?.profileId) {
          return ev.professionalId === user.value.profileId
        }

        return true
      })

      const events = filtered.map((event) => {
        const patient = patients.value.find((p) => p._id === event.patientId) || {}
        const professional = professionals.value.find((p) => p._id === event.professionalId) || {}

        // Si es el profesional logueado viendo sus propias citas, mostrar solo el paciente
        const title =
          isProfessional.value && user.value?.profileId === event.professionalId
            ? `${patient.lastName}, ${patient.firstName}`
            : `${patient.lastName}, ${patient.firstName} - Dr. ${professional.lastName}`

        return {
          title: title,
          id: event._id,
          start: event.startDate,
          end: event.endDate,
          backgroundColor: professional.color || '',
          extendedProps: {
            patientId: event.patientId,
            patientFirstName: patient.firstName || '',
            patientLastName: patient.lastName || '',
            professionalId: event.professionalId,
            professionalFirstName: professional.firstName || '',
            professionalLastName: professional.lastName || '',
            notes: event.notes,
          },
        }
      })
      successCallback(events)
    } catch (error) {
      failureCallback(error)
    }
  },
  select: async (info) => {
    resetAlert(alert)
    form.value.start = info.startStr
    form.value.end = info.endStr
    
    // Asegurar que se establezca el professionalId
    if (isProfessional.value && user.value?.profileId) {
      form.value.professionalId = user.value.profileId
    }
    
    // Reset otros campos
    form.value.patientId = ''
    form.value.notes = ''
    selectedPatient.value = null
    
    appointments.value = await fetchAppointments()
    dialog.value = true
  },
  firstDay: 1,
  headerToolbar: {
    left: 'prev,today,next',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
  },
  slotMinTime: '07:00:00',
  slotMaxTime: '22:00:00',
  eventClick: async (info) => {
    resetAlert(alert)
    selectedEvent.value = info.event
    editableNotes.value = info.event.extendedProps.notes || ''
    showEventDialog.value = true
  },
  eventDrop: (info) => handleEventDrop(info, {
  calendarRef,
  alert,
  fetchAppointmentsFn: async () => { 
    appointments.value = await fetchAppointments() 
  }
}),
})

const goToPatientHistory = (patientId) => {
  // Emitir evento al componente padre para mostrar PatientHistoryCalendar
  emit('openPatientHistory', patientId)
}

const emit = defineEmits(['openPatientHistory'])

onMounted(async () => {
  try {
   const [patientsData, professionalsData] = await Promise.all([
      fetchPatients(),     
      fetchProfessionals(),
    ])
      
    const appointmentsData = await fetchAppointments() 
    
    patients.value = patientsData
    professionals.value = professionalsData
    appointments.value = appointmentsData

    isDataLoaded.value = true 
    reloadCalendarEvents(calendarRef)
  } catch (error) {
    console.error('Error al cargar datos iniciales:', error)
    showError(error, alert)
  }
})

const handleUpdateNotesProfessional = async () => {
  try {
    if (!selectedEvent.value) return

    console.log('🎯 Starting update notes...') // Debug log

    await updateNotesProfessional(
      selectedEvent.value,
      editableNotes.value,
      editableProfessionalNotes.value,
      alert,
      async () => { 
        appointments.value = await fetchAppointments() 
      }
    )

    console.log('✅ Update notes completed, alert state:', alert) // Debug log

    // Solo cerrar el diálogo si la operación fue exitosa
    if (alert.show && alert.type === 'success') {
      setTimeout(() => {
        showEventDialog.value = false
        resetAlert(alert)
      }, 3000) // Aumentar a 3 segundos para dar más tiempo
    } else if (alert.show && alert.type === 'error') {
      // Si hay error, no cerrar el diálogo automáticamente
      // Dejar que el usuario vea el error y cierre manualmente
    }

  } catch (error) {
    console.error('❌ Error in handleUpdateNotesProfessional:', error)
    showError(error, alert)
    // No cerrar el diálogo en caso de error
  }
}

const handleCancelAppointment = async () => {
  try {
    console.log('🎯 Starting cancel appointment...') // Debug log

    await cancelAppointment(
      selectedEvent, 
      alert, 
      calendarRef, 
      async () => { 
        appointments.value = await fetchAppointments() 
      }
    )

    console.log('✅ Cancel appointment completed, alert state:', alert) // Debug log

    // Solo cerrar si la operación fue exitosa
    if (alert.show && alert.type === 'success') {
      setTimeout(() => {
        showEventDialog.value = false
        resetAlert(alert)
      }, 3000)
    }

  } catch (error) {
    console.error('❌ Error in handleCancelAppointment:', error)
    showError(error, alert)
  }
}
const handleSaveAppointment = async () => {
  try {
    console.log('🎯 Starting save appointment...')
    
    await saveAppointmentProfessional( // ← Usar la nueva función
      form, 
      selectedPatient, 
      alert, 
      calendarRef,
      async () => { 
        appointments.value = await fetchAppointments() 
      }
    )
    
    console.log('✅ Save appointment completed, alert state:', alert)
    
    if (alert.show && alert.type === 'success') {
      setTimeout(() => {
        dialog.value = false
        resetAlert(alert)
      }, 3000)
    }
  } catch (error) {
    console.error('❌ Error in handleSaveAppointment:', error)
    showError(error, alert)
  }
}
</script>

<style scoped>
/* Igualar la altura de todas las filas de slots en FullCalendar */
.equal-slot-height .fc-timegrid-slot {
  height: 40px !important;
  /* Ajusta el valor según lo que necesites */
}

/* ✅ Estilos para los eventos del calendario */
:deep(.fc-list-event) {
  position: relative;
}

/* Asegurar que el texto del evento no se superponga con el botón */
:deep(.fc-list-event-title) {
  padding-right: 60px;
}
</style>
