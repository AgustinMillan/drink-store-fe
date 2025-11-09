import { useState, useEffect } from 'react'
import SelectProductModal from '../components/SelectProductModal'
import { saleApi, businessMovementApi } from '../services/api'
import './SaleView.css'

function SaleView() {
  const [cart, setCart] = useState([]) // Array de { product, quantity }
  const [paymentAmount, setPaymentAmount] = useState('')
  const [total, setTotal] = useState(0)
  const [change, setChange] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [processingSale, setProcessingSale] = useState(false)

  // Calcular total cuando cambian los items del carrito
  useEffect(() => {
    const sum = cart.reduce((acc, item) => {
      const itemTotal = item.product.AmountToSale * item.quantity
      return acc + itemTotal
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
    const existingItemIndex = cart.findIndex(item => item.product.Id === product.Id)
    
    if (existingItemIndex >= 0) {
      // Si existe, aumentar la cantidad
      const newCart = [...cart]
      newCart[existingItemIndex].quantity += 1
      setCart(newCart)
    } else {
      // Si no existe, agregarlo con cantidad 1
      setCart([...cart, { product, quantity: 1 }])
    }
  }

  const handleQuantityChange = (productId, newQuantity) => {
    const quantity = parseInt(newQuantity) || 0
    if (quantity <= 0) {
      // Eliminar del carrito si la cantidad es 0 o menor
      setCart(cart.filter(item => item.product.Id !== productId))
    } else {
      // Actualizar cantidad
      const newCart = cart.map(item =>
        item.product.Id === productId
          ? { ...item, quantity }
          : item
      )
      setCart(newCart)
    }
  }

  const handleRemoveItem = (productId) => {
    setCart(cart.filter(item => item.product.Id !== productId))
  }

  const handlePaymentChange = (value) => {
    setPaymentAmount(value)
  }

  const handleFinishSale = async () => {
    if (cart.length === 0) {
      alert('Debe agregar al menos un producto')
      return
    }
    
    const payment = parseFloat(paymentAmount)
    if (!payment || payment < total) {
      alert('El monto de pago es insuficiente')
      return
    }

    setProcessingSale(true)

    try {
      // Preparar los items para enviar
      const items = cart.map(item => ({
        ProductId: item.product.Id,
        Quantity: item.quantity,
        Amount: item.product.AmountToSale
      }))

      // Crear la venta con items
      const saleData = {
        Amount: total,
        PaymentAmount: payment,
        Items: items,
        TicketNumber: null
      }

      const result = await saleApi.createWithItems(saleData)

      if (result.success) {
        // Crear movimientos de negocio para cada producto vendido
        const saleId = result.data?.Id || result.data?.id
        const movementPromises = cart.map(item => {
          const movementData = {
            ProductId: item.product.Id,
            SupplierId: null,
            Type: 'OUT', // Salida de stock
            Reason: 'SALE', // Razón: venta
            Quantity: item.quantity,
            UnitCost: item.product.AmountSupplier || null,
            TotalAmount: (item.product.AmountSupplier || 0) * item.quantity,
            ReferenceId: saleId || null,
            ReferenceType: 'Sale'
          }
          return businessMovementApi.create(movementData)
        })

        // Crear los movimientos (no esperamos el resultado para no bloquear la UI)
        Promise.all(movementPromises).catch(error => {
          console.error('Error al crear movimientos de negocio:', error)
          // No mostramos error al usuario ya que la venta ya fue exitosa
        })

        alert('Venta registrada exitosamente')
        
        // Limpiar formulario
        setCart([])
        setPaymentAmount('')
        setTotal(0)
        setChange(0)
      } else {
        alert(result.error || 'Error al registrar la venta')
      }
    } catch (error) {
      console.error('Error al finalizar la venta:', error)
      alert('Error de conexión al registrar la venta')
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
        {/* Botón para agregar producto */}
        <div className="add-product-section">
          <button 
            className="add-product-button"
            onClick={() => setIsModalOpen(true)}
          >
            + AGREGAR PRODUCTO
          </button>
        </div>

        {/* Lista de productos en el carrito */}
        <div className="cart-section">
          {cart.length === 0 ? (
            <div className="empty-cart-message">
              No hay productos agregados. Haz clic en "AGREGAR PRODUCTO" para comenzar.
            </div>
          ) : (
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.product.Id} className="cart-item">
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.product.Name}</div>
                    <div className="cart-item-price">${item.product.AmountToSale} c/u</div>
                  </div>
                  <div className="cart-item-controls">
                    <button
                      className="quantity-button"
                      onClick={() => handleQuantityChange(item.product.Id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      className="quantity-input"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.product.Id, e.target.value)}
                      min="1"
                    />
                    <button
                      className="quantity-button"
                      onClick={() => handleQuantityChange(item.product.Id, item.quantity + 1)}
                    >
                      +
                    </button>
                    <div className="cart-item-subtotal">
                      ${(item.product.AmountToSale * item.quantity).toFixed(2)}
                    </div>
                    <button
                      className="remove-item-button"
                      onClick={() => handleRemoveItem(item.product.Id)}
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectProduct}
      />
    </div>
  )
}

export default SaleView

