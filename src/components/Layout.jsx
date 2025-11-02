import BottomNavbar from './BottomNavbar'
import './Layout.css'

function Layout({ children, activeView, onViewChange }) {
  return (
    <div className="layout">
      <main className="layout-content">
        {children}
      </main>
      <BottomNavbar activeView={activeView} onViewChange={onViewChange} />
    </div>
  )
}

export default Layout

