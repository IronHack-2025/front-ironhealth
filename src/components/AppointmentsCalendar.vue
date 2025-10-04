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
          <v-btn color="primary" @click="handleSaveAppointment">{{ t('common.buttons.save') }}</v-btn>
        </v-card-actions>
        <AlertMessage :show="alert.show" :type="alert.type" :message="alert.message" />
      </v-card>
    </v-dialog>

    <v-dialog v-model="showEventDialog" max-width="500">
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
            <strong>{{ t('views.appointments.professional') }}</strong>
            {{
              `${selectedEvent.extendedProps.professionalLastName}, ${selectedEvent.extendedProps.professionalFirstName}`
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
            <v-textarea
              v-model="editableNotes"
              outlined
              dense
              rows="3"
              maxlength="500"
              counter
              class="mt-2"
            />
          </div>
        </v-card-text>
        <v-card-text v-else>
          <div>Error loading appointment details</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="red" variant="tonal" @click="handleCancelAppointment">{{
            t('common.buttons.cancel')
          }}</v-btn>
          <v-btn color="blue" variant="tonal" @click="handleUpdateNotes">{{
            t('common.buttons.saveNotes')
          }}</v-btn>
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
import { post, get } from '../services/api'
import { ref, onMounted, watch, reactive, computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import AlertMessage from './AlertMessage.vue'
import esLocale from '@fullcalendar/core/locales/es'
import { useI18n } from 'vue-i18n'
import { 
  cancelAppointment,
  handleEventDrop,
  updateNotes,
  saveAppointment,
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

const props = defineProps({
  calendarLocale: {
    type: String,
    default: 'es',
  },
})
const isDataLoaded = ref(false)
const patients = ref([])
const professionals = ref([])
const selectedPatient = ref(null)
const selectedProfessional = ref(null)
const selectedEvent = ref(null)
const showEventDialog = ref(false)
const calendarRef = ref(null)
const appointments = ref([])
const availableProfessionals = computed(() => {
  if (!form.value.start || !form.value.end) {
    return professionals.value.map((pro) => ({ ...pro, disabled: false }))
  }

  // Convertir las fechas del formulario a timestamps para comparación más robusta
  const formStart = new Date(form.value.start).getTime()
  const formEnd = new Date(form.value.end).getTime()

  // Filtrar para mostrar solo profesionales disponibles
  const availableProfessionals = professionals.value.filter((pro) => {
    return isPersonAvailable(pro._id, form.value.start, form.value.end, appointments.value, 'professional')
  })

  // Si no hay profesionales disponibles, mostrar mensaje
  if (availableProfessionals.length === 0) {
    return [
      {
        _id: null,
        firstName: 'try different time.',
        lastName: 'No available professionals',
        disabled: true,
      },
    ]
  }

  return availableProfessionals
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

const form = ref({
  patientId: '',
  professionalId: '',
  start: null,
  end: null,
  notes: '',
})


const calendarOptions = ref({
  plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin],
  initialView: 'timeGridWeek',
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

      // Filtrar eventos no cancelados
      const filtered = data.filter((ev) => !ev.status?.cancelled)

      const events = filtered.map((event) => {
        const patient = patients.value.find((p) => p._id === event.patientId) || {}
        const professional = professionals.value.find((p) => p._id === event.professionalId) || {}
        return {
          title: `${patient.lastName}, ${patient.firstName} - Dr. ${professional.lastName}`,
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
    await fetchAppointments()
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

const handleUpdateNotes = async () => {
  await updateNotes(selectedEvent, editableNotes, alert)
}

const handleCancelAppointment = async () => {
  await cancelAppointment(
    selectedEvent, 
    alert, 
    calendarRef, 
    async () => { 
      appointments.value = await fetchAppointments() 
    }
  )
  setTimeout(() => {
    resetAlert(alert)
    showEventDialog.value = false
  }, 2000)
}
const handleSaveAppointment = async () => {
  await saveAppointment(
    form, 
    selectedPatient, 
    selectedProfessional, 
    dialog, 
    alert, 
    calendarRef,
    async () => { 
      appointments.value = await fetchAppointments() 
    }
  )
}
</script>

<style scoped>
/* Igualar la altura de todas las filas de slots en FullCalendar */
.equal-slot-height .fc-timegrid-slot {
  height: 40px !important;
  /* Ajusta el valor según lo que necesites */
}
</style>
