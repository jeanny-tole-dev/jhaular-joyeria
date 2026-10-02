// Página de Inicio (Landing Page) — Presentación de Marca & Hero Jhaular con Soporte Light / Dark

import { Link } from 'react-router-dom'
import ThemeToggle from '../../components/ThemeToggle'

const CornerBrackets = () => (
  <>
    <span className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-secondary" />
    <span className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-secondary" />
    <span className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-secondary" />
    <span className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-secondary" />
  </>
)

const Foto = ({
  src,
  alt,
  tag,
  titulo,
  className = '',
}: {
  src: string
  alt: string
  tag?: string
  titulo?: string
  className?: string
}) => (
  <div className={`group relative rounded-2xl overflow-hidden bg-[#F4EFE6] dark:bg-surface-container-low shadow-sm ${className}`}>
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
    <CornerBrackets />
    {tag && <span className="tag-pill absolute top-4 left-4 rounded-full shadow-sm">{tag}</span>}
    {titulo && (
      <p className="absolute bottom-4 left-4 font-display italic text-headline-md text-white">
        {titulo}
      </p>
    )}
  </div>
)

export default function Bienvenida() {

  return (
    <main className="bg-[#FDFBF7] dark:bg-background text-[#1F1C18] dark:text-on-background min-h-screen transition-colors duration-300">
      {/* 1. NAVBAR SUPERIOR */}
      <nav className="sticky top-0 z-30 flex items-center justify-between px-margin-mobile md:px-margin-desktop py-4 border-b border-[#EAE5DC] dark:border-outline-variant/40 bg-[#FDFBF7]/90 dark:bg-surface/80 backdrop-blur-md transition-colors duration-300">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Jhaular" className="h-9 w-9 object-contain" />
          <p className="font-display text-headline-md tracking-wide text-[#1F1C18] dark:text-champan">Jhaular</p>
        </Link>
        
        <div className="hidden md:flex gap-10 label-caps text-[#736E65] dark:text-on-surface-variant">
          <Link to="/" className="text-secondary font-bold">Inicio</Link>
          <Link to="/catalogo" className="hover:text-secondary transition-colors">Catálogo</Link>
          <Link to="/laboratorio" className="hover:text-secondary transition-colors">Personalizar</Link>
          <Link to="/certificados" className="hover:text-secondary transition-colors">Autenticidad</Link>
        </div>

        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <Link
            to="/laboratorio"
            className="bg-secondary text-on-secondary px-5 py-2.5 label-caps rounded-full hover:bg-tertiary hover:text-on-tertiary transition-colors shadow-sm"
          >
            Diseña tu Manilla
          </Link>
        </div>
      </nav>

      {/* 2. HERO PRINCIPAL — FOTOGRAFÍA 100% LIMPIA DE BORDE A BORDE */}
      <section className="relative min-h-[92vh] flex flex-col justify-end px-margin-mobile md:px-margin-desktop pb-20 overflow-hidden">
        {/* Fotografía de fondo 100% pura y nítida, sin velos ni filtros */}
        <img
          src="/hero-montana.jpeg"
          alt="Hero Jhaular"
          className="absolute inset-0 w-full h-full object-cover object-right sm:object-center"
        />

        {/* Contenido de Texto con Drop-Shadow para Máxima Legibilidad sobre la Fotografía */}
        <div className="relative z-10 max-w-2xl">
          <p className="label-caps text-[#D4AF37] mb-5 flex items-center gap-3 font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            <span className="w-8 h-px bg-[#D4AF37] inline-block shadow-sm" />
            Imponiendo Legado
          </p>
          
          <h1 className="font-display italic uppercase text-headline-lg-mobile md:text-display-lg mb-6 max-w-3xl leading-[1.02] text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
            Nacidos en la
            <br />
            Fuerza del Nudo
          </h1>
          
          <p className="font-body text-body-lg text-[#F0EBE1] max-w-xl mb-10 font-medium drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
            Artesanía técnica diseñada para exigir. Cada pieza Jhaular es un
            testimonio de resistencia y herencia ancestral.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/catalogo"
              className="bg-secondary text-black font-bold px-8 py-4 label-caps text-center rounded-full hover:bg-tertiary hover:text-white transition-colors shadow-2xl"
            >
              Comprar Ahora
            </Link>
            <Link
              to="/laboratorio"
              className="border border-white/70 text-white px-8 py-4 label-caps text-center rounded-full hover:border-secondary hover:text-secondary transition-colors backdrop-blur-md bg-black/40 hover:bg-black/60 font-semibold shadow-lg"
            >
              Configurar Pieza
            </Link>
          </div>
        </div>
      </section>

      {/* 3. EL LEGADO — la mente detrás del diseño */}
      <section id="historia" className="bg-[#F5EFE6] dark:bg-primary-container px-margin-mobile md:px-margin-desktop py-24 transition-colors duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <Foto src="/vista.jpeg" alt="Diseñando cada pieza Jhaular" tag="Diseño & Origen" className="aspect-[4/5] max-h-[500px] w-full order-2 md:order-1" />
          <div className="order-1 md:order-2">
            <p className="label-caps text-secondary mb-4">Nuestra Esencia</p>
            <h2 className="font-display text-headline-md mb-6 text-[#1F1C18] dark:text-white">El Legado de la Mano y el Tiempo</h2>
            <p className="text-body-md text-[#5A544B] dark:text-on-surface-variant mb-4">
              Jhaular nace de la obsesión por el detalle y la búsqueda
              incansable de la perfección técnica. No solo hacemos joyas,
              esculpimos intenciones.
            </p>
            <p className="text-body-md text-[#5A544B] dark:text-on-surface-variant mb-6">
              Cada nudo es ejecutado con la precisión de un relojero: hilos
              técnicos alemanes, oro de 24 quilates y esmeraldas de origen
              ético colombiano.
            </p>
            <Link to="/catalogo" className="label-caps text-secondary underline underline-offset-4">
              Explorar Creaciones →
            </Link>
          </div>
        </div>
      </section>

      {/* 4. RESISTENCIA QUE TRASCIENDE */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        <div className="relative min-h-[420px]">
          <img src="/caballo.jpeg" alt="Fuerza y trabajo real" className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div className="bg-[#14261C] dark:bg-musgo px-margin-mobile md:px-margin-desktop py-16 md:py-0 flex flex-col justify-center">
          <p className="label-caps text-[#85E3B3] mb-4">Ingeniería del Legado</p>
          <h2 className="font-display text-headline-md mb-6 text-white">Resistencia que Trasciende</h2>
          <p className="text-body-md text-[#D8EADB] dark:text-on-surface-variant mb-8 max-w-md">
            Combinamos hilos de alta tenacidad con componentes de macramé y
            oro de 18K. No hay pieza de identidad más resiliente que la
            nuestra.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <p className="label-caps text-[#D8EADB] dark:text-on-surface-variant">Sumado a la aventura</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <p className="label-caps text-[#D8EADB] dark:text-on-surface-variant">Artesanía de precisión</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MATERIALES DE LEGADO */}
      <section className="bg-white dark:bg-corteza px-margin-mobile md:px-margin-desktop py-24 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="label-caps text-secondary mb-3">Selección Técnica</p>
              <h2 className="font-display text-headline-md text-[#1F1C18] dark:text-white">Materiales de Legado</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { src: '/textura-hilo.jpeg', tag: 'Fibra', nombre: 'Hilo Encerado' },
              { src: '/textura-oro.jpeg', tag: 'Metal', nombre: 'Oro 18K Certificado' },
              { src: '/textura-esmeralda.jpeg', tag: 'Gema', nombre: 'Esmeralda Natural' },
            ].map((m) => (
              <div key={m.nombre}>
                <div className="group relative aspect-square rounded-xl overflow-hidden mb-3 shadow-md bg-[#F4EFE6] dark:bg-black/40">
                  <img
                    src={m.src}
                    alt={m.nombre}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                </div>
                <p className="label-caps text-secondary text-[10px] mb-1">{m.tag}</p>
                <p className="font-body text-sm font-semibold text-[#1F1C18] dark:text-white">{m.nombre}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. COLECCIONES CURADAS */}
      <section className="bg-[#FDFBF7] dark:bg-surface px-margin-mobile md:px-margin-desktop py-24 transition-colors duration-300">
        <h2 className="font-display italic text-headline-md text-center mb-12 text-[#1F1C18] dark:text-white">Colecciones Curadas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          <Foto src="/cortesadorada.jpeg" alt="Colección Dorada" tag="Oro Líquido" titulo="Dorada" className="aspect-[3/4]" />
          <Foto src="/aventura-bosque.jpeg" alt="Colección Tradicional" tag="Herencia" titulo="Tradicional" className="aspect-[3/4]" />
          <Foto src="/moto2.jpeg" alt="Colección Aventura" tag="Espíritu Explorador" titulo="Aventura" className="aspect-[3/4]" />
        </div>
      </section>

      {/* 7. CTA LABORATORIO */}
      <section className="bg-[#F5EFE6] dark:bg-primary-container px-margin-mobile md:px-margin-desktop py-24 transition-colors duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <Foto src="/coleccion-aventura.jpeg" alt="Colección completa Jhaular" tag="Nuestra Firma" className="aspect-square w-full" />
          <div>
            <p className="label-caps text-secondary mb-4">Tú Eres el Autor</p>
            <h2 className="font-display text-headline-md mb-6 text-[#1F1C18] dark:text-white">Laboratorio de Diseño Jhaular</h2>
            <p className="text-body-md text-[#5A544B] dark:text-on-surface-variant mb-8">
              Elige el tipo de tejido, el color del hilo, los dijes y las
              piedras preciosas. Visualización en tiempo real.
            </p>
            <Link to="/laboratorio" className="bg-secondary text-on-secondary px-8 py-4 label-caps inline-block rounded-full hover:bg-tertiary hover:text-on-tertiary transition-colors shadow-md">
              Entrar al Laboratorio ⚡
            </Link>
          </div>
        </div>
      </section>

      {/* 8. VALORES */}
      <section className="bg-white dark:bg-surface-container-lowest px-margin-mobile md:px-margin-desktop py-20 transition-colors duration-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto text-center">
          {[
            { titulo: 'Fuerza', desc: 'Diseñadas para resistir las condiciones más extremas sin perder su elegancia.' },
            { titulo: 'Aventura', desc: 'Un recordatorio constante de tu espíritu explorador en cada expedición.' },
            { titulo: 'Exclusividad', desc: 'Producción limitada. Cada nudo es una firma única de nuestro atelier.' },
          ].map((v) => (
            <div key={v.titulo}>
              <p className="font-display text-headline-md mb-3 text-[#1F1C18] dark:text-white">{v.titulo}</p>
              <p className="text-body-md text-[#5A544B] dark:text-on-surface-variant">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-[#F4EFE6] dark:bg-surface-container-lowest border-t border-[#EAE5DC] dark:border-outline-variant px-margin-mobile md:px-margin-desktop py-16 transition-colors duration-300">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 max-w-6xl mx-auto">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img src="/logo.png" alt="Jhaular" className="h-8 w-8 object-contain" />
              <p className="font-display text-headline-md text-[#1F1C18] dark:text-white">Jhaular</p>
            </div>
            <p className="text-body-md text-[#5A544B] dark:text-on-surface-variant">
              Elevando el arte del macramé a una experiencia de lujo contemporáneo.
            </p>
          </div>
          <div>
            <p className="label-caps text-secondary mb-4">Explorar</p>
            <ul className="space-y-2 text-body-md text-[#5A544B] dark:text-on-surface-variant">
              <li><Link to="/catalogo" className="hover:text-secondary">Catálogo de Joyas</Link></li>
              <li><Link to="/laboratorio" className="hover:text-secondary">Diseño Personalizado</Link></li>
            </ul>
          </div>
          <div>
            <p className="label-caps text-secondary mb-4">Información</p>
            <ul className="space-y-2 text-body-md text-[#5A544B] dark:text-on-surface-variant">
              <li>Sostenibilidad</li>
              <li>Cuidado de Piezas</li>
            </ul>
          </div>
          <div>
            <p className="label-caps text-secondary mb-4">Atelier</p>
            <p className="text-body-md text-[#5A544B] dark:text-on-surface-variant">Síguenos para lanzamientos exclusivos.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}