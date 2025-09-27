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
          <v-select v-model="selectedPatient" :items="availablePatients" item-value="_id"
            :item-title="item => `${item.lastName}, ${item.firstName}`" :label="t('views.appointments.patients')"
            outlined dense></v-select>
          <v-select v-model="selectedProfessional" :items="availableProfessionals" item-value="_id"
            :item-title="item => `${item.lastName}, ${item.firstName}`" item-disabled="disabled"
            :label="t('views.appointments.professionals')" outlined dense></v-select>
          <v-text-field v-model="form.notes" :label="t('views.appointments.notes')" outlined dense maxlength="500" />

        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="red" variant="tonal" @click="dialog = false">{{ t('common.buttons.close') }}</v-btn>
          <v-btn color="primary" @click="saveAppointment">{{ t('common.buttons.save') }}</v-btn>
        </v-card-actions>
        <Alert :show="alert.show" :type="alert.type" :message="alert.message" />
      </v-card>
    </v-dialog>

    <v-dialog v-model="showEventDialog" max-width="500">
      <v-card>
        <v-card-title>{{ t('views.appointments.details') }}</v-card-title>
        <v-card-text v-if="selectedEvent && selectedEvent.extendedProps">
          <div><strong>{{ t('views.appointments.patient') }}</strong> {{
            `${selectedEvent.extendedProps.patientLastName}, ${selectedEvent.extendedProps.patientFirstName}`
            }}</div>
          <div><strong>{{ t('views.appointments.professional') }}</strong> {{
            `${selectedEvent.extendedProps.professionalLastName}, ${selectedEvent.extendedProps.professionalFirstName}`
            }}</div>
          <div><strong>{{ t('views.appointments.start') }}</strong> {{ formatDate(selectedEvent.start) }}</div>
          <div><strong>{{ t('views.appointments.end') }}</strong> {{ formatDate(selectedEvent.end) }}</div>
          <div class="mt-4">
            <strong>{{ t('views.appointments.notes') }}</strong>
            <v-textarea v-model="editableNotes" outlined dense rows="3" maxlength="500" counter class="mt-2" />
          </div>
        </v-card-text>
        <v-card-text v-else>
          <div>Error loading appointment details</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="red" variant="tonal" @click="cancelAppointment">{{ t('common.buttons.cancel') }}</v-btn>
          <v-btn color="blue" variant="tonal" @click="updateNotes">{{ t('common.buttons.saveNotes') }}</v-btn>
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

const { t } = useI18n()

const props = defineProps({
  calendarLocale: {
    type: String,
    default: 'es'
  }
})

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

const availablePatients = computed(() => {
  if (!form.value.start || !form.value.end) {
    return patients.value.map(pat => ({ ...pat, disabled: false }));
  }

  // Convertir las fechas del formulario a timestamps para comparación más robusta
  const formStart = new Date(form.value.start).getTime();
  const formEnd = new Date(form.value.end).getTime();

  // Filtrar para mostrar solo pacuientes disponibles
  const availablePatients = patients.value.filter(pat => {
    // Buscar conflictos para este pacientes
    const conflicts = appointments.value.filter(appointment => {
      if (appointment.status?.cancelled) return false;
      if (appointment.patientId !== pat._id) return false;

      const appointmentStart = new Date(appointment.startDate).getTime();
      const appointmentEnd = new Date(appointment.endDate).getTime();

      // Detectar solapamiento: nuevo inicio < cita fin Y nuevo fin > cita inicio
      const hasOverlap = formStart < appointmentEnd && formEnd > appointmentStart;

      return hasOverlap;
    });

    const isAvailable = conflicts.length === 0;

    return isAvailable; // Solo devolver profesionales SIN conflictos
  });

  return availablePatients;
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

const cancelAppointmentById = async (id) => {
  try {
    const token = localStorage.getItem('authToken');

    const response = await fetch(`http://localhost:3000/api/appointment/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" ,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: { cancelled: true, timestamp: new Date() }
      }),
    });
     if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(errorData.error || 'Error al cancelar cita');
      error.messageCode = errorData.messageCode || 'INTERNAL_SERVER_ERROR';
      error.details = errorData.details || null;
      throw error;
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error cancelando cita:", error);
    throw error;
  }
};

const handleEventDrop = async (info) => {
  const event = info.event;

  // Log para depuración
  console.log("Evento arrastrado:", event);

  try {

    await cancelAppointmentById(event.id)
    console.log("La cita antigua fue cancela con éxito");

    // Crear nueva cita directamente con fetch API
    const newAppointmentData = {
      startDate: event.start,
      endDate: event.end,
      patientId: event.extendedProps.patientId,
      professionalId: event.extendedProps.professionalId,
      notes: event.extendedProps.notes
    };

    const response = await post('/appointment', newAppointmentData)

        console.log("Reprogramación exitosa", response);

    // Actualizar el ID del evento en el calendario
    event.setProp("id", response.data._id);

    // Refrescar eventos del calendario
    calendarRef.value.getApi().refetchEvents();

    alert.show = true;
    alert.type = 'success';
    alert.messageCode = response.messageCode || 'APPOINTMENT_RESCHEDULED';
    alert.details = null;
    alert.params = {};
    alert.message = t(`messages.success.${response.messageCode || 'APPOINTMENT_RESCHEDULED'}`);

  } catch (error) {
    console.error("Error al reprogramar:", error);
    info.revert();

    alert.show = true;
    alert.type = 'error';
    alert.messageCode = error.messageCode || 'APPOINTMENT_RESCHEDULE_FAILED';
    alert.details = error.details || null;
    alert.params = {};
    alert.message = t(`messages.error.${error.messageCode || 'APPOINTMENT_RESCHEDULE_FAILED'}`);
  }
}

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
      headers: { 'Content-Type': 'application/json' ,
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
  if (!form.value.patientId || !form.value.professionalId) return

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
    selectedPatient.value = null;
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

const updateNotes = async () => {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch(`http://localhost:3000/api/appointment/${selectedEvent.value.id}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' ,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        notes: editableNotes.value,

      }),
    })

      if (response.ok) {
      const result = await response.json();
      
      alert.type = 'success';
      alert.messageCode = result.messageCode || 'APPOINTMENT_NOTES_UPDATED';
      alert.details = null;
      alert.params = {};
      alert.message = t(`messages.success.${result.messageCode || 'APPOINTMENT_NOTES_UPDATED'}`);
      alert.show = true;

      // Actualizar las notas en el evento seleccionado
      selectedEvent.value.setExtendedProp('notes', editableNotes.value)

      // Refrescar eventos del calendario
      calendarRef.value.getApi().refetchEvents()
    } else {
      const errorData = await response.json();
      
      alert.type = 'error';
      alert.messageCode = errorData.messageCode || 'APPOINTMENT_NOTES_UPDATE_FAILED';
      alert.details = errorData.details || null;
      alert.params = {};
      alert.message = t(`messages.error.${errorData.messageCode || 'APPOINTMENT_NOTES_UPDATE_FAILED'}`);
      alert.show = true;
    }
  } catch (error) {
    console.error('Error al actualizar notas:', error);
    
    alert.type = 'error';
    alert.messageCode = 'NETWORK_ERROR';
    alert.details = null;
    alert.params = {};
    alert.message = t('messages.error.NETWORK_ERROR');
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
  editable: true,
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
            notes: event.notes
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
  },
  eventDrop: handleEventDrop,
})

// Ensure appointments are fetched and displayed correctly

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
