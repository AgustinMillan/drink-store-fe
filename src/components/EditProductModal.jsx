import { useState, useEffect } from 'react'
import { businessMovementApi } from '../services/api'
import './EditProductModal.css'

function EditProductModal({ isOpen, onClose, product, onSuccess, onDelete }) {
  const [formData, setFormData] = useState({
    Name: '',
    Description: '',
    AmountSupplier: '',
    AmountToSale: '',
    Stock: '0'
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [originalStock, setOriginalStock] = useState(0)

  // Cargar datos del producto cuando se abre el modal
  useEffect(() => {
    if (product && isOpen) {
      const stock = product.Stock || 0
      setOriginalStock(stock)
      setFormData({
        Name: product.Name || '',
        Description: product.Description || '',
        AmountSupplier: product.AmountSupplier?.toString() || '',
        AmountToSale: product.AmountToSale?.toString() || '',
        Stock: stock.toString()
      })
      setErrors({})
    }
  }, [product, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'AmountSupplier' || name === 'AmountToSale' || name === 'Stock'
        ? value.replace(/[^0-9]/g, '') // Solo números para precios y stock
        : value
    }))
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.Name.trim()) {
      newErrors.Name = 'El nombre es requerido'
    }

    if (!formData.AmountSupplier || parseFloat(formData.AmountSupplier) <= 0) {
      newErrors.AmountSupplier = 'El precio de proveedor debe ser mayor a 0'
    }

    if (!formData.AmountToSale || parseFloat(formData.AmountToSale) <= 0) {
      newErrors.AmountToSale = 'El precio público debe ser mayor a 0'
    }

    if (formData.Stock && parseFloat(formData.Stock) < 0) {
      newErrors.Stock = 'El stock no puede ser negativo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setLoading(true)

    try {
      const { productApi } = await import('../services/api.js')
      const productData = {
        Name: formData.Name.trim(),
        Description: formData.Description.trim() || null,
        AmountSupplier: parseInt(formData.AmountSupplier),
        AmountToSale: parseInt(formData.AmountToSale),
        Stock: parseInt(formData.Stock) || 0
      }

      const result = await productApi.update(product.Id, productData)

      if (result.success) {
        // Si el stock aumentó, crear un movimiento de compra (PURCHASE)
        const newStock = parseInt(formData.Stock) || 0
        const stockIncrease = newStock - originalStock
        
        if (stockIncrease > 0) {
          const unitCost = parseInt(formData.AmountSupplier) || 0
          const movementData = {
            ProductId: product.Id,
            SupplierId: null, // No tenemos información del proveedor en este contexto
            Type: 'IN', // Entrada de stock
            Reason: 'PURCHASE', // Razón: compra
            Quantity: stockIncrease,
            UnitCost: unitCost > 0 ? unitCost : null,
            TotalAmount: unitCost > 0 ? unitCost * stockIncrease : null,
            ReferenceId: product.Id,
            ReferenceType: 'Product'
          }
          
          // Crear el movimiento (no esperamos el resultado para no bloquear la UI)
          businessMovementApi.create(movementData).catch(error => {
            console.error('Error al crear movimiento de compra:', error)
            // No mostramos error al usuario ya que el producto ya fue actualizado
          })
        }

        onSuccess && onSuccess()
        onClose()
      } else {
        setErrors({ submit: result.error || 'Error al actualizar el producto' })
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Error de conexión' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`¿Estás seguro de eliminar el producto "${product.Name}"? Esta acción no se puede deshacer.`)) {
      return
    }

    setDeleteLoading(true)

    try {
      const { productApi } = await import('../services/api.js')
      const result = await productApi.delete(product.Id)

      if (result.success) {
        onDelete && onDelete()
        onClose()
      } else {
        setErrors({ submit: result.error || 'Error al eliminar el producto' })
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Error de conexión' })
    } finally {
      setDeleteLoading(false)
    }
  }

    const handleClose = () => {
    if (!loading && !deleteLoading) {
      setFormData({
        Name: '',
        Description: '',
        AmountSupplier: '',
        AmountToSale: '',
        Stock: '0'
      })
      setErrors({})
      onClose()
    }
  }

  if (!isOpen || !product) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">EDITAR PRODUCTO</h2>
          <button className="modal-close" onClick={handleClose} disabled={loading || deleteLoading}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="Name" className="form-label">
              Nombre <span className="required">*</span>
            </label>
            <input
              type="text"
              id="Name"
              name="Name"
              className={`form-input ${errors.Name ? 'error' : ''}`}
              value={formData.Name}
              onChange={handleChange}
              placeholder="Ingrese el nombre del producto"
              disabled={loading || deleteLoading}
            />
            {errors.Name && <span className="error-message">{errors.Name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="Description" className="form-label">
              Descripción
            </label>
            <textarea
              id="Description"
              name="Description"
              className="form-input form-textarea"
              value={formData.Description}
              onChange={handleChange}
              placeholder="Ingrese la descripción (opcional)"
              rows="3"
              disabled={loading || deleteLoading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="AmountSupplier" className="form-label">
                Precio Proveedor <span className="required">*</span>
              </label>
              <div className="input-with-symbol">
                <input
                  type="text"
                  id="AmountSupplier"
                  name="AmountSupplier"
                  className={`form-input ${errors.AmountSupplier ? 'error' : ''}`}
                  value={formData.AmountSupplier}
                  onChange={handleChange}
                  placeholder="0"
                  disabled={loading || deleteLoading}
                />
                <span className="input-symbol">$</span>
              </div>
              {errors.AmountSupplier && (
                <span className="error-message">{errors.AmountSupplier}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="AmountToSale" className="form-label">
                Precio Público <span className="required">*</span>
              </label>
              <div className="input-with-symbol">
                <input
                  type="text"
                  id="AmountToSale"
                  name="AmountToSale"
                  className={`form-input ${errors.AmountToSale ? 'error' : ''}`}
                  value={formData.AmountToSale}
                  onChange={handleChange}
                  placeholder="0"
                  disabled={loading || deleteLoading}
                />
                <span className="input-symbol">$</span>
              </div>
              {errors.AmountToSale && (
                <span className="error-message">{errors.AmountToSale}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="Stock" className="form-label">
              Stock
            </label>
            <input
              type="text"
              id="Stock"
              name="Stock"
              className={`form-input ${errors.Stock ? 'error' : ''}`}
              value={formData.Stock}
              onChange={handleChange}
              placeholder="0"
              disabled={loading || deleteLoading}
            />
            {errors.Stock && (
              <span className="error-message">{errors.Stock}</span>
            )}
          </div>

          {errors.submit && (
            <div className="error-message submit-error">{errors.submit}</div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="modal-button delete-button"
              onClick={handleDelete}
              disabled={loading || deleteLoading}
            >
              {deleteLoading ? 'Eliminando...' : 'Eliminar'}
            </button>
            <div className="modal-actions-right">
              <button
                type="button"
                className="modal-button cancel-button"
                onClick={handleClose}
                disabled={loading || deleteLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="modal-button submit-button"
                disabled={loading || deleteLoading}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProductModal

