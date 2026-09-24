"use client";

type LoadingStateProps = {
  variant?: "loading" | "error";
  title: string;
  description: string;
  onRetry?: () => void;
};

export function LoadingState({
  variant = "loading",
  title,
  description,
  onRetry,
}: LoadingStateProps) {
  const isError = variant === "error";

  return (
    <section
      className={`loading-state loading-state-${variant}`}
      aria-live={isError ? "assertive" : "polite"}
      aria-busy={!isError}
      role={isError ? "alert" : "status"}
    >
      {!isError && <span className="loading-spinner" aria-hidden="true" />}
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
        {isError && onRetry && (
          <button className="retry-button" type="button" onClick={onRetry}>
            Reintentar
          </button>
        )}
      </div>
    </section>
  );
}
