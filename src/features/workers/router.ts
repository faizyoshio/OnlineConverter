import { normalizeJobError } from "@/features/jobs/errors";
import type { EngineAdapter } from "./adapter";

export type AdapterLoader = () => Promise<EngineAdapter<Readonly<Record<string, unknown>>>>;

export class EngineRouter {
  private readonly loaders = new Map<string, AdapterLoader>();
  private readonly cache = new Map<string, Promise<EngineAdapter<Readonly<Record<string, unknown>>>>>();

  register(adapterKey: string, loader: AdapterLoader): void {
    if (this.loaders.has(adapterKey)) throw new Error("Duplicate adapter registration");
    this.loaders.set(adapterKey, loader);
  }

  has(adapterKey: string): boolean {
    return this.loaders.has(adapterKey);
  }

  load(adapterKey: string): Promise<EngineAdapter<Readonly<Record<string, unknown>>>> {
    const loader = this.loaders.get(adapterKey);
    if (!loader) return Promise.reject(normalizeJobError({ code: "engine-load-failed", phase: "loading-engine" }));
    const cached = this.cache.get(adapterKey);
    if (cached) return cached;

    const pending = Promise.resolve()
      .then(loader)
      .catch(() => {
        this.cache.delete(adapterKey);
        throw normalizeJobError({ code: "engine-load-failed", phase: "loading-engine" });
      });
    this.cache.set(adapterKey, pending);
    return pending;
  }
}
