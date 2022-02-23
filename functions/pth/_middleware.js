export async function onRequest({ env, request }) {
  const cf = request.cf;
  return new Response(`${cf.country} / ${cf.regionCode} / ${cf.city}`, { status: 500 });
};
