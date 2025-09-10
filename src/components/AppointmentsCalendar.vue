<template>
    <v-container>
        <v-card class="pa-4">
            <FullCalendar :options="calendarOptions" style="max-width: 100%;" />
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
                    <v-text-field v-model="form.notes" label="Notes" outlined dense />

                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn color="red" variant="tonal" @click="dialog = false">Cancelar</v-btn>
                    <v-btn color="primary" @click="saveAppointment">Guardar</v-btn>
                </v-card-actions>

            </v-card>
        </v-dialog>

        <v-dialog v-model="showEventDialog" max-width="500">
            <v-card>
                <v-card-title>Detalles de la cita</v-card-title>
                <v-card-text v-if="selectedEvent">
                    <div><strong>Paciente:</strong> {{ selectedEvent && selectedEvent.extendedProps ?
                        selectedEvent.extendedProps.patientId : '' }}</div>
                    <div><strong>Profesional:</strong> {{ selectedEvent && selectedEvent.extendedProps ?
                        selectedEvent.extendedProps.professionalId : '' }}</div>
                    <div><strong>Inicio:</strong> {{ selectedEvent && selectedEvent.start ? selectedEvent.start : '' }}
                    </div>
                    <div><strong>Fin:</strong> {{ selectedEvent && selectedEvent.end ? selectedEvent.end : '' }}</div>
                    <div><strong>Notas:</strong> {{ selectedEvent && selectedEvent.extendedProps ?
                        selectedEvent.extendedProps.notes : '' }}</div>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn color="red" variant="tonal" @click="cancelAppointment">Cancelar cita</v-btn>
                    <v-btn color="grey" variant="tonal" @click="showEventDialog = false">Cerrar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

    </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'

const patients = ref([])
const professionals = ref([])
const selectedPatient = ref(null)
const selectedProfessional = ref(null)
const selectedEvent = ref(null)
const showEventDialog = ref(false)

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
            const events = data.map(event => ({
                id: event._id,
                start: event.startDate,
                end: event.endDate,

            }));
            successCallback(events);
        } catch (error) {
            failureCallback(error);
        }
    },
    select: (info) => {
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
    eventClick: async (info) => {
        selectedEvent.value = info.event
        showEventDialog.value = true

        // Mostrar confirmación y borrar
        // if (confirm('¿Quieres cancelar esta cita?')) {
        //     await fetch(`http://localhost:3000/api/appointment/${info.event.id}`, {
        //         method: 'PUT'
        //     });
        //     info.event.remove(); // Elimina del calendario
        // }
    },
})

const cancelAppointment = async () => {
    const cancelledEvent = { 
        status: {
            cancelled: true,
            timestamp: new Date()
        }
     }
    await fetch(`http://localhost:3000/api/appointment/${info.event.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cancelledEvent),
    }

}


onMounted(async () => {
    try {
        const patientsRes = await fetch(`http://localhost:3000/api/patients`)
        const professionalsRes = await fetch('http://localhost:3000/api/professionals')

        if (patientsRes.ok) {
            patients.value = await patientsRes.json()
        }
        if (professionalsRes.ok) {
            professionals.value = await professionalsRes.json()
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

    await fetch("http://localhost:3000/api/appointment", {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
    })
    // Resetear formulario
    form.value = { paciente: "", profesional: "", start: null, end: null };

    //  dialog.value = false;

    // Refrescar eventos



}



// Events -> fetch appointments MongoDB
// Professionals -> fetch professionals
// Patients -> fetch patients

</script>

<style scoped></style>