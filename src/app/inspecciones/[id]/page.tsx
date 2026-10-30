import Link from "next/link";
import { notFound } from "next/navigation";
import { inspections } from "../../../lib/data/inspections";
import { validateInspectionId, validateAndSanitizeInspection } from "../../../lib/security";

type InspectionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function InspectionDetailPage({ params }: InspectionPageProps) {
  const { id } = await params;

  if (!validateInspectionId(id).valid) {
    notFound();
  }

  const inspection = inspections.find((item) => item.id === id);

  if (!inspection) {
    notFound();
  }

  const validated = validateAndSanitizeInspection(inspection);
  const safeInspection = validated.valid && validated.data ? validated.data : inspection;

  return (
    <main className="page-shell">
      <section className="hero" aria-labelledby="inspection-heading">
        <p className="eyebrow">Detalle de inspección</p>
        <h1 id="inspection-heading">{safeInspection.location}</h1>
        <p className="lead">{safeInspection.summary}</p>
      </section>

      <section className="content-section" aria-labelledby="inspection-data-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Registro {safeInspection.id}</p>
            <h2 id="inspection-data-heading">Datos de la inspección</h2>
          </div>
          <span className={`badge badge-${safeInspection.status}`}>{safeInspection.statusLabel}</span>
        </div>

        <article className="inspection-card">
          <dl>
            <div>
              <dt>Laboratorio</dt>
              <dd>{safeInspection.location}</dd>
            </div>
            <div>
              <dt>Fecha</dt>
              <dd>
                <time dateTime={safeInspection.date}>{safeInspection.date}</time>
              </dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{safeInspection.statusLabel}</dd>
            </div>
            <div>
              <dt>Hallazgos</dt>
              <dd>{safeInspection.findings}</dd>
            </div>
          </dl>
          <h3>Resumen</h3>
          <p>{safeInspection.summary}</p>
        </article>

        <Link className="inspection-detail-link" href="/inspecciones">
          Volver a inspecciones
        </Link>
      </section>
    </main>
  );
}
