import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from './components/ui/toaster.tsx'
import { SidebarProvider } from './components/ui/sidebar.tsx'


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <main>
      <SidebarProvider className='w-full'>
        <App />
        <Toaster />
      </SidebarProvider>
    </main>
  </React.StrictMode>,
)