import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import VietnamApp from './VietnamApp.jsx'

// Default to Vietnam app (Thailand removed)
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <VietnamApp />
  </StrictMode>,
)
