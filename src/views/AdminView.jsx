import { useState, useEffect } from 'react'
import { saleApi, productApi } from '../services/api'
import './AdminView.css'

function AdminView() {
  const [todaySales, setTodaySales] = useState(null)
  const [monthSales, setMonthSales] = useState(null)
  const [lowStockProducts, setLowStockProducts] = useState(null)
  const [todayFinancialReport, setTodayFinancialReport] = useState(null)
  const [monthFinancialReport, setMonthFinancialReport] = useState(null)
  const [loadingToday, setLoadingToday] = useState(true)
  const [loadingMonth, setLoadingMonth] = useState(false)
  const [loadingLowStock, setLoadingLowStock] = useState(true)
  const [loadingTodayReport, setLoadingTodayReport] = useState(true)
  const [loadingMonthReport, setLoadingMonthReport] = useState(true)
  const [error, setError] = useState(null)

  // Cargar ventas del día, reportes financieros y productos con stock bajo automáticamente
  useEffect(() => {
    fetchTodaySales()
    fetchTodayFinancialReport()
    fetchMonthFinancialReport()
    fetchLowStockProducts()
  }, [])

  const fetchTodaySales = async () => {
    setLoadingToday(true)
    setError(null)
    try {
      const result = await saleApi.getToday()
      if (result.success) {
        setTodaySales(result.data)
      } else {
        setError(result.error || 'Error al cargar las ventas del día')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
      console.error('Error fetching today sales:', err)
    } finally {
      setLoadingToday(false)
    }
  }

  const fetchMonthSales = async () => {
    setLoadingMonth(true)
    setError(null)
    try {
      const result = await saleApi.getCurrentMonth()
      if (result.success) {
        setMonthSales(result.data)
      } else {
        setError(result.error || 'Error al cargar las ventas del mes')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
      console.error('Error fetching month sales:', err)
    } finally {
      setLoadingMonth(false)
    }
  }

  const fetchLowStockProducts = async () => {
    setLoadingLowStock(true)
    setError(null)
    try {
      const result = await productApi.getLowStock(5)
      if (result.success) {
        // La API devuelve { success: true, data: [...], count: X, threshold: 5 }
        setLowStockProducts(result.data || [])
      } else {
        setError(result.error || 'Error al cargar productos con stock bajo')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
      console.error('Error fetching low stock products:', err)
    } finally {
      setLoadingLowStock(false)
    }
  }

  const fetchTodayFinancialReport = async () => {
    setLoadingTodayReport(true)
    setError(null)
    try {
      const result = await saleApi.getTodayFinancialReport()
      if (result.success) {
        setTodayFinancialReport(result.data)
      } else {
        setError(result.error || 'Error al cargar el reporte financiero del día')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
      console.error('Error fetching today financial report:', err)
    } finally {
      setLoadingTodayReport(false)
    }
  }

  const fetchMonthFinancialReport = async () => {
    setLoadingMonthReport(true)
    setError(null)
    try {
      const result = await saleApi.getCurrentMonthFinancialReport()
      if (result.success) {
        setMonthFinancialReport(result.data)
      } else {
        setError(result.error || 'Error al cargar el reporte financiero del mes')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
      console.error('Error fetching month financial report:', err)
    } finally {
      setLoadingMonthReport(false)
    }
  }

  return (
    <div className="admin-view">
      <div className="admin-header">
        <h1 className="admin-title">ADMINISTRACIÓN</h1>
      </div>

      <div className="admin-content">
        {/* Sección de Reporte Financiero del Día */}
        {todayFinancialReport && !loadingTodayReport && (
          <div className="admin-section financial-report-section">
            <div className="section-header">
              <h2 className="section-title">REPORTE FINANCIERO - DÍA ACTUAL</h2>
              <button 
                className="refresh-button" 
                onClick={fetchTodayFinancialReport}
                disabled={loadingTodayReport}
              >
                {loadingTodayReport ? '🔄' : '🔄'}
              </button>
            </div>

            <div className="financial-report">
              <div className="financial-cards">
                <div className="financial-card revenue">
                  <div className="card-label">TOTAL GANADO</div>
                  <div className="card-value">${todayFinancialReport.report.totalRevenue.toFixed(2)}</div>
                </div>
                <div className="financial-card invested">
                  <div className="card-label">TOTAL INVERTIDO</div>
                  <div className="card-value">${todayFinancialReport.report.totalInvested.toFixed(2)}</div>
                </div>
                <div className="financial-card profit">
                  <div className="card-label">GANANCIA REAL</div>
                  <div className="card-value">${todayFinancialReport.report.realProfit.toFixed(2)}</div>
                </div>
                <div className="financial-card reinvestment">
                  <div className="card-label">REINVERSIÓN NECESARIA</div>
                  <div className="card-value">${todayFinancialReport.report.totalReinvestment.toFixed(2)}</div>
                </div>
              </div>
              
              <div className="financial-summary">
                <div className="summary-item">
                  <span className="summary-label">Margen de Ganancia:</span>
                  <span className="summary-value profit-margin">
                    {todayFinancialReport.report.profitMargin.toFixed(2)}%
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Ventas Totales:</span>
                  <span className="summary-value">{todayFinancialReport.summary.totalSales}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección de Ventas Diarias */}
        <div className="admin-section">
          <div className="section-header">
            <h2 className="section-title">VENTAS DEL DÍA</h2>
            <button 
              className="refresh-button" 
              onClick={fetchTodaySales}
              disabled={loadingToday}
            >
              {loadingToday ? '🔄' : '🔄'}
            </button>
          </div>

          {loadingToday ? (
            <div className="loading-message">Cargando ventas del día...</div>
          ) : error ? (
            <div className="error-message">
              {error}
              <button onClick={fetchTodaySales} className="retry-button">
                Reintentar
              </button>
            </div>
          ) : todaySales ? (
            <div className="sales-summary">
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="card-label">TOTAL VENTAS</div>
                  <div className="card-value">{todaySales.summary.totalSales}</div>
                </div>
                <div className="summary-card">
                  <div className="card-label">MONTO TOTAL</div>
                  <div className="card-value">${todaySales.summary.totalAmount.toFixed(2)}</div>
                </div>
                <div className="summary-card">
                  <div className="card-label">ITEMS VENDIDOS</div>
                  <div className="card-value">{todaySales.summary.totalItems}</div>
                </div>
              </div>

              {todaySales.sales.length > 0 ? (
                <div className="sales-list">
                  <div className="sales-list-header">
                    <div className="list-header-cell">ID</div>
                    <div className="list-header-cell">FECHA</div>
                    <div className="list-header-cell">MONTO</div>
                    <div className="list-header-cell">ITEMS</div>
                  </div>
                  {todaySales.sales.map((sale) => (
                    <div key={sale.Id} className="sales-list-item">
                      <div className="list-item-cell">{sale.Id}</div>
                      <div className="list-item-cell">
                        {new Date(sale.CreatedAt).toLocaleString('es-AR')}
                      </div>
                      <div className="list-item-cell">${parseFloat(sale.Amount).toFixed(2)}</div>
                      <div className="list-item-cell">{sale.itemTickets?.length || 0}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-message">No hay ventas registradas hoy</div>
              )}
            </div>
          ) : null}
        </div>

        {/* Sección de Reporte Financiero del Mes */}
        {monthFinancialReport && !loadingMonthReport && (
          <div className="admin-section financial-report-section monthly">
            <div className="section-header">
              <h2 className="section-title">REPORTE FINANCIERO - MES ACTUAL</h2>
              <button 
                className="refresh-button" 
                onClick={fetchMonthFinancialReport}
                disabled={loadingMonthReport}
              >
                {loadingMonthReport ? '🔄' : '🔄'}
              </button>
            </div>

            <div className="financial-report">
              <div className="financial-cards">
                <div className="financial-card revenue">
                  <div className="card-label">TOTAL GANADO</div>
                  <div className="card-value">${monthFinancialReport.report.totalRevenue.toFixed(2)}</div>
                </div>
                <div className="financial-card invested">
                  <div className="card-label">TOTAL INVERTIDO</div>
                  <div className="card-value">${monthFinancialReport.report.totalInvested.toFixed(2)}</div>
                </div>
                <div className="financial-card profit">
                  <div className="card-label">GANANCIA REAL</div>
                  <div className="card-value">${monthFinancialReport.report.realProfit.toFixed(2)}</div>
                </div>
                <div className="financial-card reinvestment">
                  <div className="card-label">REINVERSIÓN NECESARIA</div>
                  <div className="card-value">${monthFinancialReport.report.totalReinvestment.toFixed(2)}</div>
                </div>
              </div>
              
              <div className="financial-summary">
                <div className="summary-item">
                  <span className="summary-label">Margen de Ganancia:</span>
                  <span className="summary-value profit-margin">
                    {monthFinancialReport.report.profitMargin.toFixed(2)}%
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Ventas Totales:</span>
                  <span className="summary-value">{monthFinancialReport.summary.totalSales}</span>
                </div>
                <div className="summary-item full-width">
                  <span className="summary-label">Período:</span>
                  <span className="summary-value">
                    Desde {monthFinancialReport.periodStart} hasta hoy
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección de Ventas Mensuales */}
        <div className="admin-section">
          <div className="section-header">
            <h2 className="section-title">VENTAS DEL MES</h2>
            <button 
              className="load-button"
              onClick={fetchMonthSales}
              disabled={loadingMonth}
            >
              {loadingMonth ? 'CARGANDO...' : 'CARGAR VENTAS DEL MES'}
            </button>
          </div>

          {loadingMonth && (
            <div className="loading-message">Cargando ventas del mes...</div>
          )}

          {error && !loadingMonth && (
            <div className="error-message">
              {error}
              <button onClick={fetchMonthSales} className="retry-button">
                Reintentar
              </button>
            </div>
          )}

          {monthSales && !loadingMonth && (
            <div className="sales-summary">
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="card-label">TOTAL VENTAS</div>
                  <div className="card-value">{monthSales.summary.totalSales}</div>
                </div>
                <div className="summary-card">
                  <div className="card-label">MONTO TOTAL</div>
                  <div className="card-value">${monthSales.summary.totalAmount.toFixed(2)}</div>
                </div>
                <div className="summary-card">
                  <div className="card-label">ITEMS VENDIDOS</div>
                  <div className="card-value">{monthSales.summary.totalItems}</div>
                </div>
              </div>

              <div className="month-range">
                <span>Período: {monthSales.summary.monthStart} - {monthSales.summary.monthEnd}</span>
              </div>

              {monthSales.summary.salesByDay && monthSales.summary.salesByDay.length > 0 && (
                <div className="sales-by-day">
                  <h3 className="subsection-title">Ventas por Día</h3>
                  <div className="sales-by-day-list">
                    <div className="sales-by-day-header">
                      <div className="day-header-cell">FECHA</div>
                      <div className="day-header-cell">VENTAS</div>
                      <div className="day-header-cell">MONTO</div>
                    </div>
                    {monthSales.summary.salesByDay.map((day, index) => (
                      <div key={index} className="sales-by-day-item">
                        <div className="day-item-cell">{day.date}</div>
                        <div className="day-item-cell">{day.count}</div>
                        <div className="day-item-cell">${day.amount.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {monthSales.sales.length > 0 ? (
                <div className="sales-list">
                  <div className="sales-list-header">
                    <div className="list-header-cell">ID</div>
                    <div className="list-header-cell">FECHA</div>
                    <div className="list-header-cell">MONTO</div>
                    <div className="list-header-cell">ITEMS</div>
                  </div>
                  {monthSales.sales.map((sale) => (
                    <div key={sale.Id} className="sales-list-item">
                      <div className="list-item-cell">{sale.Id}</div>
                      <div className="list-item-cell">
                        {new Date(sale.CreatedAt).toLocaleString('es-AR')}
                      </div>
                      <div className="list-item-cell">${parseFloat(sale.Amount).toFixed(2)}</div>
                      <div className="list-item-cell">{sale.itemTickets?.length || 0}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-message">No hay ventas registradas este mes</div>
              )}
            </div>
          )}
        </div>

        {/* Sección de Productos con Stock Bajo */}
        <div className="admin-section">
          <div className="section-header">
            <h2 className="section-title">PRODUCTOS CON STOCK BAJO (&lt; 5)</h2>
            <button 
              className="refresh-button" 
              onClick={fetchLowStockProducts}
              disabled={loadingLowStock}
            >
              {loadingLowStock ? '🔄' : '🔄'}
            </button>
          </div>

          {loadingLowStock ? (
            <div className="loading-message">Cargando productos con stock bajo...</div>
          ) : error ? (
            <div className="error-message">
              {error}
              <button onClick={fetchLowStockProducts} className="retry-button">
                Reintentar
              </button>
            </div>
          ) : lowStockProducts && lowStockProducts.length > 0 ? (
            <div className="low-stock-container">
              <div className="low-stock-summary">
                <div className="summary-badge">
                  {lowStockProducts.length} producto{lowStockProducts.length !== 1 ? 's' : ''} con stock bajo
                </div>
              </div>

              <div className="low-stock-list">
                <div className="low-stock-header">
                  <div className="stock-header-cell">ID</div>
                  <div className="stock-header-cell">NOMBRE</div>
                  <div className="stock-header-cell">DESCRIPCIÓN</div>
                  <div className="stock-header-cell stock-column">STOCK</div>
                  <div className="stock-header-cell">P. PÚBLICO</div>
                </div>
                {lowStockProducts.map((product) => (
                  <div 
                    key={product.Id} 
                    className={`low-stock-item ${product.Stock === 0 ? 'out-of-stock' : ''}`}
                  >
                    <div className="stock-item-cell">{product.Id}</div>
                    <div className="stock-item-cell stock-name">{product.Name}</div>
                    <div className="stock-item-cell">{product.Description || '-'}</div>
                    <div className={`stock-item-cell stock-value ${product.Stock === 0 ? 'zero-stock' : 'low-stock'}`}>
                      {product.Stock}
                    </div>
                    <div className="stock-item-cell">${product.AmountToSale}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-message">
              ✅ Todos los productos tienen stock suficiente (&ge; 5 unidades)
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminView

