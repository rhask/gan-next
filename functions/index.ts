export const onRequestGet: PagesFunction<{ CBSK: string }> = async ({ request, waitUntil, next, env }) => {
  const { cf } = request;
  const { city, regionCode, country } = cf;
  const ipaddr = request.headers.get("CF-Connecting-IP");
  const response = await next();

  //const transformed = new HTMLRewriter()
  //  .on("span.country", { element(el) { el.setInnerContent(`${city}, ${regionCode}, ${country}`) } })
  //  .on("#regulations .tick:first-of-type", { element(el) { el.setInnerContent(`Regulatory compliance alerts for ${country} available. Access alerts ➞`) } })
  //  .transform(response);

  const { readable, writable } = new TransformStream();
  waitUntil((async () => {
    await response.body.pipeTo(writable, { preventClose: true });
    const writer = writable.getWriter();
    clearbit(env.CBSK, ipaddr)
      .then(onfulfilled => {
        const html = streamFulfilled(onfulfilled);
        writer.write(new TextEncoder().encode(html));
      })
      .catch(onrejected => {
        const html = streamRejected(onrejected);
        writer.write(new TextEncoder().encode(html));
      })
      .finally(() => writer.close());
  })());

  return new Response(readable, response);
};

async function clearbit(key: string, ipaddr?: string): Promise<Reveal> {
  if (ipaddr === null) return Promise.reject();
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
  }).map(value => `<tr><td style="color: #ef323d">${value[0]}</td><td style="font-weight: normal">${value[1]}</td></tr>`);
  return `<script>
    document.getElementById("p1").innerHTML = '<li class="tick hidden" style="padding: unset"><table style="width: 100%; border-spacing: unset";>${rows.join("")}</table></li>';
  </script>`;
}

function streamRejected(rejected: string): string {
  return `<script>document.getElementById("p1").innerHTML = '<li class="tick hidden" style="padding: unset">Not found: ${rejected}</li>'</script>`;
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
