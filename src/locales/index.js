import { createI18n } from 'vue-i18n'
import en from './en.json'
import es from './es.json'

const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  legacy: false,
  globalInjection: true,
  messages: {
    en, 
    es
  },
})

export default i18n