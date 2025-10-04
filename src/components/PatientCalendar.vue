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
            v-model="selectedProfessional"
            :items="availableProfessionals"
            item-value="_id"
            :item-title="(item) => `${item.lastName}, ${item.firstName}`"
            item-disabled="disabled"
            :label="t('views.appointments.professionals')"
            outlined
            dense
          ></v-select>
          <v-alert
            v-if="form.start && form.end && !isPatientAvailable"
            type="warning"
            dense
            class="mt-2"
          >
            {{ t('views.appointments.patientNotAvailable') }}
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
            :disabled="!selectedProfessional || !isPatientAvailable"
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
              :fallback-message="alert.message" 
            />
      </v-card>
    </v-dialog>

    <v-dialog v-model="showEventDialog" max-width="500">
      <v-card>
        <v-card-title>{{ t('views.appointments.details') }}</v-card-title>
        <v-card-text v-if="selectedEvent && selectedEvent.extendedProps">
          <!-- Mostrar detalles solo si es cita propia -->
          <div v-if="selectedEvent.extendedProps.isOwnAppointment">
            <div>
              <strong>{{ t('views.appointments.professional') }}</strong>
              {{
                `Dr. ${selectedEvent.extendedProps.professionalLastName}, ${selectedEvent.extendedProps.professionalFirstName}`
              }}
            </div>
            <div>
              <strong>{{ t('views.appointments.start') }}</strong>
              {{ formatDate(selectedEvent.start) }}
            </div>
            <div>
              <strong>{{ t('views.appointments.end') }}</strong> {{ formatDate(selectedEvent.end) }}
            </div>
          </div>
          <!-- Mostrar información limitada para citas de otros pacientes -->
          <div v-else>
            <div>
              <strong>{{ t('views.appointments.patient') }}</strong>
              {{ t('views.appointments.privateInfo') }}
            </div>
            <div>
              <strong>{{ t('views.appointments.professional') }}</strong>
              {{
                `Dr. ${selectedEvent.extendedProps.professionalLastName}, ${selectedEvent.extendedProps.professionalFirstName}`
              }}
            </div>
            <div>
              <strong>{{ t('views.appointments.start') }}</strong>
              {{ formatDate(selectedEvent.start) }}
            </div>
            <div>
              <strong>{{ t('views.appointments.end') }}</strong> {{ formatDate(selectedEvent.end) }}
            </div>
            <v-alert type="info" dense class="mt-4">
              {{ t('views.appointments.privateAppointment') }}
            </v-alert>
          </div>
        </v-card-text>
        <v-card-text v-else>
          <div>{{ t('views.appointments.errorLoadingAppointments') }}</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <!-- Botones solo para citas propias -->
          <template v-if="selectedEvent && selectedEvent.extendedProps.isOwnAppointment">
            <v-btn color="red" variant="tonal" @click="handleCancelAppointment">{{ t('common.buttons.cancel') }}</v-btn>
          </template>
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
import { post, get, put } from '../services/api'
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
  saveAppointmentOwnPatient,
  formatDate,
  fetchProfessionals,
  fetchAppointments,
  reloadCalendarEvents,
  resetAlert,
  showError,
  isPersonAvailable
  } from '../utils/calendarFunctions'

const { t } = useI18n()
const { user } = useAuth()

const props = defineProps({
  calendarLocale: {
    type: String,
    default: 'es',
  },
})

const professionals = ref([])
const selectedProfessional = ref(null)
const selectedEvent = ref(null)
const showEventDialog = ref(false)
const calendarRef = ref(null)
const appointments = ref([])
const isDataLoaded = ref(false)


const form = ref({
  patientId: '',
  professionalId: '',
  start: null,
  end: null,
  notes: '',
})

const dialog = ref(false)
const editableNotes = ref('')

const alert = reactive({
  show: false,
  message: '',
  type: 'success',
  messageCode: 'OPERATION_SUCCESS',
  details: null,
  params: {},
})

watch(
  () => user.value?.profileId,
  (newPatientId) => {
    if (newPatientId) {
      form.value.patientId = newPatientId
    }
  },
  { immediate: true },
)

// Sincroniza la selección del v-select con el formulario
watch(selectedProfessional, (newVal) => {
  form.value.professionalId = newVal
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
  [professionals],
  () => {
    if (isDataLoaded.value) {
      reloadCalendarEvents(calendarRef)
    }
  },
  { deep: true },
)

const availableProfessionals = computed(() => {
  if (!form.value.start || !form.value.end) {
    return professionals.value.map((pro) => ({ ...pro, disabled: false }))
  }

  // Filtrar para mostrar solo profesionales disponibles
  const filtered = professionals.value.filter((pro) => {
    return isPersonAvailable(pro._id, form.value.start, form.value.end, appointments.value, 'professional')
  })

  // Si no hay profesionales disponibles, mostrar mensaje
  if (filtered.length === 0) {
    return [
      {
        _id: null,
        firstName: t('views.appointments.tryDifferentTime'),
        lastName: t('views.appointments.noAvailableProfessionals'),
        disabled: true,
      },
    ]
  }

  return filtered
}) 

const isPatientAvailable = computed(() => {
  if (!form.value.start || !form.value.end || !user.value?.profileId) {
    return true
  }

  return isPersonAvailable(
    user.value.profileId, 
    form.value.start, 
    form.value.end, 
    appointments.value, 
    'patient'
  )
})


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
    console.error('Error in handleCancelAppointment:', error)
    showError(error, alert)
  }
}

const handleSaveAppointment = async () => {
  try {
    console.log('🎯 Starting save appointment...') // Debug log
    
    await saveAppointmentOwnPatient(
      form.value, 
      alert, 
      calendarRef, 
      async () => { 
        appointments.value = await fetchAppointments() 
      }
    )
    
    console.log('✅ Save appointment completed, alert state:', alert) // Debug log
    
    // Reset form después del éxito
    form.value = {
      patientId: user.value?.profileId || '',
      professionalId: '',
      start: null,
      end: null,
      notes: '',
    }
    selectedProfessional.value = null
    
    // Solo cerrar el diálogo y resetear la alerta después de mostrarla
    if (alert.show && alert.type === 'success') {
      setTimeout(() => {
        dialog.value = false
        resetAlert(alert)
      }, 3000) // Dar 3 segundos para ver la alerta
    }
    
  } catch (error) {
    console.error('Error in handleSaveAppointment:', error)
    showError(error, alert)
  }
}

const calendarOptions = ({
  plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin],
  initialView: 'timeGridWeek',
  selectable: true,
  editable: false,
  selectAllow(selectInfo) {
    const now = new Date()
    return selectInfo.start >= now
  },
  locales: [esLocale],
  locale: props.calendarLocale,
  selectMirror: true,
  expandRows: false,
  height: 'auto',
  
  events: async (fetchInfo, successCallback, failureCallback) => {
    try {
      if (!isDataLoaded.value) {
        successCallback([])
        return
      }
      const response = await get('/appointment')
      const data = response.data || []

      if (!Array.isArray(data)) {
        console.error('API response data is not an array:', data)
        successCallback([])
        return
      }

      const filtered = data.filter((ev) => !ev.status?.cancelled)

      const events = filtered.map((event) => {
        const professional = professionals.value.find((p) => p._id === event.professionalId) || {}
        const isOwnAppointment = user.value?.profileId === event.patientId

        let title
        if (isOwnAppointment) {
          title = `Dr. ${professional.lastName}, ${professional.firstName}`
        } else {
          title = `Cita ocupada - Dr. ${professional.lastName}`
        }

        return {
          title: title,
          id: event._id,
          start: event.startDate,
          end: event.endDate,
          backgroundColor: isOwnAppointment ? professional.color || '#1976d2' : '#9e9e9e',
          borderColor: isOwnAppointment ? undefined : '#757575',
          textColor: isOwnAppointment ? undefined : '#424242',
          extendedProps: {
            patientId: event.patientId,
            professionalId: event.professionalId,
            professionalFirstName: professional.firstName || '',
            professionalLastName: professional.lastName || '',
            notes: isOwnAppointment ? event.notes || '' : '',
            isOwnAppointment: isOwnAppointment,
          },
        }
      })
      successCallback(events)
    } catch (error) {
      console.error('Error loading events:', error)
      failureCallback(error)
    }
  },

  select: async (info) => {
    resetAlert(alert)
    form.value.start = info.startStr
    form.value.end = info.endStr
    if (user.value?.profileId) {
      form.value.patientId = user.value.profileId
    }
    appointments.value = await fetchAppointments()
    dialog.value = true
  },

  eventClick: async (info) => {
    resetAlert(alert)
    selectedEvent.value = info.event
    editableNotes.value = info.event.extendedProps.notes || ''
    showEventDialog.value = true
  },

  firstDay: 1,
  headerToolbar: {
    left: 'prev,today,next',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
  },
  slotMinTime: '07:00:00',
  slotMaxTime: '22:00:00',
})

onMounted(async () => {
  try {
   const [professionalsData] = await Promise.all([
      fetchProfessionals(),
    ])
        if (user.value?.profileId) {
      form.value.patientId = user.value.profileId
    }

    const appointmentsData = await fetchAppointments()

    professionals.value = professionalsData
    appointments.value = appointmentsData

    isDataLoaded.value = true 
    reloadCalendarEvents(calendarRef)
  } catch (error) {
    console.error('Error al cargar datos iniciales:', error)
    showError(error, alert)
  }
})
</script>

<style scoped>
/* Igualar la altura de todas las filas de slots en FullCalendar */
.equal-slot-height .fc-timegrid-slot {
  height: 40px !important;
  /* Ajusta el valor según lo que necesites */
}
</style>
