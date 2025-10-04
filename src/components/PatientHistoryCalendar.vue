<template>
  <v-container>
    <v-card class="pa-4">
      <FullCalendar ref="calendarRef" :options="calendarOptions" style="max-width: 100%" />
    </v-card>
    <v-dialog v-model="showEventDialog" max-width="500">
      <v-card>
        <v-card-title>{{ t('views.appointments.details') }}</v-card-title>
        <v-card-text v-if="selectedEvent && selectedEvent.extendedProps">
          <!-- Mostrar información del paciente solo si es visible para profesionales y hay datos -->
          <div
            v-if="
              canViewNotes &&
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
          <div>Error loading appointment details</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
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
import listPlugin from '@fullcalendar/list'
import AlertMessage from './AlertMessage.vue'
import esLocale from '@fullcalendar/core/locales/es'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'
import { fetchProfessionals, formatDate, reloadCalendarEvents, resetAlert, showError } from '../utils/calendarFunctions'

const { t } = useI18n()
const { user, isProfessional, isAdmin } = useAuth()

// Computed para verificar si el usuario puede ver las notas
const canViewNotes = computed(() => isProfessional.value || isAdmin.value)

const props = defineProps({
  calendarLocale: {
    type: String,
    default: 'es',
  },
  patientId: {
    type: String,
    default: null,
  },
})

const professionals = ref([])
const selectedEvent = ref(null)
const showEventDialog = ref(false)
const calendarRef = ref(null)
const isDataLoaded = ref(false)

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
    // Forzar actualización del calendario
    if (calendarRef.value) {
      calendarRef.value.getApi().refetchEvents()
    }
  },
)

// Actualizar watcher para eliminar patients
watch(
  [professionals],
  () => {
    if (isDataLoaded.value) {
      reloadCalendarEvents(calendarRef) // ← Pasar calendarRef como parámetro
    }
  },
  { deep: true },
)

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

      // Filtrar citas según el contexto
      const filtered = data.filter((ev) => {
        // Si es profesional y hay un paciente seleccionado, mostrar solo ese paciente
        if (props.patientId) {
          return ev.patientId === props.patientId
        }
        // Si es paciente, mostrar solo sus citas
        return ev.patientId === user.value?.profileId
      })

      const events = filtered.map((event) => {
        const professional = professionals.value.find((p) => p._id === event.professionalId) || {}
        // Usar directamente los datos del evento en lugar de buscar en patients array
        const isCancelled = event.status?.cancelled

        // Título - siempre mostrar profesional
        const professionalTitle = `Dr. ${professional.lastName}, ${professional.firstName}`
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
            // Usar directamente los datos del evento si están disponibles
            patientFirstName: event.patient?.firstName || '',
            patientLastName: event.patient?.lastName || '',
            notes: event.notes || '',
            professionalNotes: event.professionalNotes || '',
            isCancelled: isCancelled,
            cancelledAt: isCancelled ? event.status?.timestamp : null,
          },
        }
      })
      successCallback(events)
    } catch (error) {
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
    resetAlert(alert) // ← Pasar alert como parámetro
    selectedEvent.value = info.event
    showEventDialog.value = true
  },
})

// ELIMINAR el primer onMounted y mantener solo uno corregido
onMounted(async () => {
  try {
    console.log('🎯 Loading initial data for PatientHistoryCalendar...')
    
    const professionalsData = await fetchProfessionals()
    professionals.value = professionalsData

    isDataLoaded.value = true 
    reloadCalendarEvents(calendarRef) // ← Pasar calendarRef como parámetro
    
    console.log('✅ Initial data loaded successfully')
  } catch (error) {
    console.error('Error al cargar datos iniciales:', error)
    showError(error, alert)
  }
})

// Watcher para recargar cuando cambie el paciente seleccionado
watch(
  () => props.patientId,
  () => {
    if (isDataLoaded.value) {
      reloadCalendarEvents(calendarRef) // ← Pasar calendarRef como parámetro
    }
  },
)
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
