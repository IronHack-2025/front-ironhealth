import { config } from '@vue/test-utils'

// 🔧 Evita errores con componentes de Vuetify o traducciones
config.global.stubs = {
  'v-btn': true,
  'v-container': true,
  'v-row': true,
  'v-col': true,
  'v-icon': true,
}

