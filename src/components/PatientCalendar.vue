<template>
  <v-container>
    <v-card class="pa-4">
      <FullCalendar ref="calendarRef" :options="calendarOptions" style="max-width: 100%;" />
    </v-card>
    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title>📅 {{ t('views.appointments.newAppointment') }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.start"
            :value="form.start && form.end ? `${formatDate(form.start)} - ${formatDate(form.end)}` : ''"
            :label="t('views.appointments.time')" outlined dense required readonly />
          <v-select v-model="selectedProfessional" :items="availableProfessionals" item-value="_id"
            :item-title="item => `${item.lastName}, ${item.firstName}`" item-disabled="disabled"
            :label="t('views.appointments.professionals')" outlined dense></v-select>
          <v-alert 
            v-if="form.start && form.end && !isPatientAvailable"
            type="warning"
            dense
            class="mt-2">
            {{ t('views.appointments.patientNotAvailable') }}
          </v-alert>
          <v-text-field v-model="form.notes" :label="t('views.appointments.notes')" outlined dense maxlength="500" />

        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="red" variant="tonal" @click="dialog = false">{{ t('common.buttons.close') }}</v-btn>
          <v-btn 
            color="primary" 
            @click="saveAppointment"
            :disabled="!selectedProfessional || !isPatientAvailable">
            {{ t('common.buttons.save') }}
          </v-btn>
        </v-card-actions>
        <Alert :show="alert.show" :type="alert.type" :message="alert.message" />
      </v-card>
    </v-dialog>

    <v-dialog v-model="showEventDialog" max-width="500">
      <v-card>
        <v-card-title>{{ t('views.appointments.details') }}</v-card-title>
        <v-card-text v-if="selectedEvent && selectedEvent.extendedProps">
          <!-- Mostrar detalles solo si es cita propia -->
          <div v-if="selectedEvent.extendedProps.isOwnAppointment">
           
            <div><strong>{{ t('views.appointments.professional') }}</strong> {{
              `Dr. ${selectedEvent.extendedProps.professionalLastName}, ${selectedEvent.extendedProps.professionalFirstName}`
              }}</div>
            <div><strong>{{ t('views.appointments.start') }}</strong> {{ formatDate(selectedEvent.start) }}</div>
            <div><strong>{{ t('views.appointments.end') }}</strong> {{ formatDate(selectedEvent.end) }}</div>
           
          </div>
          <!-- Mostrar información limitada para citas de otros pacientes -->
          <div v-else>
            <div><strong>{{ t('views.appointments.patient') }}</strong> {{ t('views.appointments.privateInfo') }}</div>
            <div><strong>{{ t('views.appointments.professional') }}</strong> {{
              `Dr. ${selectedEvent.extendedProps.professionalLastName}, ${selectedEvent.extendedProps.professionalFirstName}`
              }}</div>
            <div><strong>{{ t('views.appointments.start') }}</strong> {{ formatDate(selectedEvent.start) }}</div>
            <div><strong>{{ t('views.appointments.end') }}</strong> {{ formatDate(selectedEvent.end) }}</div>
            <v-alert type="info" dense class="mt-4">
              {{ t('views.appointments.privateAppointment') }}
            </v-alert>
          </div>
        </v-card-text>
        <v-card-text v-else>
          <div>Error loading appointment details</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <!-- Botones solo para citas propias -->
          <template v-if="selectedEvent && selectedEvent.extendedProps.isOwnAppointment">
            <v-btn color="red" variant="tonal" @click="cancelAppointment">{{ t('common.buttons.cancel') }}</v-btn>
        
          </template>
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
import { post, get } from '../services/api'
import { ref, onMounted, watch, reactive, computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import Alert from './AlertMessage.vue'
import esLocale from '@fullcalendar/core/locales/es'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'

const { t } = useI18n()
const { user, isAuthenticated } = useAuth()

const props = defineProps({
  calendarLocale: {
    type: String,
    default: 'es'
  }
})

const patients = ref([])
const professionals = ref([])
const selectedProfessional = ref(null)
const selectedEvent = ref(null)
const showEventDialog = ref(false)
const calendarRef = ref(null)
const appointments = ref([])

// Computed para obtener el paciente logueado del array de patients
const loggedPatient = computed(() => {
  if (!user.value?.profileId || !patients.value.length) return null;
  return patients.value.find(patient => patient._id === user.value.profileId);
});

const availableProfessionals = computed(() => {
  if (!form.value.start || !form.value.end) {
    return professionals.value.map(pro => ({ ...pro, disabled: false }));
  }

  // Convertir las fechas del formulario a timestamps para comparación más robusta
  const formStart = new Date(form.value.start).getTime();
  const formEnd = new Date(form.value.end).getTime();

  // Filtrar para mostrar solo profesionales disponibles
  const availableProfessionals = professionals.value.filter(pro => {
    // Buscar conflictos para este profesional
    const conflicts = appointments.value.filter(appointment => {
      if (appointment.status?.cancelled) return false;
      if (appointment.professionalId !== pro._id) return false;

      const appointmentStart = new Date(appointment.startDate).getTime();
      const appointmentEnd = new Date(appointment.endDate).getTime();

      // Detectar solapamiento: nuevo inicio < cita fin Y nuevo fin > cita inicio
      const hasOverlap = formStart < appointmentEnd && formEnd > appointmentStart;

      return hasOverlap;
    });

    const isAvailable = conflicts.length === 0;

    return isAvailable; // Solo devolver profesionales SIN conflictos
  });

  // Si no hay profesionales disponibles, mostrar mensaje
  if (availableProfessionals.length === 0) {
    return [{
      _id: null,
      firstName: 'try different time.',
      lastName: 'No available professionals',
      disabled: true
    }];
  }

  return availableProfessionals;
});

// Computed para verificar si el paciente logueado está disponible en el horario seleccionado
const isPatientAvailable = computed(() => {
  if (!form.value.start || !form.value.end || !user.value?.profileId) {
    return true;
  }

  const formStart = new Date(form.value.start).getTime();
  const formEnd = new Date(form.value.end).getTime();
  const patientId = user.value.profileId;

  const conflicts = appointments.value.filter(appointment => {
    if (appointment.status?.cancelled) return false;
    if (appointment.patientId !== patientId) return false;

    const appointmentStart = new Date(appointment.startDate).getTime();
    const appointmentEnd = new Date(appointment.endDate).getTime();

    // Detectar solapamiento
    const hasOverlap = formStart < appointmentEnd && formEnd > appointmentStart;
    return hasOverlap;
  });

  return conflicts.length === 0;
});

const alert = reactive({
  show: false,
  message: '',
  type: 'success',
  messageCode: 'OPERATION_SUCCESS',
  details: null,
  params: {},
})
// Sincroniza la selección del v-select con el formulario
watch(selectedProfessional, (newVal) => {
  form.value.professionalId = newVal
})

// Watcher para asignar automáticamente el paciente logueado al formulario
watch(loggedPatient, (newPatient) => {
  if (newPatient && newPatient._id) {
    form.value.patientId = newPatient._id
  }
}, { immediate: true })

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

watch(
  () => props.calendarLocale,
  (newLocale) => {
    calendarOptions.value.locale = newLocale
  })

const dialog = ref(false)

const editableNotes = ref('')

const form = ref({
  patientId: "",
  professionalId: "",
  start: null,
  end: null,
  notes: ""
})

const resetAlert = () => {
  alert.show = false
  alert.message = ''
  alert.type = 'success'
  alert.messageCode = 'OPERATION_SUCCESS'
  alert.details = null
  alert.params = {}
}

const cancelAppointment = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`http://localhost:3000/api/appointment/${selectedEvent.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: {
          cancelled: true,
          timestamp: new Date()
        }
      }),
    })

    if (response.ok) {
      const result = await response.json();
      
      alert.type = 'success';
      alert.messageCode = result.messageCode || 'APPOINTMENT_CANCELLED';
      alert.details = null;
      alert.params = {};
      alert.message = t(`messages.success.${result.messageCode || 'APPOINTMENT_CANCELLED'}`);
      alert.show = true;

    } else {
      const errorData = await response.json();
      
      alert.type = 'error';
      alert.messageCode = errorData.messageCode || 'APPOINTMENT_CANCEL_FAILED';
      alert.details = errorData.details || null;
      alert.params = {};
      alert.message = t(`messages.error.${errorData.messageCode || 'APPOINTMENT_CANCEL_FAILED'}`);
      alert.show = true;
    }
  } catch (error) {
    console.error('Error de conexión al cancelar la cita:', error);
    
    alert.type = 'error';
    alert.messageCode = 'NETWORK_ERROR';
    alert.details = null;
    alert.params = {};
    alert.message = t('messages.error.NETWORK_ERROR');
    alert.show = true;
  }
    await fetchAppointments();
  calendarRef.value.getApi().refetchEvents();
}

const saveAppointment = async () => {
  if (!form.value.professionalId) return
  
  // Asegurar que el patientId está asignado para pacientes logueados
  if (user.value?.profileId && !form.value.patientId) {
    form.value.patientId = user.value.profileId
  }
  
  if (!form.value.patientId) return
  
  // Verificar disponibilidad del paciente logueado
  if (!isPatientAvailable.value) {
    alert.type = 'error';
    alert.messageCode = 'PATIENT_NOT_AVAILABLE';
    alert.details = null;
    alert.params = {};
    alert.message = '';
    alert.show = true;
    return;
  }

  const event = {
    startDate: form.value.start,
    endDate: form.value.end,
    patientId: form.value.patientId,
    professionalId: form.value.professionalId,
    notes: form.value.notes || ""
  }
  try {
    const response = await post('/appointment', event)

    alert.type = 'success';
    alert.messageCode = response.messageCode || 'APPOINTMENT_CREATED';
    alert.details = null;
    alert.params = {};
    alert.message = t(`messages.success.${response.messageCode || 'APPOINTMENT_CREATED'}`);
    alert.show = true;

    // Solo resetear si fue exitoso
    form.value = { patientId: "", professionalId: "", start: null, end: null, notes: "" };
    selectedProfessional.value = null;
    dialog.value = false;
    await fetchAppointments();
    calendarRef.value.getApi().refetchEvents();
  }

   catch (error) {
    console.error('Error:', error);
    
    alert.type = 'error';
    alert.messageCode = error.messageCode || 'APPOINTMENT_CREATE_FAILED';
    alert.details = error.details || null;
    alert.params = {};
    alert.message = t(`messages.error.${error.messageCode || 'APPOINTMENT_CREATE_FAILED'}`);
    alert.show = true;
  }
}

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  // Día y hora (ejemplo: "lun, 10:30")
  const options = { weekday: 'short', hour: '2-digit', minute: '2-digit' };
  return d.toLocaleString('es-ES', options);
};

const calendarOptions = ref({
  plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin],
  initialView: 'timeGridWeek',
  selectable: true,
  editable: false,
  locales: [esLocale],
  locale: props.calendarLocale,
  selectMirror: true,
  expandRows: false,
  height: 'auto',

  events: async (fetchInfo, successCallback, failureCallback) => {
    try {
      const response = await get("/appointment");
      const data = response.data || [];

       // Validar que data sea un array
      if (!Array.isArray(data)) {
        console.error('API response data is not an array:', data);
        successCallback([]);
        return;
      }
      
      // Filtrar eventos no cancelados
      const filtered = data.filter(ev => !ev.status?.cancelled);

      const events = filtered.map(event => {
        const patient = patients.value.find(p => p._id === event.patientId) || {};
        const professional = professionals.value.find(p => p._id === event.professionalId) || {};
        const isOwnAppointment = user.value?.profileId === event.patientId;
        
        // Determinar el título según si es cita propia o de otro paciente
        let title;
        if (isOwnAppointment) {
          // Cita propia: mostrar solo el profesional
          title = `Dr. ${professional.lastName}, ${professional.firstName}`;
        } else {
          // Cita de otro paciente: ocultar datos del paciente
          title = `Cita ocupada - Dr. ${professional.lastName}`;
        }
          
        return {
          title: title,
          id: event._id,
          start: event.startDate,
          end: event.endDate,
          backgroundColor: isOwnAppointment ? (professional.color || '#1976d2') : '#9e9e9e',
          borderColor: isOwnAppointment ? undefined : '#757575',
          textColor: isOwnAppointment ? undefined : '#424242',
          extendedProps: {
            patientId: event.patientId,
            // Solo incluir datos del paciente si es la cita propia
            patientFirstName: isOwnAppointment ? (patient.firstName || '') : '',
            patientLastName: isOwnAppointment ? (patient.lastName || '') : '',
            professionalId: event.professionalId,
            professionalFirstName: professional.firstName || '',
            professionalLastName: professional.lastName || '',
            notes: isOwnAppointment ? (event.notes || '') : '',
            isOwnAppointment: isOwnAppointment
          }
        };
      });
      successCallback(events);
    } catch (error) {
      failureCallback(error);
    }
  },

  select: async (info) => {
    resetAlert()
    form.value.start = info.startStr
    form.value.end = info.endStr
    // Asignar automáticamente el ID del paciente logueado
    if (user.value?.profileId) {
      form.value.patientId = user.value.profileId
    }
    await fetchAppointments();
    dialog.value = true;
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
    resetAlert()
    selectedEvent.value = info.event
    editableNotes.value = info.event.extendedProps.notes || ''
    showEventDialog.value = true
  }
})

// Ensure appointments are fetched and displayed correctly
const fetchAppointments = async () => {
  try {
    const response = await get('/appointment');
    appointments.value = response.data || [];
     
    if (calendarRef.value) {
      calendarRef.value.getApi().refetchEvents();
    }
  } catch (error) {
    console.error('Error fetching appointments:', error);
  }
};

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
// Call fetchAppointments on component mount
onMounted(async () => {

  await fetchProfessionals();
  await fetchPatients();
  await fetchAppointments();

  if (calendarRef.value) {
    calendarRef.value.getApi().refetchEvents();
  }
});

</script>

<style scoped>
/* Igualar la altura de todas las filas de slots en FullCalendar */
.equal-slot-height .fc-timegrid-slot {
  height: 40px !important;
  /* Ajusta el valor según lo que necesites */
}
</style>
