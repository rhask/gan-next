class ClearbitHandler implements HTMLRewriterElementContentHandlers {
  async element(element: Element): Promise<void> {
    setTimeout(() => 3000);
    element.setInnerContent("holy hell");
  }
}

export const onRequestGet: PagesFunction = async ({ request, next }) => {
  const { cf } = request;
  const { city, regionCode, country } = cf;

  const response = new HTMLRewriter()
    .on("span.country", { element(el) { el.setInnerContent(`${city}, ${regionCode}, ${country}`) } })
    .on("#regulations .tick", { element(el) { el.setInnerContent(`Regulatory compliance alerts for ${country} available. Access alerts ➞`) } })
    .on("#test", new ClearbitHandler())
    .transform(await next());

  return response;
};
