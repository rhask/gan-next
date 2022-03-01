export const onRequestGet: PagesFunction = async ({ request, next }) => {
  const { cf } = request;
  const { city, regionCode, country } = cf;
  const response = await next();

  const rewriters = [
    new HTMLRewriter().on('span.country', {
      element(element) { element.setInnerContent(`${city}, ${regionCode}, ${country}`) }
    }),

    new HTMLRewriter().on('#regulations .tick', {
      element(element) { element.setInnerContent(`Regulatory compliance alerts for ${country} available. Access alerts ➞`) }
    })
  ];

  return rewriters.reduce((prev, curr) => curr.transform(prev), response);
};
