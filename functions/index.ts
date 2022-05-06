export const onRequestGet: PagesFunction<{ CBSK: string }> = async ({ request, next, env }) => {
  const { cf } = request;
  const { city, regionCode, country } = cf;

  const { readable, writable } = new TransformStream();
  async function t2() {
      const writer = writable.getWriter();
      writer.write(new TextEncoder().encode("streamed content"));
      writer.close();
  }
  
  const response = new HTMLRewriter()
    .on("span.country", { async element(el) { el.setInnerContent(`${city}, ${regionCode}, ${country}`) } })
    .on("#regulations .tick", { async element(el) { el.setInnerContent(`Regulatory compliance alerts for ${country} available. Access alerts ➞`) } })
    .on("#test", { 
      async element(el) { 
        el.setInnerContent(readable);
      } 
    })
    .transform(await next());

  t2();

  //const { readable, writable } = new TransformStream();
  //async function t() {
  //  await response.body.pipeTo(writable, { preventClose: true });
  //  const writer = writable.getWriter();
  //  writer.write(new TextEncoder().encode(`<script>const el = document.getElementById("test"); el.textContent = "melt";</script>`));
  //  writer.close();
  //}

  //t();

  clearbit(env.CBSK, "74.64.207.161")//request.headers.get("CF-Connecting-IP"))
    .then(onfulfilled => console.log(onfulfilled.company.name))
    .catch(onrejected => console.log(onrejected));

  return response;
  //return new Response(readable, response);
};

async function clearbit(key: string, ipaddr: string): Promise<Reveal | null> {
  const endpoint = "https://reveal.clearbit.com/v1/companies/find?ip=";
  return fetch(endpoint + ipaddr, { headers: { "Authorization": `Bearer ${key}` } }).then(response => {
    return new Promise((resolve, reject) => response.ok ? resolve(response.json<Reveal>()) : reject(response.statusText))
  });
}

function streamFulfilled(): string {
  return `<script></script>`;
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
