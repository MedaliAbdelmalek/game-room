interface Env {
  GAME_ROOM_KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const path = new URL(request.url).pathname.replace('/api/kv/', '');

  try {
    switch (path) {
      case 'get':
        return handleGet(request, env.GAME_ROOM_KV);
      case 'set':
        return handleSet(request, env.GAME_ROOM_KV);
      case 'delete':
        return handleDelete(request, env.GAME_ROOM_KV);
      default:
        return new Response('Not Found', { status: 404 });
    }
  } catch (error) {
    console.error('KV Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function handleGet(request: Request, kv: KVNamespace): Promise<Response> {
  const { keys } = await request.json();
  
  if (!Array.isArray(keys)) {
    return new Response(JSON.stringify({ error: 'Invalid request format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results: Record<string, string | null> = {};
  for (const key of keys) {
    results[key] = await kv.get(key);
  }

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleSet(request: Request, kv: KVNamespace): Promise<Response> {
  const { key, value } = await request.json();
  
  if (!key || value === undefined) {
    return new Response(JSON.stringify({ error: 'Missing key or value' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await kv.put(key, value);
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleDelete(request: Request, kv: KVNamespace): Promise<Response> {
  const { keys } = await request.json();
  
  if (!Array.isArray(keys)) {
    return new Response(JSON.stringify({ error: 'Invalid request format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  for (const key of keys) {
    await kv.delete(key);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}