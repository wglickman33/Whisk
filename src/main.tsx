import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/main.scss'
import { bootstrapAuthSession } from './store/authStore'
import App from './App.tsx'

bootstrapAuthSession()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
