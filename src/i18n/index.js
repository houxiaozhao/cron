import { createI18n } from 'vue-i18n'
import enUS from './en-US'
import zhCN from './zh-CN'

const messages = {
  'en-US': enUS,
  'zh-CN': zhCN
}

export default createI18n({
  locale: localStorage.getItem('language') || 'zh-CN',
  fallbackLocale: 'en-US',
  messages,
  legacy: false
})
