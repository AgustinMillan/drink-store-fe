import { useState, useEffect } from 'react'
import { promotionApi } from '../services/api'
import SelectProductModal from './SelectProductModal'
import './AddProductModal.css'

function EditPromotionModal({ isOpen, onClose, promotion, onSuccess, onDelete }) {
  const [formData, setFormData] = useState({
    Name: '',
    Description: '',
    Price: '',
    StartDate: '',
    EndDate: '',
    IsActive: true
  })
  const [items, setItems] = useState([]) // Array de { ProductId, Quantity, product }
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)

  // Cargar datos de la promoción cuando se abre el modal
  useEffect(() => {
    if (promotion && isOpen) {
      // Formatear fechas para datetime-local (YYYY-MM-DDTHH:mm)
      const formatDateForInput = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
      }

      setFormData({
        Name: promotion.Name || '',
        Description: promotion.Description || '',
        Price: promotion.Price?.toString() || '',
        StartDate: formatDateForInput(promotion.StartDate),
        EndDate: formatDateForInput(promotion.EndDate),
        IsActive: promotion.IsActive !== undefined ? promotion.IsActive : true
      })

      // Cargar items de la promoción
      if (promotion.promotionItems && promotion.promotionItems.length > 0) {
        const formattedItems = promotion.promotionItems.map(item => ({
          ProductId: item.ProductId,
          Quantity: item.Quantity,
          product: item.product || null
        }))
        setItems(formattedItems)
      } else {
        setItems([])
      }

      setErrors({})
    }
  }, [promotion, isOpen])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'datetime-local' ? value : value)
    }))
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handlePriceChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '') // Solo números
    setFormData(prev => ({
      ...prev,
      Price: value
    }))
    if (errors.Price) {
      setErrors(prev => ({ ...prev, Price: '' }))
    }
  }

  const handleAddProduct = (product) => {
    // Verificar si el producto ya está en la lista
    const existingIndex = items.findIndex(item => item.ProductId === product.Id)
    
    if (existingIndex >= 0) {
      // Si existe, aumentar la cantidad
      const newItems = [...items]
      newItems[existingIndex].Quantity += 1
      setItems(newItems)
    } else {
      // Si no existe, agregarlo con cantidad 1
      setItems([...items, {
        ProductId: product.Id,
        Quantity: 1,
        product: product
      }])
    }
  }

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleQuantityChange = (index, newQuantity) => {
    const quantity = parseInt(newQuantity) || 1
    if (quantity <= 0) {
      handleRemoveItem(index)
    } else {
      const newItems = [...items]
      newItems[index].Quantity = quantity
      setItems(newItems)
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.Name.trim()) {
      newErrors.Name = 'El nombre es requerido'
    }

    if (!formData.Price || parseFloat(formData.Price) <= 0) {
      newErrors.Price = 'El precio debe ser mayor a 0'
    }

    if (items.length === 0) {
      newErrors.items = 'Debe incluir al menos un producto'
    }

    // Validar fechas si están presentes
    if (formData.StartDate && formData.EndDate) {
      const startDate = new Date(formData.StartDate)
      const endDate = new Date(formData.EndDate)
      if (startDate >= endDate) {
        newErrors.EndDate = 'La fecha de fin debe ser posterior a la fecha de inicio'
      }
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
      const promotionData = {
        Name: formData.Name.trim(),
        Description: formData.Description.trim() || null,
        Price: parseFloat(formData.Price),
        StartDate: formData.StartDate || null,
        EndDate: formData.EndDate || null,
        IsActive: formData.IsActive,
        Items: items.map(item => ({
          ProductId: item.ProductId,
          Quantity: item.Quantity
        }))
      }

      const result = await promotionApi.update(promotion.Id, promotionData)

      if (result.success) {
        onSuccess && onSuccess()
        onClose()
      } else {
        setErrors({ submit: result.error || 'Error al actualizar la promoción' })
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Error de conexión' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`¿Estás seguro de eliminar la promoción "${promotion.Name}"? Esta acción no se puede deshacer.`)) {
      return
    }

    setDeleteLoading(true)

    try {
      const result = await promotionApi.delete(promotion.Id)

      if (result.success) {
        onDelete && onDelete()
        onClose()
      } else {
        setErrors({ submit: result.error || 'Error al eliminar la promoción' })
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
        Price: '',
        StartDate: '',
        EndDate: '',
        IsActive: true
      })
      setItems([])
      setErrors({})
      onClose()
    }
  }

  if (!isOpen || !promotion) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">EDITAR PROMOCIÓN</h2>
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
              placeholder="Ingrese el nombre de la promoción"
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
              <label htmlFor="Price" className="form-label">
                Precio <span className="required">*</span>
              </label>
              <div className="input-with-symbol">
                <input
                  type="text"
                  id="Price"
                  name="Price"
                  className={`form-input ${errors.Price ? 'error' : ''}`}
                  value={formData.Price}
                  onChange={handlePriceChange}
                  placeholder="0"
                  disabled={loading || deleteLoading}
                />
                <span className="input-symbol">$</span>
              </div>
              {errors.Price && (
                <span className="error-message">{errors.Price}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="IsActive" className="form-label">
                Estado
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '8px' }}>
                <input
                  type="checkbox"
                  id="IsActive"
                  name="IsActive"
                  checked={formData.IsActive}
                  onChange={handleChange}
                  disabled={loading || deleteLoading}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="IsActive" style={{ cursor: 'pointer', margin: 0 }}>
                  {formData.IsActive ? 'Activa' : 'Inactiva'}
                </label>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="StartDate" className="form-label">
                Fecha de Inicio
              </label>
              <input
                type="datetime-local"
                id="StartDate"
                name="StartDate"
                className="form-input"
                value={formData.StartDate}
                onChange={handleChange}
                disabled={loading || deleteLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="EndDate" className="form-label">
                Fecha de Fin
              </label>
              <input
                type="datetime-local"
                id="EndDate"
                name="EndDate"
                className={`form-input ${errors.EndDate ? 'error' : ''}`}
                value={formData.EndDate}
                onChange={handleChange}
                disabled={loading || deleteLoading}
              />
              {errors.EndDate && (
                <span className="error-message">{errors.EndDate}</span>
              )}
            </div>
          </div>

          {/* Sección de productos */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label">
                Productos <span className="required">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(true)}
                disabled={loading || deleteLoading}
                style={{
                  padding: '8px 16px',
                  background: '#646cff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                + Agregar Producto
              </button>
            </div>
            
            {errors.items && (
              <span className="error-message">{errors.items}</span>
            )}

            {items.length > 0 && (
              <div style={{
                border: '1px solid rgba(100, 108, 255, 0.3)',
                borderRadius: '8px',
                padding: '10px',
                marginTop: '10px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {items.map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px',
                    marginBottom: '8px',
                    background: 'rgba(100, 108, 255, 0.1)',
                    borderRadius: '6px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        {item.product?.Name || 'Producto'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                        ${item.product?.AmountToSale || 0} c/u
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(index, item.Quantity - 1)}
                        disabled={loading || deleteLoading}
                        style={{
                          width: '30px',
                          height: '30px',
                          background: '#333',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '18px'
                        }}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={item.Quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        min="1"
                        disabled={loading || deleteLoading}
                        style={{
                          width: '60px',
                          padding: '6px',
                          textAlign: 'center',
                          background: '#242424',
                          border: '1px solid #333',
                          borderRadius: '4px',
                          color: 'white'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(index, item.Quantity + 1)}
                        disabled={loading || deleteLoading}
                        style={{
                          width: '30px',
                          height: '30px',
                          background: '#333',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '18px'
                        }}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={loading || deleteLoading}
                        style={{
                          width: '30px',
                          height: '30px',
                          background: '#ff4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          marginLeft: '8px'
                        }}
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
              style={{
                background: '#ff4444',
                color: 'white'
              }}
            >
              {deleteLoading ? 'Eliminando...' : 'Eliminar'}
            </button>
            <div className="modal-actions-right" style={{ display: 'flex', gap: '15px' }}>
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

      {/* Modal de seleccionar producto */}
      <SelectProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSelect={handleAddProduct}
      />
    </div>
  )
}

export default EditPromotionModal

