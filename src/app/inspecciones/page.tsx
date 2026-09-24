"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LoadingState } from "../../components/loading-state";
import type { Inspection } from "../../lib/data/inspections";

type InspectionResponse = {
  inspections: Inspection[];
};

type RequestState = "loading" | "ready" | "error";

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [requestState, setRequestState] = useState<RequestState>("loading");

  const loadInspections = useCallback(async (signal?: AbortSignal) => {
    setRequestState("loading");

    try {
      const response = await fetch("/api/inspecciones", {
        cache: "no-store",
        signal,
      });

      if (!response.ok) {
        throw new Error(`La consulta respondió con ${response.status}`);
      }

      const payload = (await response.json()) as InspectionResponse;

      if (!Array.isArray(payload.inspections)) {
        throw new Error("La respuesta no contiene una lista de inspecciones");
      }

      setInspections(payload.inspections);
      setRequestState("ready");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error("No se pudieron cargar las inspecciones sintéticas.", error);
      setRequestState("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadInspections(controller.signal);

    return () => controller.abort();
  }, [loadInspections]);

  return (
    <div className="page-shell" style={{ overflowWrap: "anywhere" }}>
      <section className="hero" aria-labelledby="inspections-page-heading">
        <p className="eyebrow">Semana 4 · Renderizado CSR</p>
        <h1 id="inspections-page-heading">Listado de inspecciones</h1>
        <p className="lead">
          Esta ruta carga desde el navegador los registros sintéticos y muestra
          estados explícitos durante la consulta.
        </p>
      </section>

      <section aria-labelledby="recent-inspections-heading" className="content-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Datos sintéticos</p>
            <h2 id="recent-inspections-heading">Inspecciones recientes</h2>
          </div>
          {requestState === "ready" && <span className="count">{inspections.length} registros</span>}
        </div>

        {requestState === "loading" && (
          <LoadingState
            title="Cargando inspecciones"
            description="Consultando los registros sintéticos disponibles."
          />
        )}

        {requestState === "error" && (
          <LoadingState
            variant="error"
            title="No fue posible cargar las inspecciones"
            description="Comprueba tu conexión e inténtalo nuevamente."
            onRetry={() => void loadInspections()}
          />
        )}

        {requestState === "ready" && (
          <div className="inspection-grid">
            {inspections.map((inspection) => (
              <article
                className="inspection-card"
                key={inspection.id}
                aria-labelledby={`${inspection.id}-heading`}
              >
                <div className="card-topline" style={{ flexWrap: "wrap" }}>
                  <span className={`badge badge-${inspection.status}`}>{inspection.statusLabel}</span>
                  <time className="muted" dateTime={inspection.date}>
                    {inspection.date}
                  </time>
                </div>
                <h3 id={`${inspection.id}-heading`}>{inspection.location}</h3>
                <p>{inspection.summary}</p>
                <dl>
                  <div>
                    <dt>Registro</dt>
                    <dd>{inspection.id}</dd>
                  </div>
                  <div>
                    <dt>Hallazgos</dt>
                    <dd>{inspection.findings}</dd>
                  </div>
                </dl>
                <Link className="inspection-detail-link" href={`/inspecciones/${inspection.id}`}>
                  Ver detalle
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
