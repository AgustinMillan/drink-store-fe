import './BestPricesModal.css'

function BestPricesModal({ isOpen, onClose, bestPrices }) {
  console.log('BestPricesModal renderizado - isOpen:', isOpen, 'bestPrices:', bestPrices)
  
  if (!isOpen) return null

  const handleClose = () => {
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content best-prices-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">MEJORES PRECIOS</h2>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="best-prices-content">
          {!bestPrices || bestPrices.length === 0 ? (
            <div className="empty-message">No hay precios disponibles</div>
          ) : (
            <div className="best-prices-table">
              <div className="best-prices-header">
                <div className="best-price-cell header-cell">ID</div>
                <div className="best-price-cell header-cell">PRODUCTO</div>
                <div className="best-price-cell header-cell">MEJOR PRECIO</div>
                <div className="best-price-cell header-cell">PROVEEDOR</div>
              </div>
              <div className="best-prices-list">
                {bestPrices.map((item) => (
                  <div key={item.Id} className="best-price-row">
                    <div className="best-price-cell">{item.Id}</div>
                    <div className="best-price-cell product-name">{item.Name}</div>
                    <div className={`best-price-cell price-cell ${!item.AmountSupplier ? 'empty' : ''}`}>
                      {item.AmountSupplier ? `$${parseFloat(item.AmountSupplier).toFixed(2)}` : '-'}
                    </div>
                    <div className="best-price-cell supplier-name">
                      {item.NameSupplier || '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="modal-button submit-button"
            onClick={handleClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default BestPricesModal

