import { useState } from 'react';

export function App() {
  const [activePage, setActivePage] = useState<string>('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <nav className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">Connect</h1>
          <p className="text-sm text-gray-500">Healthcare Integration</p>
        </div>

        <ul className="space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'sources', label: 'Sources' },
            { id: 'pipelines', label: 'Pipelines' },
            { id: 'mappings', label: 'Mappings' },
            { id: 'messages', label: 'Messages' },
            { id: 'destinations', label: 'Destinations' },
            { id: 'data', label: 'Data Explorer' },
            { id: 'settings', label: 'Settings' },
          ].map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActivePage(item.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  activePage === item.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main content */}
      <main className="ml-64 p-8">
        <div className="max-w-7xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 capitalize">{activePage}</h2>

          {activePage === 'dashboard' && <DashboardPage />}
          {activePage !== 'dashboard' && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
              <p className="text-lg">{activePage} — coming soon</p>
              <p className="text-sm mt-2">This page is under development.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function DashboardPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: 'Messages Today', value: '—', sub: 'Awaiting first pipeline' },
        { label: 'Success Rate', value: '—', sub: 'No data yet' },
        { label: 'Avg Latency', value: '—', sub: 'No data yet' },
        { label: 'Active Pipelines', value: '0', sub: 'Create your first pipeline' },
      ].map((card) => (
        <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">{card.label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
          <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
