"use client";

import { LoadingState } from "../../../components/loading-state";

type InspectionErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function InspectionError({ error, reset }: InspectionErrorProps) {
  return (
    <main className="page-shell">
      <LoadingState
        variant="error"
        title="No fue posible cargar la inspección"
        description={error.message || "Ocurrió un error inesperado. Inténtalo nuevamente."}
        onRetry={reset}
      />
    </main>
  );
}