import { useState, useEffect } from 'react'
import { productApi } from '../services/api'
import './SelectProductModal.css'

function SelectProductModal({ isOpen, onClose, onSelect }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
    }
  }, [isOpen])

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

  const filteredProducts = products.filter(product =>
    product.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.Description && product.Description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSelectProduct = (product) => {
    onSelect && onSelect(product)
    onClose()
  }

  const handleClose = () => {
    setSearchTerm('')
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">SELECCIONAR PRODUCTO</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Buscador */}
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Lista de productos */}
          <div className="products-list-container">
            {loading ? (
              <div className="loading-message">Cargando productos...</div>
            ) : error ? (
              <div className="error-message">
                {error}
                <button onClick={fetchProducts} className="retry-button">
                  Reintentar
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-message">
                {searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles'}
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map((product) => (
                  <div
                    key={product.Id}
                    className="product-card"
                    onClick={() => handleSelectProduct(product)}
                  >
                    <div className="product-info">
                      <h3 className="product-name">{product.Name}</h3>
                      {product.Description && (
                        <p className="product-description">{product.Description}</p>
                      )}
                    </div>
                    <div className="product-price">
                      ${product.AmountToSale}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SelectProductModal

