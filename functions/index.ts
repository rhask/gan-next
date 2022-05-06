export const onRequestGet: PagesFunction<{ CBSK: string, LFSK: string }> = async ({ request, next, env }) => {
  const { cf } = request;
  const { city, regionCode, country } = cf;
  const ipaddr = request.headers.get("CF-Connecting-IP");
  console.log(ipaddr);
  const response = await next();

  const transformed = new HTMLRewriter()
    .on("span.country", { element(el) { el.setInnerContent(`${city}, ${regionCode}, ${country}`); } })
    .on("#regulations .tick:first-of-type", { element(el) { el.setInnerContent(`Regulatory compliance alerts for ${country} available. Access alerts ➞`); } })
    .onDocument({
      async end(end) { 
        //const script = await clearbit(env.CBSK, ipaddr)
        //  .then(streamFulfilled)
        //  .catch(streamRejected);
        const script = await leadfeeder(env.LFSK, ipaddr)
          .then(streamFulfilledL)
          .catch(streamRejected);
        end.append(script, { html: true }); 
      }
    })
    .transform(response);

  return transformed;
};

async function clearbit(key: string, ipaddr?: string): Promise<Reveal> {
  if (ipaddr === null) return Promise.reject();
  const endpoint = "https://reveal.clearbit.com/v1/companies/find?ip=";
  return fetch(endpoint + ipaddr, { headers: { "Authorization": `Bearer ${key}` } }).then(response => {
    return new Promise((resolve, reject) => response.ok ? resolve(response.json<Reveal>()) : reject(response.statusText))
  });
}

async function leadfeeder(key: string, ipaddr?: string): Promise<Company> {
  if (ipaddr === null) return Promise.reject();
  const endpoint = "https://api.lf-discover.com/companies?ip=";
  return fetch(endpoint + ipaddr, { headers: { "X-API-KEY": key } }).then(response => {
    return new Promise((resolve, reject) => response.ok ? resolve(response.json<Company>()) : reject(response.statusText))
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

function streamFulfilledL(company: Company): string {
  const rows = Object.entries({ 
    Company: company.company.name,
    Domain: company.company.domain,
    "SIC Code": company.company.industries.sic,
    "Employee Count": `${company.company.employees_range.min} - ${company.company.employees_range.max}`
  }).map(value => `<tr><td style="color: #ef323d">${value[0]}</td><td style="font-weight: normal">${value[1]}</td></tr>`);
  return `<script>
    document.getElementById("p1").innerHTML = '<li class="tick hidden" style="padding: unset"><table style="width: 100%; border-spacing: unset";>${rows.join("")}</table></li>';
  </script>`;
}

function streamRejected(rejected: string): string {
  return `<script>document.getElementById("p1").innerHTML = '<li class="tick hidden" style="padding: unset">Unrecognized visitor (${rejected}).</li>'</script>`;
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

interface Company {
  company: {
    revenue: {
      year: string;
      amount: string;
    };
    domain: string;
    logo_url: string;
    industries: {
      name: string;
      sic: [string];
      naics: [string];
    };
    name: string;
    employees_range: {
      min: string;
      max: string;
    };
  };
}
