import { inspections } from "../lib/data/inspections";

export default function HomePage() {
  return (
    <div className="page-shell" style={{ overflowWrap: "anywhere" }}>
      <section className="hero" aria-labelledby="page-heading">
        <p className="eyebrow">Semana 02 · Inspecciones de mantenimiento</p>
        <h1 id="page-heading">Inspecciones de laboratorio</h1>
        <p className="lead">
          Consulta revisiones de mantenimiento de laboratorios, su estado y las
          observaciones que requieren seguimiento. Todos los datos mostrados son
          sintéticos y se utilizan únicamente con fines académicos.
        </p>
        <p className="status">Demostración de consulta · Sin captura ni edición de inspecciones</p>
      </section>

      <section aria-labelledby="inspections-heading" className="content-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Datos de demostración</p>
            <h2 id="inspections-heading">Inspecciones recientes</h2>
          </div>
          <span className="count">{inspections.length} registros</span>
        </div>

        <div className="inspection-grid">
          {inspections.map((inspection) => (
            <article
              className="inspection-card"
              key={inspection.id}
              aria-labelledby={`${inspection.id}-heading`}
            >
              <div className="card-topline" style={{ flexWrap: "wrap" }}>
                <span className={`badge badge-${inspection.status}`}>
                  {inspection.statusLabel}
                </span>
                <time className="muted" dateTime={inspection.date}>
                  {inspection.date}
                </time>
              </div>
              <h3 id={`${inspection.id}-heading`}>{inspection.location}</h3>
              <p>{inspection.summary}</p>
              <dl>
                <div>
                  <dt>Registro de demostración</dt>
                  <dd>{inspection.id}</dd>
                </div>
                <div>
                  <dt>Hallazgos</dt>
                  <dd>{inspection.findings}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
