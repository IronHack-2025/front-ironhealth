<template>
    <v-container>
        <v-card class="pa-4">
            <FullCalendar :options="calendarOptions" style="max-width: 100%;" />
        </v-card>
        <v-dialog v-model="dialog" max-width="500">
            <v-card>
                <v-card-title>📅 Nueva Cita</v-card-title>
                <v-card-text>
                    <v-text-field v-model="form.patientId" label="Paciente" outlined dense required />

                    <v-text-field v-model="form.professionalId" label="Profesional" outlined dense required />

                            <v-select
                                v-model="selectedPatient"
                                :items="patients"
                                item-value="_id"
                                :item-title="item => `${item.lastName}, ${item.firstName}`"
                                label="Paciente"
                                outlined
                                dense
                            ></v-select>
                            <v-select
                                v-model="selectedProfessional"
                                :items="professionals"
                                item-value="_id"
                                :item-title="item => `${item.lastName}, ${item.firstName}`"
                                label="Profesional"
                                outlined
                                dense
                            ></v-select>
                      
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn color="red" variant="tonal" @click="dialog = false">Cancelar</v-btn>
                    <v-btn color="primary" @click="saveAppointment">Guardar</v-btn>
                </v-card-actions>
                
            </v-card>
        </v-dialog>

    </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
const patients = ref([])
const professionals = ref([])
const selectedPatient = ('')
const selectedProfessional = ('')

const dialog = ref(false)

const form = ref({
    patientId: "",
    professionalId: "",
    start: null,
    end: null,
})

const calendarOptions = ref({
    plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
    initialView: 'timeGridWeek',
    selectable: true,
    editable: true,
    selectMirror: true,
    events: "http://localhost:3000/api/appointment",
    select: (info) => {
        form.value.start = info.startStr
        form.value.end = info.endStr
        dialog.value = true;
    },
    firstDay: 1,
    headerToolbar: {
        left: 'prev,today,next',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
    }
})


onMounted( async () => {
    try {
        const patientsRes = await fetch(`http://localhost:3000/api/patients`)
        const professionalsRes = await fetch('http://localhost:3000/api/professionals')

        if (patientsRes.ok){
            patients.value = await patientsRes.json()
        }
        if (professionalsRes.ok){
            professionals.value = await professionalsRes.json()
        }

    } catch (error) {
        console.error({ message: 'error fetching data'}, error)
    }
})

const saveAppointment = async () => {
    if(!form.value.patientId || !form.value.professionalId) return

    const newEvent = {
        title: `Cita con ${form.value.professionalId}`,
        startDate: form.value.start,
        endDate: form.value.end,
        patientId: form.value.patientId,
        professionalId: form.value.professionalId,
    }

    await fetch("http://localhost:3000/api/appointment", {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newEvent),
})}



// Events -> fetch appointments MongoDB
// Professionals -> fetch professionals
// Patients -> fetch patients

</script>

<style scoped></style>