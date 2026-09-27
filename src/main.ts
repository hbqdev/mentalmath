import '@fontsource/alegreya-sans/500.css'
import '@fontsource/alegreya-sans/700.css'
import '@fontsource-variable/source-serif-4'
import '@fontsource-variable/jetbrains-mono'
import './app/styles/tokens.css'
import './app/styles/base.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
