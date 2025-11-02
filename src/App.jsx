import { useState } from 'react'
import Layout from './components/Layout'
import SaleView from './views/SaleView'
import StockView from './views/StockView'
import SuppliersView from './views/SuppliersView'
import AdminView from './views/AdminView'
import './style.css'

function App() {
  const [currentView, setCurrentView] = useState('sale')

  const renderView = () => {
    switch (currentView) {
      case 'sale':
        return <SaleView />
      case 'stock':
        return <StockView />
      case 'suppliers':
        return <SuppliersView />
      case 'admin':
        return <AdminView />
      default:
        return <SaleView />
    }
  }

  return (
    <Layout activeView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  )
}

export default App
