<template>
  <v-container>
    <v-card class="pa-4">
      <FullCalendar ref="calendarRef" :options="calendarOptions" style="max-width: 100%;" />
    </v-card>
    <v-dialog v-model="showEventDialog" max-width="500">
      <v-card>
        <v-card-title>{{ t('views.appointments.details') }}</v-card-title>
        <v-card-text v-if="selectedEvent && selectedEvent.extendedProps">
          <div><strong>{{ t('views.appointments.patient') }}</strong> {{
            loggedPatient ? `${loggedPatient.lastName}, ${loggedPatient.firstName}` : ''
            }}</div>
          <div><strong>{{ t('views.appointments.professional') }}</strong> {{
            `Dr. ${selectedEvent.extendedProps.professionalLastName}, ${selectedEvent.extendedProps.professionalFirstName}`
            }}</div>
          <div><strong>{{ t('views.appointments.start') }}</strong> {{ formatDate(selectedEvent.start) }}</div>
          <div><strong>{{ t('views.appointments.end') }}</strong> {{ formatDate(selectedEvent.end) }}</div>
          
          <!-- Estado de la cita -->
          <div class="mt-2">
            <v-chip 
              :color="selectedEvent.extendedProps.isCancelled ? 'red' : 'green'" 
              :variant="selectedEvent.extendedProps.isCancelled ? 'flat' : 'tonal'"
              size="small">
              {{ selectedEvent.extendedProps.isCancelled ? t('views.appointments.cancelled') : t('views.appointments.completed') }}
            </v-chip>
          </div>
          
          <!-- Fecha de cancelación si aplica -->
          <div v-if="selectedEvent.extendedProps.isCancelled && selectedEvent.extendedProps.cancelledAt" class="mt-2">
            <strong>{{ t('views.appointments.cancelledAt') }}</strong> {{ formatDate(selectedEvent.extendedProps.cancelledAt) }}
          </div>
          
          <!-- Notas del paciente -->
          <div v-if="selectedEvent.extendedProps.notes" class="mt-4">
            <strong>{{ t('views.appointments.notes') }}</strong>
            <v-textarea 
              :value="selectedEvent.extendedProps.notes" 
              outlined 
              dense 
              rows="2" 
              readonly 
              class="mt-2" />
          </div>
          
          <!-- Notas del profesional -->
          <div v-if="selectedEvent.extendedProps.professionalNotes" class="mt-4">
            <strong>{{ t('views.appointments.professionalNotes') }}</strong>
            <v-textarea 
              :value="selectedEvent.extendedProps.professionalNotes" 
              outlined 
              dense 
              rows="3" 
              readonly 
              class="mt-2" />
          </div>
        </v-card-text>
        <v-card-text v-else>
          <div>Error loading appointment details</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="tonal" @click="showEventDialog = false">{{ t('common.buttons.close')
          }}</v-btn>
        </v-card-actions>
         <Alert :show="alert.show" :type="alert.type" :message-code="alert.messageCode" 
               :details="alert.details" :message-params="alert.params" :fallback-message="alert.message" />
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
import { useAuth } from '../composables/useAuth'

const { t } = useI18n()
const { user } = useAuth()

const props = defineProps({
  calendarLocale: {
    type: String,
    default: 'es'
  }
})

const patients = ref([])
const professionals = ref([])
const selectedEvent = ref(null)
const showEventDialog = ref(false)
const calendarRef = ref(null)
const appointments = ref([])
const isDataLoaded = ref(false)

// Computed para obtener el paciente logueado del array de patients
const loggedPatient = computed(() => {
  if (!user.value?.profileId || !patients.value.length) return null;
  return patients.value.find(patient => patient._id === user.value.profileId);
});

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
      calendarRef.value.getApi().refetchEvents();
    }
  }
)
// Watcher para recargar eventos cuando cambien los datos
watch([patients, professionals], () => {
  if (isDataLoaded.value) {
    reloadCalendarEvents()
  }
}, { deep: true })

const resetAlert = () => {
  alert.show = false
  alert.message = ''
  alert.type = 'success'
  alert.messageCode = 'OPERATION_SUCCESS'
  alert.details = null
  alert.params = {}
}

// Función reactiva para formatear fechas basada en el locale
const formatDate = computed(() => {
  const locale = props.calendarLocale === 'es' ? 'es-ES' : 'en-US';
  const options = { weekday: 'short', hour: '2-digit', minute: '2-digit' };
  
  return (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString(locale, options);
  };
});

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
      const response = await get("/appointment");
      const data = response.data || [];

       // Validar que data sea un array
      if (!Array.isArray(data)) {
        console.error('API response data is not an array:', data);
        successCallback([]);
        return;
      }
      
      // Filtrar SOLO las citas del paciente logueado (incluyendo canceladas)
      const filtered = data.filter(ev => {
        return ev.patientId === user.value?.profileId;
      });

      const events = filtered.map(event => {
        const professional = professionals.value.find(p => p._id === event.professionalId) || {};
        const isCancelled = event.status?.cancelled;
        
        // Título para el paciente (solo mostrar el profesional)
        const title = isCancelled 
          ? `[${t('views.appointments.cancelled')}] Dr. ${professional.lastName}, ${professional.firstName}`
          : `Dr. ${professional.lastName}, ${professional.firstName}`;
          
        return {
          title: title,
          id: event._id,
          start: event.startDate,
          end: event.endDate,
          backgroundColor: isCancelled ? '#f44336' : (professional.color || '#1976d2'),
          borderColor: isCancelled ? '#d32f2f' : undefined,
          textColor: isCancelled ? '#ffffff' : undefined,
          classNames: isCancelled ? ['cancelled-appointment'] : [],
          extendedProps: {
            patientId: event.patientId,
            professionalId: event.professionalId,
            professionalFirstName: professional.firstName || '',
            professionalLastName: professional.lastName || '',
            notes: event.notes || '',
            professionalNotes: event.professionalNotes || '',
            isCancelled: isCancelled,
            cancelledAt: isCancelled ? event.status?.timestamp : null
          }
        };
      });
      successCallback(events);
    } catch (error) {
      failureCallback(error);
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
  }
})


const fetchProfessionals = async () => {
  try {
    const response = await get('/professionals');
    professionals.value = response.data || [];
  } catch (error) {
    console.error('Error fetching professionals:', error);
  }
};

const fetchPatients = async () => {
  try {
    const response = await get('/patients');
    patients.value = response.data || [];
  } catch (error) {
    console.error('Error fetching patients:', error);
  }
};
const reloadCalendarEvents = () => {
  if (calendarRef.value?.getApi) {
    calendarRef.value.getApi().refetchEvents()
  }
}
// Call fetchAppointments on component mount
onMounted(async () => {
try {
    // Cargar todos los datos necesarios primero
    await Promise.all([
      fetchPatients(),
      fetchProfessionals()
    ])
    
    // Marcar que los datos están cargados
    isDataLoaded.value = true
    
    // Recargar los eventos del calendario
    reloadCalendarEvents()
    
  } catch (error) {
    console.error('Error al cargar datos iniciales:', error)
  }
});

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
