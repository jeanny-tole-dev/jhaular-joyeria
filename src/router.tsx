import { createBrowserRouter } from 'react-router-dom'
import Bienvenida from './pages/Bienvenida/Bienvenida'
import Catalogo from './pages/Catalogo/Catalogo'
import Laboratorio from './pages/Laboratorio/Laboratorio'
import Certificado from './pages/Certificado/Certificado'
import AdminLayout from './pages/Admin/AdminLayout'
import AdminDashboard from './pages/Admin/Dashboard/Dashboard'
import AdminInventario from './pages/Admin/Inventario/Inventario'
import AdminCatalogo from './pages/Admin/Catalogo/Catalogo'
import NuevoProducto from './pages/Admin/Catalogo/NuevoProducto'
import AdminVentas from './pages/Admin/Ventas/Ventas'
import AdminProduccion from './pages/Admin/Produccion/Produccion'
import AdminGastos from './pages/Admin/Gastos/Gastos'
import AdminProyeccion from './pages/Admin/Proyeccion/Proyeccion'
import AdminContabilidad from './pages/Admin/Contabilidad/Contabilidad'
import AdminConfiguracion from './pages/Admin/Configuracion/Configuracion'
import AdminCertificados from './pages/Admin/Certificados/AdminCertificados'
import AdminQrWhatsapp from './pages/Admin/QrWhatsapp/QrWhatsapp'
import QrRedirect from './pages/QrRedirect/QrRedirect'
import AdminLogin from './pages/Admin/Login'
import ProtectedRoute from './components/ProtectedRoute'

export const router = createBrowserRouter([
  { path: '/', element: <Bienvenida /> },
  { path: '/catalogo', element: <Catalogo /> },
  { path: '/laboratorio', element: <Laboratorio /> },
  { path: '/certificados', element: <Certificado /> },
  { path: '/autenticidad', element: <Certificado /> },
  { path: '/qr', element: <QrRedirect /> },
  { path: '/admin/login', element: <AdminLogin /> },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'inventario', element: <AdminInventario /> },
      { path: 'catalogo', element: <AdminCatalogo /> },
      { path: 'catalogo/nuevo', element: <NuevoProducto /> },
      { path: 'catalogo/editar/:id', element: <NuevoProducto /> },
      { path: 'ventas', element: <AdminVentas /> },
      { path: 'produccion', element: <AdminProduccion /> },
      { path: 'gastos', element: <AdminGastos /> },
      { path: 'proyeccion', element: <AdminProyeccion /> },
      { path: 'contabilidad', element: <AdminContabilidad /> },
      { path: 'certificados', element: <AdminCertificados /> },
      { path: 'qr-whatsapp', element: <AdminQrWhatsapp /> },
      { path: 'configuracion', element: <AdminConfiguracion /> },
    ],
  },
])
