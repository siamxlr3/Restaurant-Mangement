import AppRoutes from './routes/AppRoutes'
import { Toaster } from 'sonner'
import { useRealtimeSync } from './hooks/useRealtimeSync'

export default function App() {
  useRealtimeSync()

  return (
    <>
      <Toaster position="top-right" richColors />
      <AppRoutes />
    </>
  )
}
