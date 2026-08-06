/* Skeleton de arranque: se muestra en lugar del splash para usuarios
   recurrentes mientras Firebase valida la sesión — percepción de carga
   instantánea (la forma del calendario ya está ahí). */
export default function AppSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando Mavia"
      style={{ maxWidth: 760, margin: '0 auto', padding: '18px 20px', minHeight: '100dvh', boxSizing: 'border-box' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div className="skeleton" style={{ width: 170, height: 26 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="skeleton skeleton-circle" style={{ width: 34, height: 34 }} />
          <div className="skeleton skeleton-circle" style={{ width: 34, height: 34 }} />
        </div>
      </div>
      {/* Segmented */}
      <div className="skeleton" style={{ height: 40, borderRadius: 13, marginBottom: 14 }} />
      {/* Encabezado de días */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 12, borderRadius: 6 }} />
        ))}
      </div>
      {/* Grid del mes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 64 }} />
        ))}
      </div>
    </div>
  );
}
