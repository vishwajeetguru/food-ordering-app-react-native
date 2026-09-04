export interface Country {
  iso2: string;
  name: string;
  dial: string;
  flag: string;
}

const RAW: Array<[string, string, string]> = [
  ['IN', 'India', '91'],
  ['US', 'United States', '1'],
  ['GB', 'United Kingdom', '44'],
  ['CA', 'Canada', '1'],
  ['AU', 'Australia', '61'],
  ['AE', 'United Arab Emirates', '971'],
  ['SA', 'Saudi Arabia', '966'],
  ['QA', 'Qatar', '974'],
  ['KW', 'Kuwait', '965'],
  ['BH', 'Bahrain', '973'],
  ['OM', 'Oman', '968'],
  ['SG', 'Singapore', '65'],
  ['MY', 'Malaysia', '60'],
  ['ID', 'Indonesia', '62'],
  ['PH', 'Philippines', '63'],
  ['TH', 'Thailand', '66'],
  ['VN', 'Vietnam', '84'],
  ['JP', 'Japan', '81'],
  ['KR', 'South Korea', '82'],
  ['CN', 'China', '86'],
  ['HK', 'Hong Kong', '852'],
  ['TW', 'Taiwan', '886'],
  ['PK', 'Pakistan', '92'],
  ['BD', 'Bangladesh', '880'],
  ['NP', 'Nepal', '977'],
  ['LK', 'Sri Lanka', '94'],
  ['DE', 'Germany', '49'],
  ['FR', 'France', '33'],
  ['ES', 'Spain', '34'],
  ['IT', 'Italy', '39'],
  ['NL', 'Netherlands', '31'],
  ['BE', 'Belgium', '32'],
  ['CH', 'Switzerland', '41'],
  ['AT', 'Austria', '43'],
  ['SE', 'Sweden', '46'],
  ['NO', 'Norway', '47'],
  ['DK', 'Denmark', '45'],
  ['FI', 'Finland', '358'],
  ['IE', 'Ireland', '353'],
  ['PT', 'Portugal', '351'],
  ['GR', 'Greece', '30'],
  ['PL', 'Poland', '48'],
  ['CZ', 'Czech Republic', '420'],
  ['RO', 'Romania', '40'],
  ['HU', 'Hungary', '36'],
  ['TR', 'Turkey', '90'],
  ['RU', 'Russia', '7'],
  ['UA', 'Ukraine', '380'],
  ['IL', 'Israel', '972'],
  ['BR', 'Brazil', '55'],
  ['MX', 'Mexico', '52'],
  ['AR', 'Argentina', '54'],
  ['CL', 'Chile', '56'],
  ['CO', 'Colombia', '57'],
  ['PE', 'Peru', '51'],
  ['ZA', 'South Africa', '27'],
  ['NG', 'Nigeria', '234'],
  ['KE', 'Kenya', '254'],
  ['GH', 'Ghana', '233'],
  ['EG', 'Egypt', '20'],
  ['NZ', 'New Zealand', '64'],
];

function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export const COUNTRIES: Country[] = RAW.map(([iso2, name, dial]) => ({
  iso2,
  name,
  dial,
  flag: flagEmoji(iso2),
})).sort((a, b) => a.name.localeCompare(b.name));

export const DEFAULT_COUNTRY = COUNTRIES.find((c) => c.iso2 === 'IN') ?? COUNTRIES[0];
