import { useState, useEffect } from 'react'
import AddProductModal from '../components/AddProductModal'
import EditProductModal from '../components/EditProductModal'
import AddPromotionModal from '../components/AddPromotionModal'
import EditPromotionModal from '../components/EditPromotionModal'
import { productApi, promotionApi } from '../services/api'
import './StockView.css'

function StockView() {
  // Estado para pestañas
  const [activeTab, setActiveTab] = useState('products') // 'products' o 'promotions'

  // Estados para productos
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Estados para promociones
  const [promotions, setPromotions] = useState([])
  const [filteredPromotions, setFilteredPromotions] = useState([])
  const [promotionSearchTerm, setPromotionSearchTerm] = useState('')
  const [promotionsLoading, setPromotionsLoading] = useState(true)
  const [promotionsError, setPromotionsError] = useState(null)
  const [isAddPromotionModalOpen, setIsAddPromotionModalOpen] = useState(false)
  const [isEditPromotionModalOpen, setIsEditPromotionModalOpen] = useState(false)
  const [selectedPromotion, setSelectedPromotion] = useState(null)

  // Cargar productos del backend
  const fetchProducts = async () => {
    setProductsLoading(true)
    setProductsError(null)
    try {
      const result = await productApi.getAll()
      if (result.success) {
        const productsData = result.data || []
        setProducts(productsData)
        setFilteredProducts(productsData)
      } else {
        setProductsError(result.error || 'Error al cargar los productos')
      }
    } catch (err) {
      setProductsError('Error de conexión con el servidor')
      console.error('Error fetching products:', err)
    } finally {
      setProductsLoading(false)
    }
  }

  // Cargar promociones del backend
  const fetchPromotions = async () => {
    setPromotionsLoading(true)
    setPromotionsError(null)
    try {
      const result = await promotionApi.getAll()
      if (result.success) {
        const promotionsData = result.data || []
        setPromotions(promotionsData)
        setFilteredPromotions(promotionsData)
      } else {
        setPromotionsError(result.error || 'Error al cargar las promociones')
      }
    } catch (err) {
      setPromotionsError('Error de conexión con el servidor')
      console.error('Error fetching promotions:', err)
    } finally {
      setPromotionsLoading(false)
    }
  }

  // Filtrar productos basado en el término de búsqueda
  useEffect(() => {
    if (!productSearchTerm.trim()) {
      setFilteredProducts(products)
      return
    }

    const term = productSearchTerm.toLowerCase().trim()
    const filtered = products.filter(product => {
      const idMatch = product.Id?.toString().includes(term)
      const nameMatch = product.Name?.toLowerCase().includes(term)
      const descriptionMatch = product.Description?.toLowerCase().includes(term)
      const supplierPriceMatch = product.AmountSupplier?.toString().includes(term)
      const salePriceMatch = product.AmountToSale?.toString().includes(term)
      const stockMatch = product.Stock?.toString().includes(term)

      return idMatch || nameMatch || descriptionMatch || supplierPriceMatch || salePriceMatch || stockMatch
    })

    setFilteredProducts(filtered)
  }, [productSearchTerm, products])

  // Filtrar promociones basado en el término de búsqueda
  useEffect(() => {
    if (!promotionSearchTerm.trim()) {
      setFilteredPromotions(promotions)
      return
    }

    const term = promotionSearchTerm.toLowerCase().trim()
    const filtered = promotions.filter(promotion => {
      const idMatch = promotion.Id?.toString().includes(term)
      const nameMatch = promotion.Name?.toLowerCase().includes(term)
      const descriptionMatch = promotion.Description?.toLowerCase().includes(term)
      const priceMatch = promotion.Price?.toString().includes(term)
      const itemsMatch = promotion.promotionItems?.some(item => 
        item.product?.Name?.toLowerCase().includes(term)
      )

      return idMatch || nameMatch || descriptionMatch || priceMatch || itemsMatch
    })

    setFilteredPromotions(filtered)
  }, [promotionSearchTerm, promotions])

  // Cargar datos cuando cambia la pestaña activa
  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts()
    } else if (activeTab === 'promotions') {
      fetchPromotions()
    }
  }, [activeTab])

  // Handlers para productos
  const handleAddProduct = () => {
    setIsAddModalOpen(true)
  }

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false)
  }

  const handleAddModalSuccess = () => {
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
    fetchProducts()
  }

  const handleDeleteSuccess = () => {
    fetchProducts()
  }

  // Handlers para promociones
  const handleAddPromotion = () => {
    setIsAddPromotionModalOpen(true)
  }

  const handleCloseAddPromotionModal = () => {
    setIsAddPromotionModalOpen(false)
  }

  const handleAddPromotionModalSuccess = () => {
    fetchPromotions()
  }

  const handlePromotionClick = (promotion) => {
    setSelectedPromotion(promotion)
    setIsEditPromotionModalOpen(true)
  }

  const handleCloseEditPromotionModal = () => {
    setIsEditPromotionModalOpen(false)
    setSelectedPromotion(null)
  }

  const handleEditPromotionModalSuccess = () => {
    fetchPromotions()
  }

  const handleDeletePromotionSuccess = () => {
    fetchPromotions()
  }

  // Renderizar vista de productos
  const renderProductsView = () => (
    <>
      {/* Barra de búsqueda */}
      <div className="search-container">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por ID, nombre, descripción, precio o stock..."
            value={productSearchTerm}
            onChange={(e) => setProductSearchTerm(e.target.value)}
          />
          {productSearchTerm && (
            <button
              className="clear-search-button"
              onClick={() => setProductSearchTerm('')}
              title="Limpiar búsqueda"
            >
              ×
            </button>
          )}
        </div>
        {productSearchTerm && (
          <div className="search-results-info">
            {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

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
        {productsLoading ? (
          <div className="loading-message">Cargando productos...</div>
        ) : productsError ? (
          <div className="error-message">
            {productsError}
            <button onClick={fetchProducts} className="retry-button">
              Reintentar
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-message">
            {productSearchTerm ? 'No se encontraron productos que coincidan con la búsqueda' : 'No hay productos registrados'}
          </div>
        ) : (
          filteredProducts.map((product) => (
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
      </div>
    </>
  )

  // Renderizar vista de promociones
  const renderPromotionsView = () => (
    <>
      {/* Barra de búsqueda */}
      <div className="search-container">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por ID, nombre, descripción, precio o productos..."
            value={promotionSearchTerm}
            onChange={(e) => setPromotionSearchTerm(e.target.value)}
          />
          {promotionSearchTerm && (
            <button
              className="clear-search-button"
              onClick={() => setPromotionSearchTerm('')}
              title="Limpiar búsqueda"
            >
              ×
            </button>
          )}
        </div>
        {promotionSearchTerm && (
          <div className="search-results-info">
            {filteredPromotions.length} promoción{filteredPromotions.length !== 1 ? 'es' : ''} encontrada{filteredPromotions.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Encabezados de tabla */}
      <div className="table-header promotions-header">
        <div className="header-cell">ID</div>
        <div className="header-cell">NOMBRE</div>
        <div className="header-cell">DESCRIPCION</div>
        <div className="header-cell">PRODUCTOS</div>
        <div className="header-cell">PRECIO</div>
        <div className="header-cell">ESTADO</div>
      </div>

      {/* Lista de promociones */}
      <div className="products-list">
        {promotionsLoading ? (
          <div className="loading-message">Cargando promociones...</div>
        ) : promotionsError ? (
          <div className="error-message">
            {promotionsError}
            <button onClick={fetchPromotions} className="retry-button">
              Reintentar
            </button>
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="empty-message">
            {promotionSearchTerm ? 'No se encontraron promociones que coincidan con la búsqueda' : 'No hay promociones registradas'}
          </div>
        ) : (
          filteredPromotions.map((promotion) => (
            <div 
              key={promotion.Id} 
              className="product-row promotion-row clickable"
              onClick={() => handlePromotionClick(promotion)}
            >
              <div className="product-cell">{promotion.Id}</div>
              <div className="product-cell">{promotion.Name}</div>
              <div className="product-cell">{promotion.Description || '-'}</div>
              <div className="product-cell">
                {promotion.promotionItems?.map((item, idx) => (
                  <div key={idx} className="promotion-item">
                    {item.Quantity}x {item.product?.Name || 'N/A'}
                  </div>
                )) || '-'}
              </div>
              <div className="product-cell">${parseFloat(promotion.Price || 0).toFixed(2)}</div>
              <div className="product-cell">
                <span className={`status-badge ${promotion.IsActive ? 'active' : 'inactive'}`}>
                  {promotion.IsActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Botones de acción */}
      <div className="action-buttons">
        <button className="action-button add-button" onClick={handleAddPromotion}>
          AGREGAR PROMOCIÓN
        </button>
      </div>
    </>
  )

  return (
    <div className="stock-view">
      {/* Pestañas */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          PRODUCTOS
        </button>
        <button
          className={`tab-button ${activeTab === 'promotions' ? 'active' : ''}`}
          onClick={() => setActiveTab('promotions')}
        >
          PROMOCIONES
        </button>
      </div>

      {/* Contenido según la pestaña activa */}
      {activeTab === 'products' ? renderProductsView() : renderPromotionsView()}

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

      {/* Modal de agregar promoción */}
      <AddPromotionModal
        isOpen={isAddPromotionModalOpen}
        onClose={handleCloseAddPromotionModal}
        onSuccess={handleAddPromotionModalSuccess}
      />

      {/* Modal de editar/eliminar promoción */}
      <EditPromotionModal
        isOpen={isEditPromotionModalOpen}
        onClose={handleCloseEditPromotionModal}
        promotion={selectedPromotion}
        onSuccess={handleEditPromotionModalSuccess}
        onDelete={handleDeletePromotionSuccess}
      />
    </div>
  )
}

export default StockView
