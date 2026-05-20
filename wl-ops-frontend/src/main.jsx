import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          borderRadius: '16px',
          fontFamily: '"Google Sans", "Inter", sans-serif',
          fontSize: '14px',
        },
        duration: 3500,
      }}
      richColors
    />
  </React.StrictMode>,
)
