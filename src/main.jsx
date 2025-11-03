import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import VietnamApp from './VietnamApp.jsx'

// Check URL to determine which app to load
// Use ?country=vietnam for Vietnam, default is Thailand
const urlParams = new URLSearchParams(window.location.search);
const country = urlParams.get('country');

const AppToRender = country === 'vietnam' ? VietnamApp : App;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppToRender />
  </StrictMode>,
)
