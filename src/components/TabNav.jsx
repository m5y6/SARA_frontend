export function TabNav({ tabs, activeTab, onChange }) {
  return (
    <nav className="tab-nav" aria-label="Navegación principal">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-link${activeTab === tab.id ? ' is-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}