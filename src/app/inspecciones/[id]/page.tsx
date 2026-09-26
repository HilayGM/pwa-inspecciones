import Link from "next/link";
import { notFound } from "next/navigation";
import { inspections } from "../../../lib/data/inspections";

type InspectionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function InspectionDetailPage({ params }: InspectionPageProps) {
  const { id } = await params;
  const inspection = inspections.find((item) => item.id === id);

  if (!inspection) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className="hero" aria-labelledby="inspection-heading">
        <p className="eyebrow">Detalle de inspección</p>
        <h1 id="inspection-heading">{inspection.location}</h1>
        <p className="lead">{inspection.summary}</p>
      </section>

      <section className="content-section" aria-labelledby="inspection-data-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Registro {inspection.id}</p>
            <h2 id="inspection-data-heading">Datos de la inspección</h2>
          </div>
          <span className={`badge badge-${inspection.status}`}>{inspection.statusLabel}</span>
        </div>

        <article className="inspection-card">
          <dl>
            <div>
              <dt>Laboratorio</dt>
              <dd>{inspection.location}</dd>
            </div>
            <div>
              <dt>Fecha</dt>
              <dd>
                <time dateTime={inspection.date}>{inspection.date}</time>
              </dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{inspection.statusLabel}</dd>
            </div>
            <div>
              <dt>Hallazgos</dt>
              <dd>{inspection.findings}</dd>
            </div>
          </dl>
          <h3>Resumen</h3>
          <p>{inspection.summary}</p>
        </article>

        <Link className="inspection-detail-link" href="/inspecciones">
          Volver a inspecciones
        </Link>
      </section>
    </main>
  );
}