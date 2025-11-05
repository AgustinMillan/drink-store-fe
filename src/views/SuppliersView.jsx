import { useState, useEffect } from 'react'
import AddSupplierModal from '../components/AddSupplierModal'
import EditSupplierModal from '../components/EditSupplierModal'
import BestPricesModal from '../components/BestPricesModal'
import { supplierApi, productApi } from '../services/api'
import './SuppliersView.css'

function SuppliersView() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [bestPriceLoading, setBestPriceLoading] = useState(false)
  const [isBestPricesModalOpen, setIsBestPricesModalOpen] = useState(false)
  const [bestPricesData, setBestPricesData] = useState([])

  // Debug: verificar cuando cambia el estado del modal
  useEffect(() => {
    console.log('Estado del modal cambió - isBestPricesModalOpen:', isBestPricesModalOpen, 'bestPricesData:', bestPricesData)
  }, [isBestPricesModalOpen, bestPricesData])

  // Cargar proveedores del backend
  const fetchSuppliers = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await supplierApi.getAll()
      if (result.success) {
        setSuppliers(result.data || [])
      } else {
        setError(result.error || 'Error al cargar los proveedores')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
      console.error('Error fetching suppliers:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const handleAddSupplier = () => {
    setIsAddModalOpen(true)
  }

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false)
  }

  const handleAddModalSuccess = () => {
    fetchSuppliers()
  }

  const handleSupplierClick = (supplier) => {
    setSelectedSupplier(supplier)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedSupplier(null)
  }

  const handleEditModalSuccess = () => {
    fetchSuppliers()
  }

  const handleDeleteSuccess = () => {
    fetchSuppliers()
  }

  const handleGetBestPrices = async () => {
    setBestPriceLoading(true)
    try {
      const result = await productApi.getBestPrice()
      console.log('Resultado de getBestPrice:', result)
      if (result && result.success) {
        console.log('Datos recibidos:', result.data)
        setBestPricesData(result.data || [])
        setIsBestPricesModalOpen(true)
        console.log('Modal debería abrirse, isBestPricesModalOpen:', true)
      } else {
        alert(result?.error || 'Error al obtener los mejores precios')
        console.error('Error en resultado:', result)
      }
    } catch (error) {
      alert('Error de conexión al obtener mejores precios')
      console.error('Error getting best prices:', error)
    } finally {
      setBestPriceLoading(false)
    }
  }

  const handleCloseBestPricesModal = () => {
    setIsBestPricesModalOpen(false)
    setBestPricesData([])
  }

  return (
    <div className="suppliers-view">
      {/* Encabezados de tabla */}
      <div className="table-header">
        <div className="header-cell">ID</div>
        <div className="header-cell">NOMBRE</div>
        <div className="header-cell">CONTACTO</div>
        <div className="header-cell">TELEFONO</div>
        <div className="header-cell">EMAIL</div>
      </div>

      {/* Lista de proveedores */}
      <div className="suppliers-list">
        {loading ? (
          <div className="loading-message">Cargando proveedores...</div>
        ) : error ? (
          <div className="error-message">
            {error}
            <button onClick={fetchSuppliers} className="retry-button">
              Reintentar
            </button>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="empty-message">No hay proveedores registrados</div>
        ) : (
          suppliers.map((supplier) => (
            <div 
              key={supplier.Id} 
              className="supplier-row clickable"
              onClick={() => handleSupplierClick(supplier)}
            >
              <div className="supplier-cell">{supplier.Id}</div>
              <div className="supplier-cell">{supplier.Name}</div>
              <div className="supplier-cell">{supplier.ContactName || '-'}</div>
              <div className="supplier-cell">{supplier.Phone || '-'}</div>
              <div className="supplier-cell">{supplier.Email || '-'}</div>
            </div>
          ))
        )}
      </div>

      {/* Botones de acción */}
      <div className="action-buttons">
        <button className="action-button add-button" onClick={handleAddSupplier}>
          AGREGAR PROVEEDOR
        </button>
        <button 
          className="action-button best-price-button" 
          onClick={handleGetBestPrices}
          disabled={bestPriceLoading}
        >
          {bestPriceLoading ? 'OBTENIENDO...' : 'OBTENER MEJORES PRECIOS'}
        </button>
      </div>

      {/* Modal de agregar proveedor */}
      <AddSupplierModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSuccess={handleAddModalSuccess}
      />

      {/* Modal de editar/eliminar proveedor con productos */}
      <EditSupplierModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        supplier={selectedSupplier}
        onSuccess={handleEditModalSuccess}
        onDelete={handleDeleteSuccess}
      />

      {/* Modal de mejores precios */}
      <BestPricesModal
        isOpen={isBestPricesModalOpen}
        onClose={handleCloseBestPricesModal}
        bestPrices={bestPricesData}
      />
    </div>
  )
}

export default SuppliersView

