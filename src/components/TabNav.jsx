export function TabNav({ tabs, activeTab, onChange }) {
  return (
    <nav
      className="relative mt-5 border-b border-ink-600"
      aria-label="Navegación principal"
    >
      <div className="scrollbar-hidden flex gap-6 overflow-x-auto overflow-y-hidden">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className="group relative flex-shrink-0 whitespace-nowrap py-3.5 text-sm font-medium transition-colors"
            >
              <span
                className={
                  isActive
                    ? 'text-white'
                    : 'text-gray-500 transition-colors group-hover:text-gray-300'
                }
              >
                {tab.label}
              </span>

              {/* Indicador activo */}
              <span
                className={`absolute inset-x-0 -bottom-px h-[2px] rounded-full transition-all duration-200 ${
                  isActive ? 'bg-brand-yellow opacity-100' : 'bg-brand-yellow opacity-0'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Fades en los bordes para indicar overflow, típico de UI pulida */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-ink-950 to-transparent sm:hidden" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-ink-950 to-transparent sm:hidden" />
    </nav>
  );
}