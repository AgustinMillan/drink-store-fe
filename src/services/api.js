import axios from 'axios'
const API_BASE_URL = 'http://vps28235.dreamhostps.com:8120/api'

class ApiService {
  async get(url) {
    try {
      const response = await axios.get(`${API_BASE_URL}${url}`)
      return response.data
    } catch (error) {
      console.error('Error en GET:', error)
      return { success: false, error: error.response.data.error }
    }
  }

  async post(url, body) {
    try {
      const response = await axios.post(`${API_BASE_URL}${url}`, body)
      return response.data
    } catch (error) {
      console.error('Error en POST:', error)
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Error de conexión'
      return { success: false, error: errorMessage }
    }
  }

  async put(url, body) {
    try {
      const response = await axios.put(`${API_BASE_URL}${url}`, body)
      return response.data
    } catch (error) {
      console.error('Error en PUT:', error)
      return { success: false, error: error.message }
    }
  }

  async delete(url) {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error en DELETE:', error)
      return { success: false, error: error.message }
    }
  }
}

export const apiService = new ApiService()

// Endpoints específicos para productos
export const productApi = {
  getAll: () => apiService.get('/products'),
  getById: (id) => apiService.get(`/products/${id}`),
  getLowStock: (threshold = 5) => apiService.get(`/products/low-stock?threshold=${threshold}`),
  create: (productData) => apiService.post('/products', productData),
  update: (id, productData) => apiService.put(`/products/${id}`, productData),
  delete: (id) => apiService.delete(`/products/${id}`),
  bulkUpdatePrices: () => apiService.post('/products/bulk-update-prices'),
  getBestPrice: () => apiService.get('/products/best-price')
}

// Endpoints específicos para proveedores
export const supplierApi = {
  getAll: () => apiService.get('/suppliers'),
  getById: (id) => apiService.get(`/suppliers/${id}`),
  create: (supplierData) => apiService.post('/suppliers', supplierData),
  update: (id, supplierData) => apiService.put(`/suppliers/${id}`, supplierData),
  delete: (id) => apiService.delete(`/suppliers/${id}`)
}

// Endpoints específicos para precios de proveedor-producto
export const supplierProductPriceApi = {
  getAll: () => apiService.get('/supplier-product-prices'),
  getById: (id) => apiService.get(`/supplier-product-prices/${id}`),
  getBySupplierId: (id) => apiService.get(`/supplier-product-prices/supplier/${id}`),
  getByProductId: (id) => apiService.get(`/supplier-product-prices/product/${id}`),
  create: (priceData) => apiService.post('/supplier-product-prices', priceData),
  update: (id, priceData) => apiService.put(`/supplier-product-prices/${id}`, priceData),
  delete: (id) => apiService.delete(`/supplier-product-prices/${id}`)
}

// Endpoints específicos para ventas
export const saleApi = {
  getAll: () => apiService.get('/sales'),
  getById: (id) => apiService.get(`/sales/${id}`),
  getToday: () => apiService.get('/sales/today'),
  getCurrentMonth: () => apiService.get('/sales/current-month'),
  getTodayFinancialReport: () => apiService.get('/sales/financial-report/today'),
  getCurrentMonthFinancialReport: () => apiService.get('/sales/financial-report/current-month'),
  create: (saleData) => apiService.post('/sales', saleData),
  createWithItems: (saleData) => apiService.post('/sales/with-items', saleData),
  update: (id, saleData) => apiService.put(`/sales/${id}`, saleData),
  delete: (id) => apiService.delete(`/sales/${id}`)
}

