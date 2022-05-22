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
<<<<<<< HEAD
function streamFulfilled2<T>(format: (t: T) => string): (id: string, t: T) => string {
  return (id: string, t: T) => {
    const rows = format(t);

    const genRow = (key: string, value?: string) => 
      `<tr><td style="color: #ef323d">${key}</td><td style="font-weight: normal">${value}</td></tr>`;

    const rand = crypto.randomUUID().slice(0, 7);
    const genScript = (str: string) => `<script>
      const id_${rand} = JSON.stringify(${str}, null, 2);
      document.getElementById("${id}").innerHTML = '<li class="tick hidden" style="padding: unset; font-family: monospace; font-weight: unset; font-size: 13px;"><table style="width: 100%; border-spacing: unset;">' + id_${rand} + '</table></li>';
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
=======
>>>>>>> 8644599 (mcp)
