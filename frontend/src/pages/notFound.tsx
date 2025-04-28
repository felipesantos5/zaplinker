import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export default function NotFound() {
  return (
    <div className="flex w-full min-h-screen flex-col items-center justify-center bg-white dark:bg-black p-4">
      <div className="relative">
        {/* Abstract geometric elements */}
        <div className="absolute -left-16 -top-16 h-32 w-32 opacity-10 text-black dark:text-white">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
            <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="0.5" />
            <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="absolute -bottom-16 -right-16 h-32 w-32 opacity-10 text-black dark:text-white">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" strokeWidth="1" />
            <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="0.5" />
            <line x1="80" y1="20" x2="20" y2="80" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        {/* Main 404 display */}
        <h1 className="mb-2 text-9xl font-thin tracking-tighter text-gray-900 dark:text-gray-100">404</h1>

        {/* Error message */}
        <h2 className="mb-6 text-2xl font-light text-gray-800 dark:text-gray-200">Pagina não encontrada</h2>
        <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">
          A página que você está procurando não existe ou foi movida
        </p>

        {/* Return to homepage button */}
        <Button
          asChild
          variant="secondary"
          className="group relative border-gray-300 bg-white text-gray-900 transition-all hover:bg-gray-50"
        >
          <Link to="/">Retornar para o início</Link>
        </Button>
      </div>

      {/* Background grid pattern */}
      <div className="pointer-events-none fixed inset-0 z-0 grid grid-cols-6 opacity-[0.02] md:grid-cols-12">
        {Array(12)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="border-[0.5px] border-black dark:border-white"></div>
          ))}
      </div>
    </div>
  )
}
