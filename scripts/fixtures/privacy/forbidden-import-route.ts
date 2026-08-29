import { readManagedResult } from "./forbidden-import-helper";

export function POST(): Response {
  return new Response(String(readManagedResult()));
}
