import './styles/global.css';
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

// Note: Buffer polyfill is now handled by vite-plugin-node-polyfills
// No need to manually import buffer here

// Create and mount the app
const app = createApp(App)
app.use(router)
app.mount('#app')
