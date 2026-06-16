import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0d1520',
              color: '#e8f0fe',
              border: '1px solid #1a2d45',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#00c896', secondary: '#0d1520' } },
            error: { iconTheme: { primary: '#ff4757', secondary: '#0d1520' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)