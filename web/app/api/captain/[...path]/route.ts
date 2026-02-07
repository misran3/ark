const CAPTAIN_API =
  'https://three-years-doubt.loca.lt/api/captain';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const target = `${CAPTAIN_API}/${path.join('/')}`;

  const body = await request.text();

  const res = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body } : {}),
  });

  const data = await res.text();

  return new Response(data, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
