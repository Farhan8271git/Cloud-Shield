
import { createElement, useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight,
  Bell, Check, ChevronDown, CircleHelp, Cloud, Database, FileClock,
  FileSearch, Files, Gauge, HardDrive, LayoutDashboard, LockKeyhole,
  Menu, MoreHorizontal, RefreshCw, Search, Settings, Shield,
  ShieldAlert, ShieldCheck, Siren, X
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'
import './App.css'

const navigation = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Threat detection', icon: ShieldAlert, count: '07' },
  { label: 'Incidents', icon: Siren, count: '02' },
  { label: 'Protected files', icon: Files },
  { label: 'Backup management', icon: Database },
  { label: 'Recovery center', icon: RefreshCw },
]

const secondaryNavigation = [
  { label: 'Analytics & reports', icon: Activity },
  { label: 'Audit logs', icon: FileClock },
  { label: 'Settings', icon: Settings },
]

const metrics = [
  {
    label: 'Protected files',
    value: '12,480',
    change: '+4.8%',
    note: 'vs. previous period',
    icon: Files,
    color: 'blue',
    trend: 'up',
  },
  {
    label: 'Threats detected',
    value: '07',
    change: '3 new',
    note: 'in the last 24 hours',
    icon: ShieldAlert,
    color: 'amber',
    trend: 'down',
  },
  {
    label: 'Backup success rate',
    value: '98.6%',
    change: '+1.2%',
    note: 'vs. previous period',
    icon: Database,
    color: 'teal',
    trend: 'up',
  },
  {
    label: 'Open incidents',
    value: '02',
    change: 'Needs review',
    note: 'awaiting investigation',
    icon: AlertTriangle,
    color: 'red',
    trend: 'neutral',
  },
]

const events = [
  { title: 'Unusual file modification rate', asset: 'cloud-storage-01', time: '10:42:18 AM', severity: 'High', status: 'Investigating', color: 'red' },
  { title: 'Backup integrity verification', asset: 'backup-vault-02', time: '10:31:06 AM', severity: 'Info', status: 'Completed', color: 'teal' },
  { title: 'Suspicious file extension detected', asset: 'workstation-04', time: '09:56:42 AM', severity: 'Medium', status: 'Under review', color: 'amber' },
  { title: 'Scheduled backup completed', asset: 'cloud-storage-01', time: '09:30:00 AM', severity: 'Info', status: 'Completed', color: 'teal' },
]

const activityData = [
  { day: '09 Oct', threats: 3, files: 18 },
  { day: '10 Oct', threats: 5, files: 26 },
  { day: '11 Oct', threats: 2, files: 16 },
  { day: '12 Oct', threats: 8, files: 35 },
  { day: '13 Oct', threats: 4, files: 22 },
  { day: '14 Oct', threats: 7, files: 29 },
  { day: '15 Oct', threats: 3, files: 19 },
]

const pageTitles = {
  Overview: ['Security overview', 'Monitor your cloud environment and recovery readiness.'],
  'Threat detection': ['Threat detection', 'Review suspicious activity and detection events.'],
  Incidents: ['Incident management', 'Investigate security incidents and affected assets.'],
  'Protected files': ['Protected files', 'Review monitored files and their protection status.'],
  'Backup management': ['Backup management', 'Monitor backup jobs, storage and verification.'],
  'Recovery center': ['Recovery center', 'Review recovery points and restoration readiness.'],
  'Analytics & reports': ['Analytics & reports', 'Explore security and backup performance.'],
  'Audit logs': ['Audit logs', 'Review recorded security and administrative events.'],
  Settings: ['Settings', 'Manage your workspace preferences and configuration.'],
}

function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge-${tone}`}><span className="badge-dot" />{children}</span>
}

function MetricCard({ metric }) {
  const Icon = metric.icon

  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{metric.label}</span>
        <span className={`metric-icon metric-icon-${metric.color}`}><Icon size={18} /></span>
      </div>
      <div className="metric-value">{metric.value}</div>
      <div className="metric-foot">
        <span className={`metric-change change-${metric.trend}`}>
          {metric.trend === 'up' && <ArrowUpRight size={14} />}
          {metric.trend === 'down' && <ArrowDownRight size={14} />}
          {metric.change}
        </span>
        <span className="metric-note">{metric.note}</span>
      </div>
    </article>
  )
}

function App() {
  const [activePage, setActivePage] = useState('Overview')
  const [timeRange, setTimeRange] = useState('7 days')
  const [search, setSearch] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState('')

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return events
    return events.filter((event) =>
      `${event.title} ${event.asset} ${event.severity} ${event.status}`.toLowerCase().includes(query)
    )
  }, [search])

  const selectPage = (label) => {
    setActivePage(label)
    setSidebarOpen(false)
    setShowNotifications(false)
  }

  const notify = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3000)
  }

  const [pageTitle, pageDescription] = pageTitles[activePage] ?? pageTitles.Overview

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="mobile-overlay" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <button className="brand" onClick={() => selectPage('Overview')} aria-label="Cloud Shield home">
          <span className="brand-mark"><ShieldCheck size={23} strokeWidth={2.1} /></span>
          <span className="brand-copy">
            <span className="brand-name">cloud<span>shield</span></span>
            <span className="brand-caption">CLOUD SECURITY PLATFORM</span>
          </span>
          <button className="sidebar-close" aria-label="Close sidebar" onClick={(event) => { event.stopPropagation(); setSidebarOpen(false) }}><X size={18} /></button>
        </button>

        <div className="workspace">
          <div className="workspace-avatar"><Cloud size={17} /></div>
          <div className="workspace-copy">
            <span>Workspace</span>
            <strong>Personal environment</strong>
          </div>
          <ChevronDown size={15} className="workspace-chevron" />
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
              {navigation.map(({ label, icon: Icon, count }) => (
            <button key={label} className={`nav-item ${activePage === label ? 'nav-item-active' : ''}`} onClick={() => selectPage(label)}>
              {createElement(Icon, { size: 18, strokeWidth: 1.8 })}
              <span>{label}</span>
              {count && <span className={`nav-count ${label === 'Incidents' ? 'nav-count-alert' : ''}`}>{count}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-section-label sidebar-section-spaced">MANAGEMENT</div>
        <nav className="sidebar-nav" aria-label="Management navigation">
          {secondaryNavigation.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activePage === label ? 'nav-item-active' : ''}`} onClick={() => selectPage(label)}>
              {createElement(Icon, { size: 18, strokeWidth: 1.8 })}
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-security">
          <div className="security-icon"><LockKeyhole size={17} /></div>
          <strong>Your data, protected.</strong>
          <p>Keep your recovery points verified and your cloud environment monitored.</p>
          <button onClick={() => selectPage('Recovery center')}>Review recovery <ArrowRight size={14} /></button>
        </div>

        <button className="profile-card" onClick={() => notify('Profile settings are part of the upcoming integration.')}>
          <div className="profile-avatar">FS</div>
          <div className="profile-copy"><strong>Workspace admin</strong><span>Administrator</span></div>
          <MoreHorizontal size={19} />
        </button>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-separator">/</span><strong>{activePage}</strong></div>
          </div>
          <div className="topbar-right">
            <label className="global-search">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events..." aria-label="Search security events" />
              <kbd>/</kbd>
            </label>
            <div className="notification-wrap">
              <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setShowNotifications((value) => !value)}>
                <Bell size={19} /><span className="notification-dot" />
              </button>
              {showNotifications && (
                <div className="notification-popover">
                  <div className="popover-heading"><strong>Notifications</strong><span>2 new</span></div>
                  <div className="notification-entry"><span className="notification-symbol symbol-red"><AlertTriangle size={16} /></span><div><strong>Incident requires review</strong><p>Unusual file activity detected.</p></div></div>
                  <div className="notification-entry"><span className="notification-symbol symbol-teal"><Database size={16} /></span><div><strong>Backup verified</strong><p>Latest integrity check completed.</p></div></div>
                </div>
              )}
            </div>
            <div className="topbar-divider" />
            <span className="environment-status"><span />Demo environment</span>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> SECURITY OPERATIONS</div>
              <h1>{pageTitle}</h1>
              <p>{pageDescription}</p>
            </div>
            <div className="heading-actions">
              <button className="button button-secondary" onClick={() => notify('Demo data refreshed.')}>
                <RefreshCw size={15} /> Refresh
              </button>
              <button className="button button-primary" onClick={() => selectPage('Recovery center')}>
                <RefreshCw size={15} /> Recovery center
              </button>
            </div>
          </div>

          <div className="demo-notice">
            <span className="demo-notice-icon"><CircleHelp size={16} /></span>
            <span><strong>Preview mode</strong> — The figures and events shown here are illustrative demo data, not live security telemetry.</span>
            <button aria-label="Dismiss preview notice" onClick={(event) => event.currentTarget.parentElement.remove()}><X size={16} /></button>
          </div>

          <section className="protection-banner">
            <div className="protection-symbol"><ShieldCheck size={25} /></div>
            <div className="protection-copy">
              <div className="protection-title-row"><h2>Protection overview</h2><Badge tone="success">Demo status: healthy</Badge></div>
              <p>Your sample workspace is ready for monitoring. Review open incidents and verify your recovery points.</p>
            </div>
            <div className="protection-meta"><span>WORKSPACE STATUS</span><strong><span className="status-pulse" /> Operational (demo)</strong></div>
            <button className="banner-arrow" aria-label="View threat detection" onClick={() => selectPage('Threat detection')}><ArrowRight size={19} /></button>
          </section>

          <section className="metrics-grid" aria-label="Security metrics">
            {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
          </section>

          <section className="dashboard-grid">
            <article className="panel activity-panel">
              <div className="panel-header">
                <div><h2>Security activity</h2><p>Detection events over time</p></div>
                <label className="select-wrap">
                  <select value={timeRange} onChange={(event) => setTimeRange(event.target.value)} aria-label="Chart time range">
                    <option>7 days</option><option>30 days</option><option>90 days</option>
                  </select>
                  <ChevronDown size={14} />
                </label>
              </div>
              <div className="chart-legend"><span><i className="legend-dot legend-threat" /> Threat events</span><span><i className="legend-dot legend-files" /> File activity</span></div>
              <div className="activity-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="threatFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6692ff" stopOpacity={0.22} /><stop offset="95%" stopColor="#6692ff" stopOpacity={0} /></linearGradient>
                      <linearGradient id="fileFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#52c8ba" stopOpacity={0.12} /><stop offset="95%" stopColor="#52c8ba" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e9edf3" strokeDasharray="3 4" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: '#8792a5', fontSize: 11 }} tickLine={false} axisLine={false} dy={10} />
                    <YAxis tick={{ fill: '#8792a5', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ border: '1px solid #e5eaf1', borderRadius: 10, fontSize: 12 }} />
                    <Area type="monotone" dataKey="files" name="File activity" stroke="#52b9ac" strokeWidth={2} fill="url(#fileFill)" />
                    <Area type="monotone" dataKey="threats" name="Threat events" stroke="#6287ed" strokeWidth={2.2} fill="url(#threatFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-footer"><span><Activity size={14} /> Activity is based on sample events</span><button onClick={() => selectPage('Analytics & reports')}>View analytics <ArrowRight size={14} /></button></div>
            </article>

            <article className="panel backup-panel">
              <div className="panel-header"><div><h2>Backup health</h2><p>Sample recovery readiness</p></div><button className="icon-button subtle-icon" aria-label="Backup options" onClick={() => notify('Backup settings will be connected to the backend later.')}><MoreHorizontal size={19} /></button></div>
              <div className="backup-score">
                <div className="score-ring"><div><strong>98.6<span>%</span></strong><small>Success rate</small></div></div>
                <div className="backup-score-copy"><Badge tone="success">Healthy (demo)</Badge><p>Sample backup performance for the selected reporting period.</p></div>
              </div>
              <div className="backup-stats">
                <div><span><i className="mini-dot dot-green" />Successful jobs</span><strong>286</strong></div>
                <div><span><i className="mini-dot dot-amber" />Failed jobs</span><strong>04</strong></div>
                <div><span><i className="mini-dot dot-blue" />Storage used</span><strong>64.2 GB</strong></div>
              </div>
              <div className="last-backup"><span className="last-backup-icon"><HardDrive size={17} /></span><div><span>Last successful backup</span><strong>Today, 09:30 AM <span className="verified-check"><Check size={11} /></span></strong></div><Badge tone="success">Sample</Badge></div>
              <button className="text-link backup-link" onClick={() => selectPage('Backup management')}>View backup management <ArrowRight size={14} /></button>
            </article>
          </section>

          <section className="panel events-panel">
            <div className="panel-header events-heading">
              <div><h2>Recent security events</h2><p>Latest entries from the sample event feed</p></div>
              <button className="button button-secondary button-small" onClick={() => selectPage('Threat detection')}>View all events <ArrowRight size={14} /></button>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>EVENT</th><th>AFFECTED ASSET</th><th>TIME</th><th>SEVERITY</th><th>STATUS</th><th aria-label="Actions" /></tr></thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={`${event.title}-${event.time}`}>
                      <td><div className="event-title-cell"><span className={`event-icon event-icon-${event.color}`}>{event.color === 'red' ? <ShieldAlert size={16} /> : event.color === 'amber' ? <FileSearch size={16} /> : <ShieldCheck size={16} />}</span><span>{event.title}</span></div></td>
                      <td><code>{event.asset}</code></td>
                      <td className="event-time">{event.time}</td>
                      <td><Badge tone={event.color === 'red' ? 'danger' : event.color === 'amber' ? 'warning' : 'info'}>{event.severity}</Badge></td>
                      <td><span className={`status-text status-${event.color}`}><span />{event.status}</span></td>
                      <td><button className="row-action" aria-label={`View ${event.title}`} onClick={() => notify(`Demo event: ${event.title}`)}><ArrowUpRight size={16} /></button></td>
                    </tr>
                  ))}
                  {filteredEvents.length === 0 && <tr><td colSpan="6" className="empty-state">No sample events match “{search}”. Try another search.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>Showing {filteredEvents.length} of {events.length} sample events</span><button onClick={() => setSearch('')}>Clear search <X size={13} /></button></div>
          </section>

          <footer className="page-footer"><span>Cloud-Shield <span className="footer-separator">·</span> Security & recovery workspace</span><span><span className="footer-status-dot" /> Prototype UI <span className="footer-separator">·</span> Not connected to live monitoring</span></footer>
        </div>
      </main>

      {toast && <div className="toast-message"><Check size={17} />{toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15} /></button></div>}
    </div>
  )
}

export default App
