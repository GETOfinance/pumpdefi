import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-6 h-6">
        {/* Sun icon for light mode */}
        <Sun 
          className={`absolute inset-0 w-6 h-6 transition-all duration-300 transform ${
            isDark 
              ? 'opacity-0 rotate-90 scale-0' 
              : 'opacity-100 rotate-0 scale-100 text-yellow-500'
          }`}
        />
        
        {/* Moon icon for dark mode */}
        <Moon 
          className={`absolute inset-0 w-6 h-6 transition-all duration-300 transform ${
            isDark 
              ? 'opacity-100 rotate-0 scale-100 text-blue-400' 
              : 'opacity-0 -rotate-90 scale-0'
          }`}
        />
      </div>
    </button>
  )
}

export default ThemeToggle
