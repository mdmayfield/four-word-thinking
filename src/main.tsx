import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { polyfill } from 'mobile-drag-drop'
import '@mantine/core/styles.css'
import './index.css'
import App from './App.tsx'

polyfill()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider>
      <App />
    </MantineProvider>
  </StrictMode>,
)
