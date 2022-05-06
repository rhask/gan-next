export const onRequestGet: PagesFunction<{ CBSK: string, LFSK: string, KFSK: string }> = async ({ request, next, env }) => {
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
        const script = await clearbit(env.CBSK, ipaddr)
          .then(streamFulfilledC)
          .catch(streamRejected);
        
        //const script = await leadfeeder(env.LFSK, ipaddr)
        //  .then(streamFulfilledL)
        //  .catch(streamRejected);
        //end.append(script, { html: true }); 
        
        //const script = await kickfire(env.KFSK, ipaddr)
        //  .then(streamFulfilledK)
        //  .catch(streamRejected);
        
        end.append(script, { html: true }); 
      }
    })
    .transform(response);

  return transformed;
};

async function clearbit(key: string, ipaddr?: string): Promise<Clearbit> {
  if (ipaddr === null) return Promise.reject();
  const url = `https://reveal.clearbit.com/v1/companies/find?ip=${ipaddr}`;
  return fetch(url, { headers: { "Authorization": `Bearer ${key}` } }).then(response => {
    return new Promise((resolve, reject) => response.ok ? resolve(response.json<Clearbit>()) : reject(response.status))
  });
}

async function leadfeeder(key: string, ipaddr?: string): Promise<Leadfeeder> {
  if (ipaddr === null) return Promise.reject();
  const url = `https://api.lf-discover.com/companies?ip=${ipaddr}`;
  return fetch(url, { headers: { "X-API-KEY": key } }).then(response => {
    return new Promise((resolve, reject) => response.ok ? resolve(response.json<Leadfeeder>()) : reject(response.status))
  });
}

async function kickfire(key: string, ipaddr?: string): Promise<Kickfire> {
  if (ipaddr === null) return Promise.reject();
  const url = `https://api.kickfire.com/v3/company?ip=${ipaddr}&key=${key}`;
  return fetch(url).then(response => {
    return new Promise((resolve, reject) => response.ok ? resolve(response.json<Kickfire>()) : reject(response.status))
  });
}

function streamFulfilledC(clearbit: Clearbit): string {
  const rows = Object.entries({ 
    Company: clearbit.company.name,
    Sector: clearbit.company.category.sector,
    Industry: clearbit.company.category.industry,
    "SIC Code": clearbit.company.category.sicCode,
  }).map(value => `<tr><td style="color: #ef323d">${value[0]}</td><td style="font-weight: normal">${value[1]}</td></tr>`);
  return `<script>
    document.getElementById("p1").innerHTML = '<li class="tick hidden" style="padding: unset"><table style="width: 100%; border-spacing: unset";>${rows.join("")}</table></li>';
  </script>`;
}

function streamFulfilledL(leadfeeder: Leadfeeder): string {
  const rows = Object.entries({ 
    Company: leadfeeder.company.name,
    Domain: leadfeeder.company.domain,
    "SIC Code": leadfeeder.company.industries.sic,
    "Employee Count": `${leadfeeder.company.employees_range.min} - ${leadfeeder.company.employees_range.max}`,
  }).map(value => `<tr><td style="color: #ef323d">${value[0]}</td><td style="font-weight: normal">${value[1]}</td></tr>`);
  return `<script>
    document.getElementById("p1").innerHTML = '<li class="tick hidden" style="padding: unset"><table style="width: 100%; border-spacing: unset";>${rows.join("")}</table></li>';
  </script>`;
}

function streamFulfilledK(kickfire: Kickfire): string {
  const rows = Object.entries({ 
    Company: kickfire.data[0].companyName,
    Domain: kickfire.data[0].website,
    "SIC Code": kickfire.data[0].sicCode,
    "Employee Count": kickfire.data[0].employees,
  }).map(value => `<tr><td style="color: #ef323d">${value[0]}</td><td style="font-weight: normal">${value[1]}</td></tr>`);
  return `<script>
    document.getElementById("p1").innerHTML = '<li class="tick hidden" style="padding: unset"><table style="width: 100%; border-spacing: unset";>${rows.join("")}</table></li>';
  </script>`;
}

function streamRejected(rejected: string): string {
  return `<script>document.getElementById("p1").innerHTML = '<li class="tick hidden" style="padding: unset">Clearbit query failure.</li>'</script>`;
}

interface Clearbit {
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

interface Leadfeeder {
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

interface Kickfire {
  data: [
    {
      companyName: string;
      tradeName: string;
      website: string;
      employees: string;
      revenue: string;
      sicGroup: string;
      sicCode: string;
      naicsGroup: string;
      naicsCode: string;
    }
  ];
}
