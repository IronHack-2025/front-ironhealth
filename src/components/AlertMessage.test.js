import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import AlertMessage from '../components/AlertMessage.vue'

// Mock básico de vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key // simplemente devuelve la clave
  })
}))

describe('AlertMessage.vue', () => {
  it('muestra un mensaje simple de éxito', () => {
    const wrapper = mount(AlertMessage, {
      props: {
        show: true,
        type: 'success',
        message: 'Paciente creado con éxito'
      }
    })

    expect(wrapper.text()).toContain('Paciente creado con éxito')
    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('muestra una lista de errores de validación', () => {
    const wrapper = mount(AlertMessage, {
      props: {
        show: true,
        type: 'error',
        messageCode: 'VALIDATION_FAILED',
        details: [
          { field: 'email', code: 'INVALID_EMAIL' },
          { field: 'birthDate', code: 'INVALID_DATE' }
        ]
      }
    })

    // Comprueba que hay una lista con los mensajes
    const items = wrapper.findAll('li')
    expect(items.length).toBe(2)

    // Se muestran los códigos de error
    expect(wrapper.text()).toContain('INVALID_EMAIL')
    expect(wrapper.text()).toContain('INVALID_DATE')
  })
})
