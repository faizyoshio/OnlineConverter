export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const input = form.get("input") as Blob;
  return new Response(input);
}
