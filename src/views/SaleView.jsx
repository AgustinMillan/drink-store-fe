import { useState, useEffect } from 'react'
import SelectProductModal from '../components/SelectProductModal'
import SelectPromotionModal from '../components/SelectPromotionModal'
import { saleApi, businessMovementApi } from '../services/api'
import './SaleView.css'

function SaleView() {
  const [cart, setCart] = useState([]) // Array de { type: 'product' | 'promotion', product/promotion, quantity }
  const [paymentAmount, setPaymentAmount] = useState('')
  const [total, setTotal] = useState(0)
  const [change, setChange] = useState(0)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false)
  const [processingSale, setProcessingSale] = useState(false)

  // Calcular total cuando cambian los items del carrito
  useEffect(() => {
    const sum = cart.reduce((acc, item) => {
      if (item.type === 'product') {
        const itemTotal = item.product.AmountToSale * item.quantity
        return acc + itemTotal
      } else if (item.type === 'promotion') {
        const itemTotal = parseFloat(item.promotion.Price || 0) * item.quantity
        return acc + itemTotal
      }
      return acc
    }, 0)
    setTotal(sum)
  }, [cart])

  // Calcular vuelto cuando cambian el total o el pago
  useEffect(() => {
    const payment = parseFloat(paymentAmount) || 0
    setChange(Math.max(0, payment - total))
  }, [total, paymentAmount])

  const handleSelectProduct = (product) => {
    // Verificar si el producto ya está en el carrito
    const existingItemIndex = cart.findIndex(
      item => item.type === 'product' && item.product.Id === product.Id
    )
    
    if (existingItemIndex >= 0) {
      // Si existe, aumentar la cantidad
      const newCart = [...cart]
      newCart[existingItemIndex].quantity += 1
      setCart(newCart)
    } else {
      // Si no existe, agregarlo con cantidad 1
      setCart([...cart, { type: 'product', product, quantity: 1 }])
    }
  }

  const handleSelectPromotion = (promotion) => {
    // Verificar si la promoción ya está en el carrito
    const existingItemIndex = cart.findIndex(
      item => item.type === 'promotion' && item.promotion.Id === promotion.Id
    )
    
    if (existingItemIndex >= 0) {
      // Si existe, aumentar la cantidad
      const newCart = [...cart]
      newCart[existingItemIndex].quantity += 1
      setCart(newCart)
    } else {
      // Si no existe, agregarla con cantidad 1
      setCart([...cart, { type: 'promotion', promotion, quantity: 1 }])
    }
  }

  const handleQuantityChange = (itemId, itemType, newQuantity) => {
    const quantity = parseInt(newQuantity) || 0
    if (quantity <= 0) {
      // Eliminar del carrito si la cantidad es 0 o menor
      setCart(cart.filter(item => {
        if (itemType === 'product') {
          return !(item.type === 'product' && item.product.Id === itemId)
        } else {
          return !(item.type === 'promotion' && item.promotion.Id === itemId)
        }
      }))
    } else {
      // Actualizar cantidad
      const newCart = cart.map(item => {
        if (itemType === 'product' && item.type === 'product' && item.product.Id === itemId) {
          return { ...item, quantity }
        } else if (itemType === 'promotion' && item.type === 'promotion' && item.promotion.Id === itemId) {
          return { ...item, quantity }
        }
        return item
      })
      setCart(newCart)
    }
  }

  const handleRemoveItem = (itemId, itemType) => {
    setCart(cart.filter(item => {
      if (itemType === 'product') {
        return !(item.type === 'product' && item.product.Id === itemId)
      } else {
        return !(item.type === 'promotion' && item.promotion.Id === itemId)
      }
    }))
  }

  const handlePaymentChange = (value) => {
    setPaymentAmount(value)
  }

  const handleFinishSale = async () => {
    if (cart.length === 0) {
      alert('Debe agregar al menos un producto o promoción')
      return
    }
    
    const payment = parseFloat(paymentAmount)
    if (!payment || payment < total) {
      alert('El monto de pago es insuficiente')
      return
    }

    setProcessingSale(true)

    try {
      // Separar productos y promociones
      const products = cart.filter(item => item.type === 'product')
      const promotions = cart.filter(item => item.type === 'promotion')

      // Calcular totales para distribución proporcional del pago
      const productsTotal = products.reduce((sum, item) => sum + (item.product.AmountToSale * item.quantity), 0)
      const promotionsTotal = promotions.reduce((sum, item) => sum + (parseFloat(item.promotion.Price || 0) * item.quantity), 0)
      const grandTotal = productsTotal + promotionsTotal

      console.log('productos', products)
      console.log('promociones', promotions)
      console.log('grandTotal', grandTotal)
      // Procesar productos
      if (products.length > 0) {
        const items = products.map(item => ({
          ProductId: item.product.Id,
          Quantity: item.quantity,
          Amount: item.product.AmountToSale
        }))

        // Distribuir el pago proporcionalmente
        const productsPayment = grandTotal > 0 ? (productsTotal / grandTotal) * payment : productsTotal

        const saleData = {
          Amount: productsTotal,
          PaymentAmount: productsPayment,
          Items: items,
          TicketNumber: null
        }

        const result = await saleApi.createWithItems(saleData)

        if (result.success) {
          // Crear movimientos de negocio para cada producto vendido
          const saleId = result.data?.Id || result.data?.id
          const movementPromises = products.map(item => {
            const movementData = {
              ProductId: item.product.Id,
              SupplierId: null,
              Type: 'OUT', // Salida de stock
              Reason: 'SALE', // Razón: venta
              Quantity: item.quantity,
              UnitCost: item.product.AmountSupplier || null,
              TotalAmount: (item.product.AmountToSale || 0) * item.quantity,
              ReferenceId: saleId || null,
              ReferenceType: 'Sale'
            }
            return businessMovementApi.create(movementData)
          })

          // Crear los movimientos (no esperamos el resultado para no bloquear la UI)
          Promise.all(movementPromises).catch(error => {
            console.error('Error al crear movimientos de negocio:', error)
          })
        } else {
          alert(result.error || 'Error al registrar la venta de productos')
          setProcessingSale(false)
          return
        }
      }

      // Procesar promociones
      if (promotions.length > 0) {
        // Distribuir el pago proporcionalmente entre todas las promociones
        const promotionsPayment = grandTotal > 0 ? (promotionsTotal / grandTotal) * payment : promotionsTotal
        const paymentPerPromotion = promotionsTotal > 0 ? promotionsPayment / promotions.reduce((sum, item) => sum + item.quantity, 0) : 0

        await promotions.map(async (cartItem) => {
          // Crear venta para cada cantidad de promoción
          const salePromises = []
          for (let i = 0; i < cartItem.quantity; i++) {
            const promotionData = {
              PromotionId: cartItem.promotion.Id,
              PaymentAmount: paymentPerPromotion,
              TicketNumber: null
            }
            salePromises.push(saleApi.createWithPromotion(promotionData))
          }

          const results = await Promise.all(salePromises)
          
          // Verificar que todas las ventas fueron exitosas
          const allSuccess = results.every(r => r.success)
          if (!allSuccess) {
            throw new Error('Error al registrar una o más ventas de promoción')
          }

          // Calcular el precio de la promoción
          const promotionPrice = parseFloat(cartItem.promotion.Price || 0)
          
          // Calcular el total de unidades de productos en la promoción
          const totalProductUnits = cartItem.promotion.promotionItems?.reduce(
            (sum, item) => sum + (item.Quantity || 0), 
            0
          ) || 1

          // Precio por unidad de producto (distribución proporcional)
          const pricePerUnit = totalProductUnits > 0 ? promotionPrice / totalProductUnits : promotionPrice

          // Crear movimientos de negocio para cada producto de la promoción
          results.forEach(async (result) => {
            const saleId = result.data?.Id || result.data?.id
            if (cartItem.promotion.promotionItems && cartItem.promotion.promotionItems.length > 0) {
              cartItem.promotion.promotionItems.forEach(async (promotionItem) => {
                // Calcular el TotalAmount proporcional basado en la cantidad del producto
                // Si el producto tiene Quantity: 2, entonces TotalAmount = pricePerUnit * 2
                const proportionalAmount = pricePerUnit * (promotionItem.Quantity || 1)
                
                const movementData = {
                  ProductId: promotionItem.ProductId,
                  SupplierId: null,
                  Type: 'OUT', // Salida de stock
                  Reason: 'PROMOTION_SALE', // Razón: venta de promoción
                  Quantity: promotionItem.Quantity,
                  UnitCost: promotionItem.product?.AmountSupplier || null,
                  TotalAmount: proportionalAmount, // Usar el precio proporcional de la promoción
                  ReferenceId: saleId || null,
                  ReferenceType: 'PromotionSale'
                }
                await businessMovementApi.create(movementData)
              })
            }
          })
        })

      }

      alert('Venta registrada exitosamente')
      
      // Limpiar formulario
      setCart([])
      setPaymentAmount('')
      setTotal(0)
      setChange(0)
    } catch (error) {
      console.error('Error al finalizar la venta:', error)
      alert(error.message || 'Error de conexión al registrar la venta')
    } finally {
      setProcessingSale(false)
    }
  }

  return (
    <div className="sale-view">
      <div className="sale-header">
        <h1 className="sale-title">AGREGAR PRODUCTO</h1>
      </div>

      <div className="sale-content">
        {/* Botones para agregar producto y promoción */}
        <div className="add-product-section" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <button 
            className="add-product-button"
            onClick={() => setIsProductModalOpen(true)}
          >
            + AGREGAR PRODUCTO
          </button>
          <button 
            className="add-product-button"
            onClick={() => setIsPromotionModalOpen(true)}
            style={{ background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)' }}
          >
            + AGREGAR PROMOCIÓN
          </button>
        </div>

        {/* Lista de productos y promociones en el carrito */}
        <div className="cart-section">
          {cart.length === 0 ? (
            <div className="empty-cart-message">
              No hay productos o promociones agregados. Haz clic en "AGREGAR PRODUCTO" o "AGREGAR PROMOCIÓN" para comenzar.
            </div>
          ) : (
            <div className="cart-items">
              {cart.map((item, index) => {
                const isProduct = item.type === 'product'
                const isPromotion = item.type === 'promotion'
                const itemId = isProduct ? item.product.Id : item.promotion.Id
                const itemName = isProduct ? item.product.Name : item.promotion.Name
                const itemPrice = isProduct ? item.product.AmountToSale : parseFloat(item.promotion.Price || 0)
                const subtotal = itemPrice * item.quantity

                return (
                  <div key={`${item.type}-${itemId}-${index}`} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">
                        {itemName}
                        {isPromotion && (
                          <span style={{ fontSize: '12px', color: '#4caf50', marginLeft: '8px' }}>
                            (Promoción)
                          </span>
                        )}
                      </div>
                      <div className="cart-item-price">${itemPrice.toFixed(2)} {isProduct ? 'c/u' : ''}</div>
                    </div>
                    <div className="cart-item-controls">
                      <button
                        className="quantity-button"
                        onClick={() => handleQuantityChange(itemId, item.type, item.quantity - 1)}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className="quantity-input"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(itemId, item.type, e.target.value)}
                        min="1"
                      />
                      <button
                        className="quantity-button"
                        onClick={() => handleQuantityChange(itemId, item.type, item.quantity + 1)}
                      >
                        +
                      </button>
                      <div className="cart-item-subtotal">
                        ${subtotal.toFixed(2)}
                      </div>
                      <button
                        className="remove-item-button"
                        onClick={() => handleRemoveItem(itemId, item.type)}
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Total de la compra */}
        <div className="total-section">
          <span className="total-label">TOTAL</span>
          <div className="total-value-container">
            <span className="total-dots"></span>
            <span className="total-amount">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Sección de pago */}
        <div className="payment-section">
          <span className="payment-label">PAGA CON</span>
          <input
            type="number"
            className="payment-input"
            placeholder="0.00"
            value={paymentAmount}
            onChange={(e) => handlePaymentChange(e.target.value)}
            step="0.01"
            min="0"
          />
        </div>

        {/* Sección de vuelto */}
        <div className="change-section">
          <span className="change-label">VUELTO</span>
          <div className="change-value-container">
            <span className="change-dots"></span>
            <span className="change-amount">${change.toFixed(2)}</span>
          </div>
        </div>

        {/* Botón de finalizar compra */}
        <button 
          className="finish-button" 
          onClick={handleFinishSale}
          disabled={processingSale || cart.length === 0}
        >
          {processingSale ? 'PROCESANDO...' : 'FINALIZAR COMPRA'}
        </button>
      </div>

      {/* Modal de seleccionar producto */}
      <SelectProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSelect={handleSelectProduct}
      />

      {/* Modal de seleccionar promoción */}
      <SelectPromotionModal
        isOpen={isPromotionModalOpen}
        onClose={() => setIsPromotionModalOpen(false)}
        onSelect={handleSelectPromotion}
      />
    </div>
  )
}

export default SaleView

