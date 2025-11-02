import { useState } from 'react'
import './AddSupplierModal.css'

function AddSupplierModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    Name: '',
    ContactName: '',
    Phone: '',
    Email: '',
    Address: '',
    Notes: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    if (formData.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
      newErrors.Email = 'Email inválido'
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
      const { supplierApi } = await import('../services/api.js')
      const supplierData = {
        Name: formData.Name.trim(),
        ContactName: formData.ContactName.trim() || null,
        Phone: formData.Phone.trim() || null,
        Email: formData.Email.trim() || null,
        Address: formData.Address.trim() || null,
        Notes: formData.Notes.trim() || null
      }

      const result = await supplierApi.create(supplierData)

      if (result.success) {
        // Limpiar formulario
        setFormData({
          Name: '',
          ContactName: '',
          Phone: '',
          Email: '',
          Address: '',
          Notes: ''
        })
        setErrors({})
        onSuccess && onSuccess()
        onClose()
      } else {
        setErrors({ submit: result.error || 'Error al crear el proveedor' })
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Error de conexión' })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        Name: '',
        ContactName: '',
        Phone: '',
        Email: '',
        Address: '',
        Notes: ''
      })
      setErrors({})
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">AGREGAR PROVEEDOR</h2>
          <button className="modal-close" onClick={handleClose} disabled={loading}>
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
              placeholder="Ingrese el nombre del proveedor"
              disabled={loading}
            />
            {errors.Name && <span className="error-message">{errors.Name}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ContactName" className="form-label">
                Nombre de Contacto
              </label>
              <input
                type="text"
                id="ContactName"
                name="ContactName"
                className="form-input"
                value={formData.ContactName}
                onChange={handleChange}
                placeholder="Nombre del contacto"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="Phone" className="form-label">
                Teléfono
              </label>
              <input
                type="text"
                id="Phone"
                name="Phone"
                className="form-input"
                value={formData.Phone}
                onChange={handleChange}
                placeholder="Número de teléfono"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="Email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="Email"
              name="Email"
              className={`form-input ${errors.Email ? 'error' : ''}`}
              value={formData.Email}
              onChange={handleChange}
              placeholder="email@ejemplo.com"
              disabled={loading}
            />
            {errors.Email && <span className="error-message">{errors.Email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="Address" className="form-label">
              Dirección
            </label>
            <input
              type="text"
              id="Address"
              name="Address"
              className="form-input"
              value={formData.Address}
              onChange={handleChange}
              placeholder="Dirección del proveedor"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="Notes" className="form-label">
              Notas
            </label>
            <textarea
              id="Notes"
              name="Notes"
              className="form-input form-textarea"
              value={formData.Notes}
              onChange={handleChange}
              placeholder="Notas adicionales (opcional)"
              rows="3"
              disabled={loading}
            />
          </div>

          {errors.submit && (
            <div className="error-message submit-error">{errors.submit}</div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="modal-button cancel-button"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="modal-button submit-button"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddSupplierModal

