<template>
    <v-container>
        <v-card class="pa-4">
            <FullCalendar ref="calendarRef" :options="calendarOptions" style="max-width: 100%;" />
        </v-card>
        <v-dialog v-model="dialog" max-width="500">
            <v-card>
                <v-card-title>📅 New appointment</v-card-title>
                <v-card-text>
                    <v-text-field v-model="form.patientId" label="Patient" outlined dense required />

                    <v-text-field v-model="form.professionalId" label="Professional" outlined dense required />

                    <v-select v-model="selectedPatient" :items="patients" item-value="_id"
                        :item-title="item => `${item.lastName}, ${item.firstName}`" label="Patients" outlined
                        dense></v-select>
                    <v-select v-model="selectedProfessional" :items="professionals" item-value="_id"
                        :item-title="item => `${item.lastName}, ${item.firstName}`" label="Professionals" outlined
                        dense></v-select>
                    <v-text-field v-model="form.notes" label="Notes" outlined dense maxlength="500" />

                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn color="red" variant="tonal" @click="dialog = false">Close</v-btn>
                    <v-btn color="primary" @click="saveAppointment">Save</v-btn>
                </v-card-actions>
                <Alert :show="alert.show" :type="alert.type" :message="alert.message" />
            </v-card>
        </v-dialog>

        <v-dialog v-model="showEventDialog" max-width="500">
            <v-card>
                <v-card-title>Appointment details</v-card-title>
                <v-card-text v-if="selectedEvent">
                    <div><strong>Patient:</strong> {{ selectedEvent && selectedEvent.extendedProps ?
                        `${selectedEvent.extendedProps.patientLastName},
                        ${selectedEvent.extendedProps.patientFirstName}` : '' }}</div>
                    <div><strong>Professional:</strong> {{ selectedEvent && selectedEvent.extendedProps ?
                        `${selectedEvent.extendedProps.professionalLastName},
                        ${selectedEvent.extendedProps.professionalFirstName}` : '' }}</div>
                    <div><strong>Start time:</strong> {{ selectedEvent && selectedEvent.start ?
                        formatDate(selectedEvent.start) : '' }}</div>
                    <div><strong>End time:</strong> {{ selectedEvent && selectedEvent.end ?
                        formatDate(selectedEvent.end) : '' }}</div>
                    <div><strong>Notes:</strong> {{ selectedEvent && selectedEvent.extendedProps ?
                        selectedEvent.extendedProps.notes : '' }}</div>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn color="red" variant="tonal" @click="cancelAppointment">Cancelar cita</v-btn>
                    <v-btn color="primary" variant="tonal" @click="showEventDialog = false">Cerrar</v-btn>
                </v-card-actions>
                <Alert :show="alert.show" :type="alert.type" :message="alert.message" />
            </v-card>
        </v-dialog>

    </v-container>
</template>

<script setup>
import { ref, onMounted, watch, reactive } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import Alert from './AlertMessage.vue'

const patients = ref([])
const professionals = ref([])
const selectedPatient = ref(null)
const selectedProfessional = ref(null)
const selectedEvent = ref(null)
const showEventDialog = ref(false)
const calendarRef = ref(null)

const alert = reactive({
    show: false,
    message: '',
    type: 'success',
})
// Sincroniza la selección del v-select con el formulario
watch(selectedPatient, (newVal) => {
    form.value.patientId = newVal
})
watch(selectedProfessional, (newVal) => {
    form.value.professionalId = newVal
})

const dialog = ref(false)

const form = ref({
    patientId: "",
    professionalId: "",
    start: null,
    end: null,
    notes: ""
})

const cancelAppointmentById = async (id) => {
    try {
        const response = await fetch(`http://localhost:3000/api/appointment/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                status: { cancelled: true, timestamp: new Date() }
            }),
        });
        if (!response.ok) throw new Error("Error al cancelar cita");
    } catch (error) {
        console.error("Error cancelando cita:", error);
        throw error;
    }
};

const handleEventDrop = async (info) => {
    const oldEvent = info.oldEvent
    const newEvent = info.event

    const originalStart = oldEvent.start;
    const originalEnd = oldEvent.end;


    try {

        info.event.setStart(newEvent.start);
        info.event.setEnd(newEvent.end);

        await cancelAppointmentById(oldEvent.id)

        const newAppointment = await saveAppointment({
            title: `Cita con ${newEvent.professionalId}`,
            startDate: newEvent.start,
            endDate: newEvent.end,
            patientId: newEvent.extendedProps.patientId,
            professionalId: newEvent.extendedProps.professionalId,
            notes: newEvent.extendedProps.notes
        })

        console.log("Reprogramación exitosa");

    } catch (error) {
        console.error("Error al reprogramar:", error);
        info.event.setStart(originalStart);
        info.event.setEnd(originalEnd);
        info.revert();
    }
}
const calendarOptions = ref({
    plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin],
    initialView: 'timeGridWeek',
    selectable: true,
    editable: true,
    selectMirror: true,
    events: async (fetchInfo, successCallback, failureCallback) => {
        try {
            const res = await fetch("http://localhost:3000/api/appointment");
            const data = await res.json();
            // Transforma los datos al formato que FullCalendar espera
            const filtered = data.filter(ev => !ev.status.cancelled)
            const events = filtered.map(event => {
                const patient = patients.value.find(p => p._id === event.patientId) || {};
                const professional = professionals.value.find(p => p._id === event.professionalId) || {};
                return {
                    id: event._id,
                    start: event.startDate,
                    end: event.endDate,
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
    select: (info) => {
        resetAlert()
        form.value.start = info.startStr
        form.value.end = info.endStr
        dialog.value = true;
    },
    firstDay: 1,
    headerToolbar: {
        left: 'prev,today,next',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
    },
    slotMinTime: '08:00:00',
    slotMaxTime: '20:00:00',
    eventClick: async (info) => {
        resetAlert()
        selectedEvent.value = info.event
        showEventDialog.value = true
    },
    eventDrop: handleEventDrop,
})
// Función para resetear la alerta
const resetAlert = () => {
    alert.show = false
    alert.message = ''
    alert.type = 'success'
}

const cancelAppointment = async () => {
    try {
        const response = await fetch(`http://localhost:3000/api/appointment/${selectedEvent.value.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: {
                    cancelled: true,
                    timestamp: new Date()
                }
            }),
        })

        if (response.status === 200) {
            alert.type = 'success'
            alert.message = 'La cita se ha cancelado correctamente.'
            alert.show = true

        } else {
            const errorData = await response.json()
            alert.type = 'error'
            alert.message = errorData.error || 'Se ha producido un error.'
            alert.show = true
        }
    } catch (error) { // Añadir parámetro error
        console.error('Error de conexión al cancelar la cita:', error);
        alert.type = 'error'
        alert.message = 'Error de conexión al cancelar la cita'
        alert.show = true
    }

    calendarRef.value.getApi().refetchEvents();

}

// const updateAppointment = async (id, payload) => {
//     try {
//         const response = await fetch(`http://localhost:3000/api/appointment/${id}`, {
//             method: "PUT",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(payload)
//         });
//         console.log(`Cita con id ${id} actualizada correctamente`)
//         if (response.status === 200) {
//             alert.type = 'success'
//             alert.message = 'La cita se ha reprogramado correctamente.'
//             alert.show = true

//         } else {
//             const errorData = await response.json()
//             alert.type = 'error'
//             alert.message = errorData.error || 'Se ha producido un error.'
//             alert.show = true
//         }
//     } catch (error) {
//         console.error(`Error al actualizar la cita, ${error}`)
//         alert.type = 'error'
//         alert.message = 'Error de conexión al reprogramar la cita'
//         alert.show = true
//         throw error
//     }
// }

const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    // Día y hora (ejemplo: "lun, 10:30")
    const options = { weekday: 'short', hour: '2-digit', minute: '2-digit' };
    return d.toLocaleString('es-ES', options);
};


onMounted(async () => {
    try {
        const patientsRes = await fetch(`http://localhost:3000/api/patients`)
        if (patientsRes.ok) {
            patients.value = await patientsRes.json()
        }
        const professionalsRes = await fetch('http://localhost:3000/api/professionals')
        if (professionalsRes.ok) {
            professionals.value = await professionalsRes.json()
        }
        // Refresca eventos del calendario solo después de cargar ambos arrays
        if (calendarRef.value) {
            calendarRef.value.getApi().refetchEvents();
        }
    } catch (error) {
        console.error({ message: 'error fetching data' }, error)
    }
})

const saveAppointment = async () => {
    if (!form.value.patientId || !form.value.professionalId) return

    const newEvent = {
        title: `Cita con ${form.value.professionalId}`,
        startDate: form.value.start,
        endDate: form.value.end,
        patientId: form.value.patientId,
        professionalId: form.value.professionalId,
        notes: form.value.notes
    }
    try {
        const response =
            await fetch("http://localhost:3000/api/appointment", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newEvent)
            })
        console.log(newEvent)

        if (response.status === 201) {
            alert.type = 'success'
            alert.message = 'La cita se ha guardado correctamente.'
            alert.show = true
        } else {
            const errorData = await response.json()
            alert.type = 'error'
            alert.message = errorData.error || 'Se ha producido un error.'
            alert.show = true
        }
    } catch (error) {
        console.error('Error de conexión:', error.message)
        alert.type = 'error'
        alert.message = 'Error de conexión: ' + error.message
        alert.show = true
    }

    // Resetear formulario
    form.value = { selectedPatient: "", selectedProfessional: "", start: null, end: null };
    selectedPatient.value = null;
    selectedProfessional.value = null;
    //  dialog.value = false;

    // Refrescar eventos
    calendarRef.value.getApi().refetchEvents();


}


</script>

<style scoped></style>