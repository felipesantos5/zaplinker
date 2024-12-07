import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { Toaster } from './components/ui/toaster.tsx'
import { SidebarProvider } from './components/ui/sidebar.tsx'
import AppRouter from './routes/index.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <SidebarProvider className='w-full'>
        <AppRouter />
        <Toaster />
      </SidebarProvider>
    </ThemeProvider>
  </React.StrictMode>,
)