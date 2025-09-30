<template>
  <v-container>
    <v-card class="pa-4">
      <v-card-title v-if="showPatientInfo && patient" class="d-flex align-center">
        <v-icon icon="mdi-calendar-clock" class="me-2" color="primary" />
        {{ t('views.appointments.historyFor') }} {{ patient.firstName }} {{ patient.lastName }}
      </v-card-title>
      <FullCalendar ref="calendarRef" :options="calendarOptions" style="max-width: 100%" />
    </v-card>

    <v-dialog v-model="showEventDialog" max-width="500">
      <v-card>
        <v-card-title>{{ t('views.appointments.details') }}</v-card-title>
        <v-card-text v-if="selectedEvent && selectedEvent.extendedProps">
          <!-- Mostrar información del paciente solo si showPatientInfo es true -->
          <div
            v-if="
              showPatientInfo &&
              (selectedEvent.extendedProps.patientFirstName ||
                selectedEvent.extendedProps.patientLastName)
            "
          >
            <strong>{{ t('views.appointments.patient') }}</strong>
            {{
              `${selectedEvent.extendedProps.patientLastName}, ${selectedEvent.extendedProps.patientFirstName}`
            }}
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

          <!-- Estado de la cita -->
          <div class="mt-2">
            <v-chip
              :color="selectedEvent.extendedProps.isCancelled ? 'red' : 'green'"
              :variant="selectedEvent.extendedProps.isCancelled ? 'flat' : 'tonal'"
              size="small"
            >
              {{
                selectedEvent.extendedProps.isCancelled
                  ? t('views.appointments.cancelled')
                  : t('views.appointments.active')
              }}
            </v-chip>
          </div>

          <!-- Fecha de cancelación si aplica -->
          <div
            v-if="
              selectedEvent.extendedProps.isCancelled && selectedEvent.extendedProps.cancelledAt
            "
            class="mt-2"
          >
            <strong>{{ t('views.appointments.cancelledAt') }}</strong>
            {{ formatDate(selectedEvent.extendedProps.cancelledAt) }}
          </div>

          <!-- Notas del paciente - Solo visible para profesionales -->
          <div v-if="selectedEvent.extendedProps.notes && canViewNotes" class="mt-4">
            <strong>{{ t('views.appointments.notes') }}</strong>
            <v-textarea
              :value="selectedEvent.extendedProps.notes"
              outlined
              dense
              rows="2"
              readonly
              class="mt-2"
            />
          </div>

          <!-- Notas del profesional - Solo visible para profesionales -->
          <div v-if="selectedEvent.extendedProps.professionalNotes && canViewNotes" class="mt-4">
            <strong>{{ t('views.appointments.professionalNotes') }}</strong>
            <v-textarea
              :value="selectedEvent.extendedProps.professionalNotes"
              outlined
              dense
              rows="3"
              readonly
              class="mt-2"
            />
          </div>
        </v-card-text>
        <v-card-text v-else>
          <div>Error al cargar los detalles de la cita</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="tonal" @click="showEventDialog = false">{{
            t('common.buttons.close')
          }}</v-btn>
        </v-card-actions>
        <Alert
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
import listPlugin from '@fullcalendar/list'
import Alert from './AlertMessage.vue'
import esLocale from '@fullcalendar/core/locales/es'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  calendarLocale: {
    type: String,
    default: 'es',
  },
  patientId: {
    type: String,
    required: true, // Siempre requiere la ID del paciente
  },
  showPatientInfo: {
    type: Boolean,
    default: true, // Por defecto muestra la info del paciente
  },
})

const professionals = ref([])
const patient = ref(null)
const selectedEvent = ref(null)
const showEventDialog = ref(false)
const calendarRef = ref(null)
const isDataLoaded = ref(false)

// Siempre podemos ver las notas ya que es un historial específico de un paciente
const canViewNotes = ref(true)

const alert = reactive({
  show: false,
  message: '',
  type: 'success',
  messageCode: 'OPERATION_SUCCESS',
  details: null,
  params: {},
})

// Watcher para actualizar el idioma del calendario
watch(
  () => props.calendarLocale,
  (newLocale) => {
    calendarOptions.value.locale = newLocale
    if (calendarRef.value) {
      calendarRef.value.getApi().refetchEvents()
    }
  },
)

// Watcher para recargar cuando cambie el paciente
watch(
  () => props.patientId,
  async (newPatientId) => {
    if (newPatientId) {
      await fetchPatient(newPatientId)
      if (isDataLoaded.value) {
        reloadCalendarEvents()
      }
    }
  },
)

watch(
  [professionals],
  () => {
    if (isDataLoaded.value) {
      reloadCalendarEvents()
    }
  },
  { deep: true },
)

const resetAlert = () => {
  alert.show = false
  alert.message = ''
  alert.type = 'success'
  alert.messageCode = 'OPERATION_SUCCESS'
  alert.details = null
  alert.params = {}
}

// Función para obtener el paciente por ID (solo si showPatientInfo es true)
const fetchPatient = async (patientId) => {
  if (!props.showPatientInfo) {
    return // No carga el paciente si no hay que mostrar su info
  }

  try {
    const response = await get(`/patients/${patientId}`)
    patient.value = response.data
  } catch (error) {
    console.error('Error fetching patient:', error)
    alert.show = true
    alert.type = 'error'
    alert.messageCode = 'PATIENT_NOT_FOUND'
    alert.message = 'Error al cargar la información del paciente'
  }
}

// Función reactiva para formatear fechas basada en el locale
const formatDate = computed(() => {
  const locale = props.calendarLocale === 'es' ? 'es-ES' : 'en-US'
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }

  return (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleString(locale, options)
  }
})

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin],
  initialView: 'listWeek',
  selectable: false,
  editable: false,
  locales: [esLocale],
  locale: props.calendarLocale,
  selectMirror: true,
  expandRows: false,
  height: 'auto',

  events: async (fetchInfo, successCallback, failureCallback) => {
    try {
      if (!isDataLoaded.value || !props.patientId) {
        successCallback([])
        return
      }

      // Obtener todas las citas filtrando por patientId
      const response = await get('/appointment')
      const data = response.data || []

      if (!Array.isArray(data)) {
        console.error('API response data is not an array:', data)
        successCallback([])
        return
      }

      // Filtrar por este paciente específico
      const filtered = data.filter((ev) => ev.patientId === props.patientId)

      const events = filtered.map((event) => {
        const professional = professionals.value.find((p) => p._id === event.professionalId) || {}
        const isCancelled = event.status?.cancelled

        // Título - mostrar profesional
        const professionalTitle =
          professional.firstName && professional.lastName
            ? `Dr. ${professional.lastName}, ${professional.firstName}`
            : 'Profesional desconocido'

        const title = isCancelled
          ? `[${t('views.appointments.cancelled')}] ${professionalTitle}`
          : professionalTitle

        return {
          title: title,
          id: event._id,
          start: event.startDate,
          end: event.endDate,
          backgroundColor: isCancelled ? '#f44336' : professional.color || '#1976d2',
          borderColor: isCancelled ? '#d32f2f' : undefined,
          textColor: isCancelled ? '#ffffff' : undefined,
          classNames: isCancelled ? ['cancelled-appointment'] : [],
          extendedProps: {
            patientId: event.patientId,
            professionalId: event.professionalId,
            professionalFirstName: professional.firstName || '',
            professionalLastName: professional.lastName || '',
            patientFirstName: patient.value?.firstName || event.patient?.firstName || '',
            patientLastName: patient.value?.lastName || event.patient?.lastName || '',
            notes: event.notes || '',
            professionalNotes: event.professionalNotes || '',
            isCancelled: isCancelled,
            cancelledAt: isCancelled ? event.status?.timestamp : null,
          },
        }
      })
      successCallback(events)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      failureCallback(error)
    }
  },

  firstDay: 1,
  headerToolbar: {
    left: 'prev,today,next',
    center: 'title',
    right: 'dayGridMonth,listWeek',
  },
  slotMinTime: '07:00:00',
  slotMaxTime: '22:00:00',
  eventClick: async (info) => {
    resetAlert()
    selectedEvent.value = info.event
    showEventDialog.value = true
  },
})

const fetchProfessionals = async () => {
  try {
    const response = await get('/professionals')
    professionals.value = response.data || []
  } catch (error) {
    console.error('Error fetching professionals:', error)
  }
}

const reloadCalendarEvents = () => {
  if (calendarRef.value?.getApi) {
    calendarRef.value.getApi().refetchEvents()
  }
}

onMounted(async () => {
  try {
    // Cargar solo los datos necesarios
    await fetchProfessionals()

    // Cargar paciente solo si hay que mostrar su info
    if (props.patientId && props.showPatientInfo) {
      await fetchPatient(props.patientId)
    }

    // Marcar que los datos están cargados
    isDataLoaded.value = true

    // Recargar los eventos del calendario
    reloadCalendarEvents()
  } catch (error) {
    console.error('Error al cargar datos iniciales:', error)
  }
})
</script>

<style scoped>
/* Igualar la altura de todas las filas de slots en FullCalendar */
.equal-slot-height .fc-timegrid-slot {
  height: 40px !important;
  /* Ajusta el valor según lo que necesites */
}

/* Estilos para citas canceladas */
:deep(.cancelled-appointment) {
  opacity: 0.8;
}

:deep(.cancelled-appointment .fc-event-title) {
  font-style: italic;
}
</style>
