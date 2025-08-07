import { useQuery } from 'react-query'
import { 
  IdentificationIcon, 
  ShieldCheckIcon, 
  ClockIcon,
  QrCodeIcon 
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import { credentialService } from '../services/credentialService'
import { accessLogService } from '../services/accessLogService'

function StatCard({ title, value, icon: Icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`p-3 rounded-md ${colorClasses[color]}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="text-lg font-medium text-gray-900">{value}</dd>
          </dl>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()

  const { data: credentials, isLoading: credentialsLoading } = useQuery(
    ['credentials', user?.employeeId],
    () => credentialService.getMyCredentials(),
    { enabled: !!user?.employeeId }
  )

  const { data: accessLogs, isLoading: logsLoading } = useQuery(
    ['access-logs', user?.employeeId],
    () => accessLogService.getMyAccessLogs(10),
    { enabled: !!user?.employeeId }
  )

  const activeCredentials = credentials?.filter(c => c.status === 'active') || []
  const recentAccess = accessLogs?.slice(0, 5) || []

  const stats = [
    {
      title: 'Active Credentials',
      value: activeCredentials.length,
      icon: IdentificationIcon,
      color: 'blue'
    },
    {
      title: 'Verified Today',
      value: accessLogs?.filter(log => {
        const today = new Date().toDateString()
        return new Date(log.timestamp).toDateString() === today && log.success
      }).length || 0,
      icon: ShieldCheckIcon,
      color: 'green'
    },
    {
      title: 'Expiring Soon',
      value: activeCredentials.filter(c => {
        const expirationDate = new Date(c.expirationDate)
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        return expirationDate <= thirtyDaysFromNow
      }).length,
      icon: ClockIcon,
      color: 'yellow'
    }
  ]

  if (credentialsLoading || logsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your digital identity and access credentials
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Credentials */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">My Credentials</h3>
            <a href="/credentials" className="text-sm text-blue-600 hover:text-blue-500">
              View all
            </a>
          </div>
          
          <div className="space-y-3">
            {activeCredentials.length > 0 ? (
              activeCredentials.slice(0, 3).map((credential) => (
                <div key={credential.credentialId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {credential.type?.includes('EmployeeCredential') ? 'Employee ID' : 'Access Credential'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Issued: {new Date(credential.issuanceDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No credentials found</p>
            )}
          </div>
        </div>

        {/* Recent Access */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Access</h3>
            <a href="/access-requests" className="text-sm text-blue-600 hover:text-blue-500">
              View all
            </a>
          </div>
          
          <div className="space-y-3">
            {recentAccess.length > 0 ? (
              recentAccess.map((log, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{log.verifierApp}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      log.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {log.success ? 'Granted' : 'Denied'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent access logs</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/credentials"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <IdentificationIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">View Credentials</p>
              <p className="text-sm text-gray-500">Manage your digital IDs</p>
            </div>
          </a>
          
          <a
            href="/qr-scanner"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <QrCodeIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Scan QR Code</p>
              <p className="text-sm text-gray-500">Present credentials</p>
            </div>
          </a>
          
          <a
            href="/access-requests"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShieldCheckIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Access History</p>
              <p className="text-sm text-gray-500">View verification logs</p>
            </div>
          </a>
        </div>
      </div>

      {/* DID Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Digital Identity</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Decentralized Identifier (DID)</p>
              <p className="text-sm text-gray-500 font-mono break-all">
                {user?.did || 'Loading...'}
              </p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(user?.did)}
              className="ml-4 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
