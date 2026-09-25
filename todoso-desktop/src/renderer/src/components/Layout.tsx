import { Outlet, NavLink } from 'react-router-dom'
import { CheckSquare, Ban, Timer, BarChart, Settings as SettingsIcon } from 'lucide-react'

export function Layout() {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: Timer }, // Maybe use a different icon
    { to: '/tasks', label: 'Tareas', icon: CheckSquare },
    { to: '/blocklist', label: 'Bloqueos', icon: Ban },
    { to: '/stats', label: 'Estadísticas', icon: BarChart },
    { to: '/settings', label: 'Ajustes', icon: SettingsIcon },
  ]

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="h-14 titlebar flex items-center px-4 border-b">
          <span className="font-bold text-lg tracking-tight">toDoSo</span>
        </div>
        <nav className="flex-1 p-4 space-y-2 no-drag overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground font-medium' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background relative">
        <div className="h-10 titlebar w-full absolute top-0 left-0 z-10" />
        <div className="flex-1 overflow-y-auto p-8 pt-12 no-drag">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
