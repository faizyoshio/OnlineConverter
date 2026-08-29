export async function POST(request: Request): Promise<Response> {
  const body = await request.json() as { favoriteCapabilityId?: string; preset?: Record<string, unknown> };
  return Response.json({ favoriteCapabilityId: body.favoriteCapabilityId ?? null, preset: body.preset ?? {} });
}
