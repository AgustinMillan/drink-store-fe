import { useState, useEffect } from 'react'
import { supplierProductPriceApi, productApi } from '../services/api'
import './EditSupplierModal.css'

function EditSupplierModal({ isOpen, onClose, supplier, onSuccess, onDelete }) {
  const [formData, setFormData] = useState({
    Name: '',
    ContactName: '',
    Phone: '',
    Email: '',
    Address: '',
    Notes: ''
  })
  const [supplierProducts, setSupplierProducts] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [productsLoading, setProductsLoading] = useState(false)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [newProductData, setNewProductData] = useState({
    ProductId: '',
    UnitPrice: ''
  })
  const [productPriceChanges, setProductPriceChanges] = useState({}) // { priceId: newPrice }

  // Cargar datos del proveedor y sus productos cuando se abre el modal
  useEffect(() => {
    if (supplier && isOpen) {
      setFormData({
        Name: supplier.Name || '',
        ContactName: supplier.ContactName || '',
        Phone: supplier.Phone || '',
        Email: supplier.Email || '',
        Address: supplier.Address || '',
        Notes: supplier.Notes || ''
      })
      setErrors({})
      setProductPriceChanges({})
      fetchSupplierProducts()
      fetchAllProducts()
    }
  }, [supplier, isOpen])

  const fetchSupplierProducts = async () => {
    if (!supplier?.Id) return
    
    setProductsLoading(true)
    try {
      const result = await supplierProductPriceApi.getBySupplierId(supplier.Id)
      if (result.success) {
        setSupplierProducts(result.data || [])
      }
    } catch (err) {
      console.error('Error fetching supplier products:', err)
    } finally {
      setProductsLoading(false)
    }
  }

  const fetchAllProducts = async () => {
    try {
      const result = await productApi.getAll()
      if (result.success) {
        setAllProducts(result.data || [])
      }
    } catch (err) {
      console.error('Error fetching products:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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
    if (!validate()) return

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

      // Actualizar proveedor
      const supplierResult = await supplierApi.update(supplier.Id, supplierData)
      if (!supplierResult.success) {
        setErrors({ submit: supplierResult.error || 'Error al actualizar el proveedor' })
        setLoading(false)
        return
      }

      // Actualizar precios de productos que han cambiado
      const priceUpdatePromises = Object.entries(productPriceChanges).map(([priceId, newPrice]) =>
        supplierProductPriceApi.update(parseInt(priceId), {
          UnitPrice: parseFloat(newPrice)
        })
      )

      if (priceUpdatePromises.length > 0) {
        await Promise.all(priceUpdatePromises)
      }

      onSuccess && onSuccess()
      onClose()
    } catch (error) {
      setErrors({ submit: error.message || 'Error de conexión' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`¿Estás seguro de eliminar el proveedor "${supplier.Name}"? Esta acción no se puede deshacer.`)) {
      return
    }

    setDeleteLoading(true)
    try {
      const { supplierApi } = await import('../services/api.js')
      const result = await supplierApi.delete(supplier.Id)
      if (result.success) {
        onDelete && onDelete()
        onClose()
      } else {
        setErrors({ submit: result.error || 'Error al eliminar el proveedor' })
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Error de conexión' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAddProduct = async () => {
    if (!newProductData.ProductId || !newProductData.UnitPrice) {
      alert('Debe seleccionar un producto e ingresar un precio')
      return
    }

    setIsAddingProduct(true)
    try {
      const result = await supplierProductPriceApi.create({
        SupplierId: supplier.Id,
        ProductId: parseInt(newProductData.ProductId),
        UnitPrice: parseFloat(newProductData.UnitPrice)
      })

      if (result.success) {
        setNewProductData({ ProductId: '', UnitPrice: '' })
        fetchSupplierProducts()
      } else {
        alert(result.error || 'Error al agregar el producto')
      }
    } catch (error) {
      alert('Error de conexión')
    } finally {
      setIsAddingProduct(false)
    }
  }

  const handleProductPriceChange = (priceId, newPrice) => {
    // Guardar el cambio localmente, no actualizar aún
    setProductPriceChanges(prev => ({
      ...prev,
      [priceId]: newPrice
    }))
  }

  const handleDeleteProductPrice = async (priceId) => {
    if (!window.confirm('¿Estás seguro de eliminar este precio?')) {
      return
    }

    try {
      const result = await supplierProductPriceApi.delete(priceId)
      if (result.success) {
        fetchSupplierProducts()
      } else {
        alert(result.error || 'Error al eliminar el precio')
      }
    } catch (error) {
      alert('Error de conexión')
    }
  }

  const getProductName = (productId) => {
    const product = allProducts.find(p => p.Id === productId)
    return product ? product.Name : `Producto #${productId}`
  }

  const availableProducts = allProducts.filter(p => 
    !supplierProducts.some(sp => sp.ProductId === p.Id)
  )

  const handleClose = () => {
    if (!loading && !deleteLoading) {
      setErrors({})
      setNewProductData({ ProductId: '', UnitPrice: '' })
      setProductPriceChanges({})
      setIsAddingProduct(false)
      onClose()
    }
  }

  if (!isOpen || !supplier) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">EDITAR PROVEEDOR Y PRODUCTOS</h2>
          <button className="modal-close" onClick={handleClose} disabled={loading || deleteLoading}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Formulario del proveedor */}
          <form onSubmit={handleSubmit} className="modal-form">
            <h3 className="section-title">Información del Proveedor</h3>
            
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
                disabled={loading || deleteLoading}
              />
              {errors.Name && <span className="error-message">{errors.Name}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ContactName" className="form-label">Nombre de Contacto</label>
                <input
                  type="text"
                  id="ContactName"
                  name="ContactName"
                  className="form-input"
                  value={formData.ContactName}
                  onChange={handleChange}
                  disabled={loading || deleteLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="Phone" className="form-label">Teléfono</label>
                <input
                  type="text"
                  id="Phone"
                  name="Phone"
                  className="form-input"
                  value={formData.Phone}
                  onChange={handleChange}
                  disabled={loading || deleteLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="Email" className="form-label">Email</label>
              <input
                type="email"
                id="Email"
                name="Email"
                className={`form-input ${errors.Email ? 'error' : ''}`}
                value={formData.Email}
                onChange={handleChange}
                disabled={loading || deleteLoading}
              />
              {errors.Email && <span className="error-message">{errors.Email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="Address" className="form-label">Dirección</label>
              <input
                type="text"
                id="Address"
                name="Address"
                className="form-input"
                value={formData.Address}
                onChange={handleChange}
                disabled={loading || deleteLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="Notes" className="form-label">Notas</label>
              <textarea
                id="Notes"
                name="Notes"
                className="form-input form-textarea"
                value={formData.Notes}
                onChange={handleChange}
                rows="3"
                disabled={loading || deleteLoading}
              />
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

          {/* Sección de productos */}
          <div className="products-section">
            <h3 className="section-title">Productos del Proveedor</h3>
            
            {/* Agregar nuevo producto */}
            <div className="add-product-form">
              <select
                className="form-input"
                value={newProductData.ProductId}
                onChange={(e) => setNewProductData({ ...newProductData, ProductId: e.target.value })}
                disabled={isAddingProduct}
              >
                <option value="">Seleccionar producto...</option>
                {availableProducts.map(product => (
                  <option key={product.Id} value={product.Id}>
                    {product.Name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="form-input"
                placeholder="Precio"
                value={newProductData.UnitPrice}
                onChange={(e) => setNewProductData({ ...newProductData, UnitPrice: e.target.value })}
                step="0.01"
                min="0"
                disabled={isAddingProduct}
              />
              <button
                type="button"
                className="add-product-btn"
                onClick={handleAddProduct}
                disabled={isAddingProduct || !newProductData.ProductId || !newProductData.UnitPrice}
              >
                {isAddingProduct ? 'Agregando...' : '+'}
              </button>
            </div>

            {/* Lista de productos */}
            <div className="products-list">
              {productsLoading ? (
                <div className="loading-message">Cargando productos...</div>
              ) : supplierProducts.length === 0 ? (
                <div className="empty-message">No hay productos asociados</div>
              ) : (
                supplierProducts.map((supplierProduct) => {
                  const priceId = supplierProduct.Id
                  const currentPrice = productPriceChanges[priceId] !== undefined 
                    ? productPriceChanges[priceId] 
                    : supplierProduct.UnitPrice
                  
                  return (
                    <div key={supplierProduct.Id} className="product-item">
                      <div className="product-info">
                        <span className="product-name">{getProductName(supplierProduct.ProductId)}</span>
                      </div>
                      <input
                        type="number"
                        className="price-input"
                        value={currentPrice}
                        onChange={(e) => handleProductPriceChange(priceId, e.target.value)}
                        step="0.01"
                        min="0"
                        disabled={loading || deleteLoading}
                      />
                      <button
                        className="remove-product-btn"
                        onClick={() => handleDeleteProductPrice(supplierProduct.Id)}
                        title="Eliminar"
                        disabled={loading || deleteLoading}
                      >
                        ×
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditSupplierModal

