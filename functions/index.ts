export const onRequestGet: PagesFunction<{ CBSK: string, LFSK: string, KFSK: string }> = async ({ request, next, env }) => {
  const { cf } = request;
  const { city, regionCode, country } = { ...cf };
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
        
        end.append(script, { html: true }); 
      }
    })
    .onDocument({
      async end(end) { 
        const script = await leadfeeder(env.LFSK, ipaddr)
          .then(streamFulfilledL)
          .catch(streamRejected);
        end.append(script, { html: true }); 
      }
    })
    .transform(response);

  return transformed;
};

function platform<T>(
  urlComp: (key: string, ipaddr: string) => string,
  headersComp?: (key: string) => Record<string, string>
): (key: string, ipaddr: string | null) => Promise<T> {
  return async (key, ipaddr) => {
    if (ipaddr === null) return Promise.reject();
    const url = urlComp(key, ipaddr);
    const headers = headersComp ? { headers: headersComp(key) } : {};
    return fetch(url, headers).then(response => new Promise((resolve, reject) => {
      return response.ok ? resolve(response.json<T>()) : reject(response.status);
    }));
  } 
};

const clearbit = platform<Clearbit>(
  (_, ipaddr) => `https://reveal.clearbit.com/v1/companies/find?ip=${ipaddr}`,
  key => ({ Authorization: `Bearer ${key}` })
);

const leadfeeder = platform<Leadfeeder>(
  (_, ipaddr) => `https://api.lf-discover.com/companies?ip=${ipaddr}`,
  key => ({ "X-API-KEY": key })
);

const kickfire = platform<Kickfire>(
  (key, ipaddr) => `https://api.kickfire.com/v3/company?ip=${ipaddr}&key=${key}`
);

const streamFulfilledC = streamFulfilled<Clearbit>( 
  (clearbit: Clearbit) => {
    return { 
      Company: clearbit.company?.name,
      Sector: clearbit.company?.category.sector,
      Industry: clearbit.company?.category.industry,
      "SIC Code": clearbit.company?.category.sicCode,
    };
  },
  "p1"
);

const streamFulfilledL = streamFulfilled<Leadfeeder>(
  (leadfeeder: Leadfeeder) => {
    return {
      Company: leadfeeder.company?.name,
      Domain: leadfeeder.company?.domain,
      "SIC Code": leadfeeder.company?.industries.sic[0],
      "Employee Count": `${leadfeeder.company?.employees_range.min} - ${leadfeeder.company?.employees_range.max}`,
    };
  },
  "p2"
);

function streamFulfilled<T>(format: (t: T) => Record<string, string | undefined>, id: string): (t: T) => string {
  return (t: T) => {
    const rows = Object.entries(format(t));

    const genRow = (key: string, value?: string) => 
      `<tr><td style="color: #ef323d">${key}</td><td style="font-weight: normal">${value}</td></tr>`;

    const genScript = (str: string) => `<script>
      document.getElementById("${id}").innerHTML = '<li class="tick hidden" style="padding: unset"><table style="width: 100%; border-spacing: unset";>${str}</table></li>';
    </script>`;
    
    return genScript(rows.map(value => genRow(value[0], value[1])).reduce((prev, current) => prev.concat(current)));
  }
  //return rows.every((value): value is [string, string] => value[0] !== null && value[1] !== null) 
  //  ? genScript(rows.map(value => genRow(value[0], value[1])).reduce((prev, current) => prev.concat(current)))
  //  : streamRejected("incomplete result");
}

/*
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
*/

function streamRejected(rejected: string): string {
  return `<script>document.getElementById("p1").innerHTML = '<li class="tick hidden" style="padding: unset">Query failure (${rejected}).</li>'</script>`;
}

type Clearbit = Partial<{
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
}>

type Leadfeeder = Partial<{
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
}>

type Kickfire = Partial<{
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
}>
