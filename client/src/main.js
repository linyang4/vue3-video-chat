import { createApp } from 'vue'
import ElementUI from 'element-plus'
import App from './App.vue'

import 'element-plus/lib/theme-chalk/index.css';

const app = createApp(App)
app.use(ElementUI)

app.mount('#app')