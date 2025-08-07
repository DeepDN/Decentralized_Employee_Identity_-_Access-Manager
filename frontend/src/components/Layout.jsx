import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  UsersIcon, 
  IdentificationIcon, 
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Employees', href: '/employees', icon: UsersIcon },
  { name: 'Credentials', href: '/credentials', icon: IdentificationIcon },
  { name: 'Access Logs', href: '/access-logs', icon: ClipboardDocumentListIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen">
      {/* Mobile sidebar */}
      <div className={classNames(
        sidebarOpen ? 'fixed inset-0 z-40 lg:hidden' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col tech-sidebar">
          <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700/50">
            <div className="flex items-center space-x-2">
              <CpuChipIcon className="h-8 w-8 text-blue-400" />
              <h1 className="text-xl font-semibold text-white glow-text">Identity Manager</h1>
            </div>
            <button
              type="button"
              className="text-slate-400 hover:text-white transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={classNames(
                    isActive
                      ? 'bg-blue-600/20 border-blue-400 text-blue-300 neon-glow'
                      : 'border-transparent text-slate-300 hover:bg-slate-700/50 hover:text-white',
                    'nav-item group flex items-center px-3 py-2 text-sm font-medium border-l-4 rounded-r-lg transition-all duration-300'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={classNames(
                      isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300',
                      'mr-3 h-6 w-6 transition-colors'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          
          {/* Repository info */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="text-xs text-slate-400 space-y-1">
              <p className="font-medium">Decentralized Employee Identity</p>
              <p>Developed by <span className="text-blue-400">Deepak Nemade</span></p>
              <a 
                href="https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow tech-sidebar">
          <div className="flex h-16 items-center px-4 border-b border-slate-700/50">
            <div className="flex items-center space-x-2">
              <CpuChipIcon className="h-8 w-8 text-blue-400 pulse-glow" />
              <h1 className="text-xl font-semibold text-white glow-text">Identity Manager</h1>
            </div>
          </div>
          
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={classNames(
                    isActive
                      ? 'bg-blue-600/20 border-blue-400 text-blue-300 neon-glow'
                      : 'border-transparent text-slate-300 hover:bg-slate-700/50 hover:text-white',
                    'nav-item group flex items-center px-3 py-2 text-sm font-medium border-l-4 rounded-r-lg transition-all duration-300'
                  )}
                >
                  <item.icon
                    className={classNames(
                      isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300',
                      'mr-3 h-6 w-6 transition-colors'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          
          {/* Repository info */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="text-xs text-slate-400 space-y-1">
              <p className="font-medium">Decentralized Employee Identity</p>
              <p>Developed by <span className="text-blue-400">Deepak Nemade</span></p>
              <a 
                href="https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="text-slate-400 hover:text-white lg:hidden transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full status-active"></div>
                  <span className="text-sm text-slate-300">System Online</span>
                </div>
              </div>
              <span className="text-sm text-slate-300">
                Welcome, <span className="text-blue-400 font-medium">{user?.name || 'Admin'}</span>
              </span>
              <button
                onClick={logout}
                className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-slate-700/50"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="border-t border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
              <div className="text-sm text-slate-400">
                <span>Decentralized Employee Identity & Access Manager</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-slate-400">
                <span>Developed by <span className="text-blue-400">Deepak Nemade</span></span>
                <a 
                  href="https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
