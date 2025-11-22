import './BottomNavbar.css'

function BottomNavbar({ activeView, onViewChange }) {
  const buttons = [
    { id: 'sale', label: 'Vender', icon: '💲' },
    { id: 'stock', label: 'Stock', icon: '📦' },
    { id: 'admin', label: 'Administración', icon: '📊' }
  ]

  const handleClick = (buttonId) => {
    if (onViewChange) {
      onViewChange(buttonId)
    }
  }

  return (
    <nav className="bottom-navbar">
      {buttons.map((button) => (
        <button
          key={button.id}
          className={`nav-button ${activeView === button.id ? 'active' : ''}`}
          onClick={() => handleClick(button.id)}
          aria-label={button.label}
        >
          <span className="nav-icon">{button.icon}</span>
          <span className="nav-label">{button.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default BottomNavbar
