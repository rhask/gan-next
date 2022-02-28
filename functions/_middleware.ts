export const onRequestGet: PagesFunction = async ({ request, next, env }) => {
  const { cf, url } = request;
  const { city, regionCode, country } = cf;
  const response = await next();
  return new HTMLRewriter().on('span.country', { 
    element(element) { element.setInnerContent(`${city}, ${regionCode}, ${country}`) } 
  }).transform(response);
};
