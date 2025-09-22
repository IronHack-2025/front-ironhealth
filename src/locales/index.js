import { createI18n } from 'vue-i18n'
import en from './en.json'
import es from './es.json'

// Lista de idiomas soportados en la app
const SUPPORTED = ['en', 'es']

function detectLocale () {
  // 1) Preferencia del usuario si existe
  const saved = localStorage.getItem('lang')
  if (saved && SUPPORTED.includes(saved)) return saved

  // 2) Idioma del navegador (languages > language)
  const nav = (navigator.languages && navigator.languages.length)
    ? navigator.languages
    : [navigator.language]

  // Normalizamos: 'es-ES' -> 'es'
  const firstMatch = nav
    .map(l => (typeof l === 'string' ? l.slice(0, 2) : ''))
    .find(code => SUPPORTED.includes(code))

  // 3) Fallback
  return firstMatch || 'en'
}

const i18n = createI18n({
  // Usamos el detector en vez de 'en' fijo
  locale: detectLocale(),
  fallbackLocale: 'en',
  legacy: false,
  globalInjection: true,
  messages: {
    en,
    es
  }
})

export default i18n
