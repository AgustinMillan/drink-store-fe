import { useState, useEffect } from 'react'
import AddProductModal from '../components/AddProductModal'
import EditProductModal from '../components/EditProductModal'
import { productApi } from '../services/api'
import './StockView.css'

function StockView() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Cargar productos del backend
  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await productApi.getAll()
      if (result.success) {
        setProducts(result.data || [])
      } else {
        setError(result.error || 'Error al cargar los productos')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleAddProduct = () => {
    setIsAddModalOpen(true)
  }

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false)
  }

  const handleAddModalSuccess = () => {
    // Recargar productos después de crear uno nuevo
    fetchProducts()
  }

  const handleProductClick = (product) => {
    setSelectedProduct(product)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedProduct(null)
  }

  const handleEditModalSuccess = () => {
    // Recargar productos después de editar
    fetchProducts()
  }

  const handleDeleteSuccess = () => {
    // Recargar productos después de eliminar
    fetchProducts()
  }

  const handleUpdatePrices = async () => {
    // TODO: Implementar funcionalidad para actualizar precios
    const result = await productApi.bulkUpdatePrices()
    if (result.success) {
      alert(result.message)
      fetchProducts()
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="stock-view">
      {/* Encabezados de tabla */}
      <div className="table-header">
        <div className="header-cell">ID</div>
        <div className="header-cell">NOMBRE</div>
        <div className="header-cell">DESCRIPCION</div>
        <div className="header-cell">P. PROVEEDOR</div>
        <div className="header-cell">P. PUBLICO</div>
        <div className="header-cell">STOCK</div>
      </div>

      {/* Lista de productos */}
      <div className="products-list">
        {loading ? (
          <div className="loading-message">Cargando productos...</div>
        ) : error ? (
          <div className="error-message">
            {error}
            <button onClick={fetchProducts} className="retry-button">
              Reintentar
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-message">No hay productos registrados</div>
        ) : (
          products.map((product) => (
            <div 
              key={product.Id} 
              className="product-row clickable"
              onClick={() => handleProductClick(product)}
            >
              <div className="product-cell">{product.Id}</div>
              <div className="product-cell">{product.Name}</div>
              <div className="product-cell">{product.Description || '-'}</div>
              <div className="product-cell">${product.AmountSupplier}</div>
              <div className="product-cell">${product.AmountToSale}</div>
              <div className="product-cell stock-cell">{product.Stock || 0}</div>
            </div>
          ))
        )}
      </div>

      {/* Botones de acción */}
      <div className="action-buttons">
        <button className="action-button add-button" onClick={handleAddProduct}>
          AGREGAR PRODUCTO
        </button>
        <button className="action-button update-button" onClick={handleUpdatePrices}>
          ACTUALIZAR PRECIOS
        </button>
      </div>

      {/* Modal de agregar producto */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSuccess={handleAddModalSuccess}
      />

      {/* Modal de editar/eliminar producto */}
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        product={selectedProduct}
        onSuccess={handleEditModalSuccess}
        onDelete={handleDeleteSuccess}
      />
    </div>
  )
}

export default StockView

