<template>
    <v-divider class="mb-2" />
    <v-row class="mb-2">
        <v-col cols="12" sm="4" class="d-flex align-center">
            <v-icon v-if="icon" :icon="icon" class="me-2" color="primary" size="small" />
            <span class="text-body-1 font-weight-medium text-grey-darken-1">
                {{ label }}:
            </span>
        </v-col>
        
        <v-col cols="12" sm="8" class="d-flex align-center">
            <span v-if="value" class="text-body-1">
                {{ displayValue }}
            </span>
            <span v-else class="text-body-2 text-grey font-italic">
                Non specified
            </span>
        </v-col>
    </v-row>
    

</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    label: { type: String, required: true },
    value: { type: [String, Number, Date], default: '' },
    // Icono opcional
    icon: { type: String, default: '' },
    iconColor: { type: String, default: 'primary' },
})

const displayValue = computed(() => {
    if (!props.value) return ''

    // Si es fecha, formatear
    if (props.value instanceof Date) {
        return props.value.toLocaleDateString('es-ES')
    }

    return props.value.toString()
})
</script>
