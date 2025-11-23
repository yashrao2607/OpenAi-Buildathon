export async function queryPathway(q: string) {
  const res = await fetch('/api/pathway/query', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ query: q })
  });
  return res.json();
}

