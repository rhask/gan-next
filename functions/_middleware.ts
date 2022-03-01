export const onRequestGet: PagesFunction = async ({ request, next }) => {
  const { cf } = request;
  const { city, regionCode, country } = cf;
  const response = await next();

  return new HTMLRewriter()
    .on("span.country", { element(el) { el.setInnerContent(`${city}, ${regionCode}, ${country}`) } })
    .on("#regulations .tick", { element(el) { el.setInnerContent(`Regulatory compliance alerts for ${country} available. Access alerts ➞`) } })
    .transform(response);
};
