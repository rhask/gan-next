export const onRequestGet: PagesFunction<{ CBSK: string, LFSK: string, KFSK: string }> = async ({ request, next, env }) => {
  const { cf } = request;
  const { city, regionCode, country } = { ...cf };
  const ipaddr = "74.64.207.161" || request.headers.get("CF-Connecting-IP");
  const response = await next();

  const transformed = new HTMLRewriter()
    .on("span.country", { element(el) { el.setInnerContent(`${city}, ${regionCode}, ${country}`); } })
    .on("#regulations .tick:first-of-type", { element(el) { el.setInnerContent(`Regulatory compliance alerts for ${country} available. Access alerts ➞`); } })
    .onDocument({
      async end(end) { 
        const id = "p1";
        const script = await clearbit(env.CBSK, ipaddr)
          .then(f => streamFulfilledNoOp(f, id))
          .catch(r => streamRejected(r, id));
        end.append(script, { html: true }); 
      }
    })
    .onDocument({
      async end(end) { 
        const id = "p2";
        const script = await leadfeeder(env.LFSK, ipaddr)
          .then(f => streamFulfilledNoOp(f, id))
          .catch(r => streamRejected(r, id));
        end.append(script, { html: true }); 
      }
    })
    //.onDocument({
    //  async end(end) { 
    //    const id = "p3";
    //    const script = await kickfire(env.KFSK, ipaddr)
    //      .then(f => streamFulfilledK(f, id))
    //      .catch(r => streamRejected(r, id));
    //    end.append(script, { html: true }); 
    //  }
    //})
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
    console.log(url);
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

function streamFulfilled<T>(format: (t: T) => Record<string, any>): (id: string, t: T) => string {
  return (id: string, t: T) => {
    const rows = Object.entries(format(t));

    const genRow = (key: string, value?: string) => 
      `<tr><td style="color: #ef323d">${key}</td><td style="font-weight: normal">${value}</td></tr>`;

    const genScript = (str: string) => `<script>
      document.getElementById("${id}").innerHTML = '<li class="tick hidden" style="padding: unset"><table style="width: 100%; border-spacing: unset";>${str}</table></li>';
    </script>`;
    
    return genScript(rows.map(value => genRow(value[0], value[1])).reduce((prev, current) => prev.concat(current)));
    //return rows.every((value): value is [string, string] => value[0] !== null && value[1] !== null) 
    //  ? genScript(rows.map(value => genRow(value[0], value[1])).reduce((prev, current) => prev.concat(current)))
    //  : streamRejected("incomplete result");
  }
}
function streamFulfilled2<T>(format: (t: T) => string): (id: string, t: T) => string {
  return (id: string, t: T) => {
    const rows = format(t);

    const genRow = (key: string, value?: string) => 
      `<tr><td style="color: #ef323d">${key}</td><td style="font-weight: normal">${value}</td></tr>`;

    const genScript = (str: string) => `<script>
      const json = JSON.stringify(${str}, null, 2);
      document.getElementById("${id}").innerHTML = '<li class="tick hidden" style="padding: unset; font-family: monospace; font-weight: unset; font-size: 13px;"><table style="width: 100%; border-spacing: unset;">'+json+'</table></li>';
    </script>`;
    
    return genScript(rows);
    //return rows.every((value): value is [string, string] => value[0] !== null && value[1] !== null) 
    //  ? genScript(rows.map(value => genRow(value[0], value[1])).reduce((prev, current) => prev.concat(current)))
    //  : streamRejected("incomplete result");
  }
}

const streamFulfilledNoOp = (obj: any, id: string) => streamFulfilled2((obj: any) => {
  return JSON.stringify(obj);
})(id, obj);

const streamFulfilledC = <T extends Clearbit>(cb: T, id: string) => streamFulfilled((cb: T) => {
  return {
    Company: cb.company?.name,
    Sector: cb.company?.category.sector,
    Industry: cb.company?.category.industry,
    "SIC Code": cb.company?.category.sicCode,
  }
})(id, cb);

const streamFulfilledL = <T extends Leadfeeder>(lf: T, id: string) => streamFulfilled((lf: T) => {
  return {
    Company: lf.company?.name,
    Domain: lf.company?.domain,
    "SIC Code": lf.company?.industries.sic[0],
    "Employee Count": `${lf.company?.employees_range.min} - ${lf.company?.employees_range.max}`,
  }
})(id, lf);

const streamFulfilledK = <T extends Kickfire>(kf: T, id: string) => streamFulfilled((kf: T) => {
  return {
    Company: kf.data?.at(0)?.companyName,
    Domain: kf.data?.at(0)?.website,
    "SIC Code": kf.data?.at(0)?.sicCode,
    "Employee Count": kf.data?.at(0)?.employees,
  }
})(id, kf);

function streamRejected(rejected: string, id: string): string {
  return `<script>
    document.getElementById("${id}").innerHTML = '<li class="tick hidden" style="padding: unset">Query failure (${rejected}).</li>'
  </script>`;
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
