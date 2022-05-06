export const onRequestGet: PagesFunction<{ CBSK: string }> = async ({ request, next, env }) => {
  const { cf } = request;
  const { city, regionCode, country } = cf;

  const response = new HTMLRewriter()
    .on("span.country", { async element(el) { el.setInnerContent(`${city}, ${regionCode}, ${country}`) } })
    .on("#regulations .tick:first-of-type", { async element(el) { el.setInnerContent(`Regulatory compliance alerts for ${country} available. Access alerts ➞`) } })
    .transform(await next());

  const { readable, writable } = new TransformStream();
  async function t() {
    await response.body.pipeTo(writable, { preventClose: true });
    const writer = writable.getWriter();
    const ipaddr = request.headers.get("CF-Connecting-IP");
    const html = await clearbit(env.CBSK, ipaddr)
      .then(onfulfilled => streamFulfilled(onfulfilled))
      .catch(_ => `<script>document.getElementById("p1").innerHTML = '<li class="tick hidden" style="padding: unset">Not found: ${ipaddr}</li>'</script>`);
    writer.write(new TextEncoder().encode(html));
    writer.close();
  }

  t();

  return new Response(readable, response);
};

async function clearbit(key: string, ipaddr: string): Promise<Reveal> {
  const endpoint = "https://reveal.clearbit.com/v1/companies/find?ip=";
  return fetch(endpoint + ipaddr, { headers: { "Authorization": `Bearer ${key}` } }).then(response => {
    return new Promise((resolve, reject) => response.ok ? resolve(response.json<Reveal>()) : reject(response.statusText))
  });
}

function streamFulfilled(reveal: Reveal): string {
  const rows = Object.entries({ 
    Company: reveal.company.name,
    Sector: reveal.company.category.sector,
    Industry: reveal.company.category.industry,
    "SIC Code": reveal.company.category.sicCode
  }).map(value => `<tr><td style="color: #ef323d">${value[0]}</td><td style="font-weight: normal">${value[1]}</td></tr>`).join("");
  return `<script>
    document.getElementById("p1").innerHTML = '<li class="tick hidden" style="padding: unset"><table style="width: 100%; border-spacing: unset";>${rows}</table></li>';
  </script>`;
}

function streamRejected() {
}

interface Reveal {
  ip: string;
  domain: string;
  type: string;
  fuzzy: boolean;
  company: {
    name: string;
    legalName: string;
    domain: string;
    category: {
      sector: string;
      industryGroup: string;
      industry: string;
      subIndustry: string;
      sicCode: string;
      naicsCode: string;
    };
    metrics: {
      employees: number;
      employeesRange: string;
      estimatedAnnualRevenue: string;
    };
  };
}
