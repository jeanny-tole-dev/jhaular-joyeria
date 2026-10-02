// Botón interactivo de Sol / Luna para alternar Modo Claro y Modo Oscuro

import { useTheme } from '../context/ThemeContext'
import { Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.08 }}
      className={`p-2 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer border ${
        isDark
          ? 'bg-[#18181E] border-[#38332C] text-[#D4AF37] hover:bg-[#25221E] hover:border-[#D4AF37]/50 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
          : 'bg-[#F2ECE1] border-[#E3DCcf] text-[#8C6D1F] hover:bg-[#EAE2D5] hover:border-[#D4AF37] shadow-sm'
      } ${className}`}
      title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
      aria-label={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-[#D4AF37]" />
        ) : (
          <Moon className="w-4 h-4 text-[#8C6D1F]" />
        )}
      </motion.div>
    </motion.button>
  )
}
