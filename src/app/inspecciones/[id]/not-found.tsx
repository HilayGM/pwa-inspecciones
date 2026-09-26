import Link from "next/link";

export default function InspectionNotFound() {
  return (
    <main className="page-shell">
      <section className="hero" aria-labelledby="not-found-heading">
        <p className="eyebrow">Error 404</p>
        <h1 id="not-found-heading">Inspección no encontrada</h1>
        <p className="lead">No existe una inspección asociada a este identificador.</p>
      </section>
      <section className="content-section">
        <Link className="inspection-detail-link" href="/inspecciones">
          Volver a inspecciones
        </Link>
      </section>
    </main>
  );
}