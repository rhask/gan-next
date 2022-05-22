export const person = query<EnrichParams>("GET", p => `https://person.clearbit.com/v2/people/find?${urlparams(p)}`)
export const personFlag = query<string, PersonFlag>("POST", id => `https://person.clearbit.com/v1/people/${id}/flag`, flag => formdata(flag))
export const company = query<CompanyParams>("GET", p => `https://company.clearbit.com/v2/companies/find?${urlparams(p)}`)
export const companyFlag = query<string, CompanyFlag>("POST", domain => `https://company/clearbit.com/v2/companies/flag?domain=${domain}`, flag => formdata(flag))
export const combined = query<EnrichParams>("GET", p => `https://person.clearbit.com/v2/combined/find?${urlparams(p)}`)
export const risk = query<undefined, RiskCalculate>("POST", _ => "https://risk.clearbit.com/v1/calculate", calc => formdata(calc))
export const riskFlag = query<undefined, RiskFlag>("POST", _ => `https://risk.clearbit.com/v1/flag`, flag => formdata(flag))
export const reveal = query<string>("GET", ip => `https://reveal.clearbit.com/v1/companies/find?ip=${ip}`)
export const _logo = query<[string, LogoParams]>("GET", ([domain, p]) => `https://logo.clearbit.com/${domain}?${urlparams(p)}`)

type QueryParameters = Parameters<typeof fetch>

export async function run<R extends Person | Company | Risk | Reveal>([p1, p2]: QueryParameters, auth: string): Promise<R> {
  const headers = { headers: { Authorization: `Bearer ${auth}` } }
  return fetch(p1, { ...p2, ...headers }).then(res => res.json<R>())
}

export async function logo(domain: string, params: LogoParams): Promise<Int8Array> {
  return fetch(`https://logo.clearbit.com/${domain}?${urlparams(params)}`)
    .then(res => res.arrayBuffer())
    .then(buf => new Int8Array(buf))
}

function query<A, B = undefined>(
  method: string,
  template: (a: A) => string, 
  body?: (b: B) => BodyInit
): (a: A, b: B) => QueryParameters {
  return (a: A, b: B) => [template(a), { method: method, body: body?.(b) }] 
}

function urlparams(params: EnrichParams | CompanyParams | LogoParams): string {
  return Object.entries(params)
    .filter(entry => entry[1] !== null)
    .map(([k, v]) => `${k}=${v}`)
    .join("&")
}

function formdata(fdt: RiskCalculate | PersonFlag | CompanyFlag | RiskFlag): FormData {
  return Object.entries(fdt)
    .filter(entry => entry[1] !== null)
    .reduce((acc, [k, v]) => (acc.set(k, v.toString()), acc), new FormData())
}

type DeepPartial<T> = T extends object ? {
  [K in keyof T]?: DeepPartial<T[K]>
}: T

// Person
export type EnrichParams = {
  email: string
  webhook_url?: string
  given_name?: string
  family_name?: string
  ip_address?: string
  location?: string
  company?: string
  company_domain?: string
  linkedin?: string
  twitter?: string
  facebook?: string
  webhook_id?: string
  subscribe?: boolean
  suppression?: string
}

export type Person = DeepPartial<{
  id: string
  name: {
    givenName: string
    familyName: string
    fullName: string
  }
  location: string
  timeZone: string
  utcOffset: number
  geo: {
    city: string
    state: string
    country: string
    lat: number
    lng: number
  }
  bio: string
  site: string
  avatar: string
  employment: {
    name: string
    title: string
    role: string
    subRole: string
    seniority: string
    domain: string
  }
  facebook: {
    handle: string
  }
  github: {
    handle: string
    id: number
    avatar: string
    company: string
    blog: string
    followers: string
    following: string
  }
  twitter: {
    handle: string
    id: number
    followers: number
    following: number
    location: string
    site: string
    statuses: number
    favorites: number
    avatar: string
  }
  linkedin: {
    handle: string
  }
  googleplus: {
    handle: string
  }
  gravatar: {
    handle: string
    urls: Array<{
      value: string
      title: string
    }>
    avatar: string
    avatars: Array<{
      url: string
      type: string
    }>
  }
  fuzzy: boolean
  emailProvider: boolean
  indexedAt: string
}>

export type PersonFlag = Partial<{
  given_name: string
  family_name: string
  employment_title: string
  facebook_handle: string
  github_handle: string
  twitter_handle: string
  linkedin_handle: string
  googleplug_handle: string
}>

// Company
export type CompanyParams = {
  domain: string
  webhook_url?: string
  company_name?: string
  linkedin?: string
  twitter?: string
  facebook?: string
  webook_id?: string
}

export type CompanyType = "education" | "government" | "nonprofit" | "private" | "public" | "personal"

export type Company = DeepPartial<{
  id: string
  name: string
  legalName: string
  domain: string
  domainAliases: string[]
  site: {
    phoneNumbers: string[]
    emailAddresses: string[]
  }
  tags: string[]
  category: {
    sector: string
    industryGroup: string
    industry: string
    subIndustry: string
    sicCode: string
    naicsCode: string
  }
  description: string
  foundedYear: number
  location: string
  timeZone: string
  utcOffset: number
  geo: {
    streetNumber: string
    streetName: string
    subPremise: string
    city: string
    state: string
    stateCode: string
    postalCode: string
    country: string
    countryCode: string
    lat: number
    lng: number
  }
  identifiers: {
    usEIN: string
  }
  metrics: {
    raised: number
    alexaUsRank: number
    alexaGlobalRank: number
    employees: number
    employeesRange: string
    marketCap: number
    annualRevenue: number
    estimatedAnnualRevenue: string
    fiscalYearEnd: number
  }
  facebook: {
    handle: string
  }
  linkedin: {
    handle: string
  }
  twitter: {
    handle: string
    id: number
    bio: string
    followers: number
    following: number
    location: string
    site: string
    avatar: string
  }
  crunchbase: {
    handle: string
  }
  logo: string
  emailProvider: boolean
  type: CompanyType
  phone: string
  tech: string[]
  techCategories: string[]
  parent: {
    domain: string
  }
  ultimateParent: {
    domain: string
  }
  indexedAt: string
}>

export type CompanyFlag = Partial<{
  name: string
  tags: string[]
  description: string
  raised: number
  location: string
  facebook_handle: string
  twitter_handle: string
  linkedin_handle: string
  crunchbase_handle: string
  employees: number
  logo: string
  email_provider: boolean
  type: CompanyType
}>

// Reveal
export type Reveal = DeepPartial<{
  ip: string
  fuzzy: boolean
  domain: string
  type: string
  company: Company
  geoIP: {
    city: string
    state: string
    stateCode: string
    country: string
    countryCode: string
  }
}>

// Risk
export type Risk = DeepPartial<{
  id: string
  live: boolean
  fingerprint: boolean
  email: {
    valid: boolean
    socialMatch: boolean
    companyMatch: boolean
    nameMatch: boolean
    disposable: boolean
    freeProvider: boolean
    blacklisted: boolean
  }
  address: {
    geoMatch: boolean
  }
  ip: {
    proxy: boolean
    geoMatch: boolean
    blacklisted: boolean
    rateLimited: boolean
  }
  risk: {
    level: "low" | "medium" | "high"
    score: number
    reasons: string[] // "email_ip_geo_mismatch", "ip_country_greylisted", "no_fingerprint_match"
  }
}>

export type RiskCalculate = {
  email: string
  ip: string
  country_code: string
  zip_code: string
  given_name: string
  family_name: string
  name?: string
}

export type RiskFlag = {
  type: "spam" | "chargeback" | "other"
  email: string
  ip: string
}

// Person + Company
export type Combined = Partial<{
  person: Person
  company: Company
}>

// Logo
export type LogoParams = Partial<{
  size: number
  format: string
  grescale: boolean
}>
