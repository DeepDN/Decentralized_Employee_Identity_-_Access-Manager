import { useQuery } from 'react-query'
import { 
  UsersIcon, 
  IdentificationIcon, 
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CpuChipIcon,
  ServerIcon,
  CloudIcon
} from '@heroicons/react/24/outline'
import { employeeService } from '../services/employeeService'
import { credentialService } from '../services/credentialService'

function StatCard({ title, value, icon: Icon, color = 'blue', trend }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600'
  }

  return (
    <div className="card-dark data-stream">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} neon-glow`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-slate-400 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-bold text-white code-font">{value}</div>
              {trend && (
                <div className={`ml-2 text-sm ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trend > 0 ? '+' : ''}{trend}%
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  )
}

function SystemStatus() {
  return (
    <div className="card-dark">
      <h3 className="text-lg font-medium text-white mb-4 flex items-center">
        <ServerIcon className="h-5 w-5 mr-2 text-blue-400" />
        System Status
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full status-active"></div>
            <span className="text-sm text-slate-300">API Gateway</span>
          </div>
          <span className="text-xs text-green-400 code-font">ONLINE</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full status-active"></div>
            <span className="text-sm text-slate-300">DynamoDB</span>
          </div>
          <span className="text-xs text-green-400 code-font">ONLINE</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full status-active"></div>
            <span className="text-sm text-slate-300">Polygon Network</span>
          </div>
          <span className="text-xs text-green-400 code-font">ONLINE</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full status-pending"></div>
            <span className="text-sm text-slate-300">AWS KMS</span>
          </div>
          <span className="text-xs text-yellow-400 code-font">SYNCING</span>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: employeesData, isLoading: employeesLoading } = useQuery(
    'employees-summary',
    () => employeeService.getEmployees(100),
    { refetchInterval: 30000 }
  )

  const { data: credentialsData, isLoading: credentialsLoading } = useQuery(
    'credentials-summary',
    () => credentialService.getCredentials(),
    { refetchInterval: 30000 }
  )

  const employees = employeesData?.data?.employees || []
  const credentials = credentialsData?.data || []

  const stats = [
    {
      title: 'Total Employees',
      value: employees.length,
      icon: UsersIcon,
      color: 'blue',
      trend: 12
    },
    {
      title: 'Active Credentials',
      value: credentials.filter(c => c.status === 'active').length,
      icon: IdentificationIcon,
      color: 'green',
      trend: 8
    },
    {
      title: 'Verified Today',
      value: credentials.filter(c => {
        const today = new Date().toDateString()
        return new Date(c.lastVerified || 0).toDateString() === today
      }).length,
      icon: ShieldCheckIcon,
      color: 'purple',
      trend: 15
    },
    {
      title: 'Expiring Soon',
      value: credentials.filter(c => {
        const expirationDate = new Date(c.expirationDate)
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        return expirationDate <= thirtyDaysFromNow && c.status === 'active'
      }).length,
      icon: ExclamationTriangleIcon,
      color: 'red',
      trend: -5
    }
  ]

  const recentEmployees = employees
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  const recentCredentials = credentials
    .sort((a, b) => new Date(b.issuanceDate) - new Date(a.issuanceDate))
    .slice(0, 5)

  if (employeesLoading || credentialsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="tech-spinner h-12 w-12"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gradient-border">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <CpuChipIcon className="h-8 w-8 text-blue-400 pulse-glow" />
            <div>
              <h1 className="text-3xl font-bold text-white glow-text">Dashboard</h1>
              <p className="mt-1 text-sm text-slate-400">
                Decentralized Identity Management System Overview
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Employees */}
        <div className="card-dark">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white flex items-center">
              <UsersIcon className="h-5 w-5 mr-2 text-blue-400" />
              Recent Employees
            </h3>
            <a href="/employees" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              View all
            </a>
          </div>
          
          <div className="space-y-3">
            {recentEmployees.length > 0 ? (
              recentEmployees.map((employee) => (
                <div key={employee.employeeId} className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-b-0 holographic">
                  <div>
                    <p className="text-sm font-medium text-white">{employee.name}</p>
                    <p className="text-sm text-slate-400">{employee.department} • {employee.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 code-font">
                      {new Date(employee.createdAt).toLocaleDateString()}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      employee.status === 'active' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {employee.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No employees found</p>
            )}
          </div>
        </div>

        {/* Recent Credentials */}
        <div className="card-dark">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white flex items-center">
              <IdentificationIcon className="h-5 w-5 mr-2 text-green-400" />
              Recent Credentials
            </h3>
            <a href="/credentials" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              View all
            </a>
          </div>
          
          <div className="space-y-3">
            {recentCredentials.length > 0 ? (
              recentCredentials.map((credential) => (
                <div key={credential.credentialId} className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-b-0 holographic">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {credential.type?.includes('EmployeeCredential') ? 'Employee ID' : 'Access Credential'}
                    </p>
                    <p className="text-sm text-slate-400 code-font">
                      ID: {credential.employeeId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 code-font">
                      {new Date(credential.issuanceDate).toLocaleDateString()}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      credential.status === 'active' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : credential.status === 'revoked'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {credential.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No credentials found</p>
            )}
          </div>
        </div>

        {/* System Status */}
        <SystemStatus />
      </div>

      {/* Quick Actions */}
      <div className="card-dark">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <CloudIcon className="h-5 w-5 mr-2 text-purple-400" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <a
            href="/employees?action=create"
            className="flex items-center p-4 border border-slate-700/50 rounded-lg hover:bg-slate-700/30 transition-all duration-300 group neon-glow"
          >
            <UsersIcon className="h-8 w-8 text-blue-400 mr-3 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-sm font-medium text-white">Add Employee</p>
              <p className="text-sm text-slate-400">Create new employee profile</p>
            </div>
          </a>
          
          <a
            href="/credentials?action=issue"
            className="flex items-center p-4 border border-slate-700/50 rounded-lg hover:bg-slate-700/30 transition-all duration-300 group neon-glow"
          >
            <IdentificationIcon className="h-8 w-8 text-green-400 mr-3 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-sm font-medium text-white">Issue Credential</p>
              <p className="text-sm text-slate-400">Create access credentials</p>
            </div>
          </a>
          
          <a
            href="/access-logs"
            className="flex items-center p-4 border border-slate-700/50 rounded-lg hover:bg-slate-700/30 transition-all duration-300 group neon-glow"
          >
            <ShieldCheckIcon className="h-8 w-8 text-purple-400 mr-3 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-sm font-medium text-white">View Logs</p>
              <p className="text-sm text-slate-400">Monitor access activity</p>
            </div>
          </a>
        </div>
      </div>

      {/* Repository Information */}
      <div className="card-dark border border-blue-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Project Information</h3>
            <p className="text-sm text-slate-400 mb-2">
              Decentralized Employee Identity & Access Manager
            </p>
            <p className="text-sm text-slate-400">
              Developed by <span className="text-blue-400 font-medium">Deepak Nemade</span>
            </p>
          </div>
          <div className="text-right">
            <a 
              href="https://github.com/DeepDN/Decentralized_Employee_Identity_-_Access-Manager.git"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
