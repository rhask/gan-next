export const onRequestGet: PagesFunction<{ CBSK: string, LFSK: string, KFSK: string }> = async ({ request, next, env }) => {
  const { cf } = request
  const { city, regionCode, country } = { ...cf }
  const ipaddr = request.headers.get("CF-Connecting-IP")
  const response = await next()

  const transformed = new HTMLRewriter()
    .on("span.country", { element(el) { el.setInnerContent(`${city}, ${regionCode}, ${country}`) } })
    .on("#regulations .tick:first-of-type", { element(el) { el.setInnerContent(`Regulatory compliance alerts for ${country} available. Access alerts ➞`) } })
    .transform(response)

  return transformed
}
