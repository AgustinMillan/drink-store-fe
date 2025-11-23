import { useState, useEffect } from 'react'
import { promotionApi } from '../services/api'
import './SelectProductModal.css'

function SelectPromotionModal({ isOpen, onClose, onSelect }) {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchPromotions()
    }
  }, [isOpen])

  const fetchPromotions = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await promotionApi.getAllActive()
      if (result.success) {
        // Filtrar solo promociones activas
        setPromotions(result.data || [])
      } else {
        setError(result.error || 'Error al cargar las promociones')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
      console.error('Error fetching promotions:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredPromotions = promotions.filter(promotion =>
    promotion.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (promotion.Description && promotion.Description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSelectPromotion = (promotion) => {
    onSelect && onSelect(promotion)
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
          <h2 className="modal-title">SELECCIONAR PROMOCIÓN</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Buscador */}
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar promoción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Lista de promociones */}
          <div className="products-list-container">
            {loading ? (
              <div className="loading-message">Cargando promociones...</div>
            ) : error ? (
              <div className="error-message">
                {error}
                <button onClick={fetchPromotions} className="retry-button">
                  Reintentar
                </button>
              </div>
            ) : filteredPromotions.length === 0 ? (
              <div className="empty-message">
                {searchTerm ? 'No se encontraron promociones' : 'No hay promociones activas disponibles'}
              </div>
            ) : (
              <div className="products-grid">
                {filteredPromotions.map((promotion) => (
                  <div
                    key={promotion.Id}
                    className="product-card"
                    onClick={() => handleSelectPromotion(promotion)}
                  >
                    <div className="product-info">
                      <h3 className="product-name">{promotion.Name}</h3>
                      {promotion.Description && (
                        <p className="product-description">{promotion.Description}</p>
                      )}
                      {promotion.promotionItems && promotion.promotionItems.length > 0 && (
                        <p className="product-description" style={{ marginTop: '8px', fontSize: '11px' }}>
                          {promotion.promotionItems.map((item, idx) => (
                            <span key={idx}>
                              {item.Quantity}x {item.product?.Name || 'N/A'}
                              {idx < promotion.promotionItems.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                    <div className="product-price">
                      ${parseFloat(promotion.Price || 0).toFixed(2)}
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

export default SelectPromotionModal

