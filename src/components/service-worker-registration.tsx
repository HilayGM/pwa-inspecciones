"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "../lib/pwa/register-service-worker";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    void registerServiceWorker();
  }, []);

  return null;
}