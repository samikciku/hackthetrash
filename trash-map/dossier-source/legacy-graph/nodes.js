// All 12 actor nodes. Positions follow a 5-tier layout:
// y=100   external pressure
// y=420   national oversight
// y=740   municipal / political
// y=1060  operational
// y=1380  end actors
//
// Grid columns (stride 300px, node width 148px, gap 152px):
// C0=80  C1=380  C2=680  C3=980  C4=1280

export const TIER_COLORS = {
  operational: '#F59E0B',
  municipal:   '#3B82F6',
  national:    '#8B5CF6',
  citizens:    '#10B981',
  informal:    '#94A3B8',
  external:    '#0EA5E9',
  endpoint:    '#78716C',
  blocked:     '#EF4444',
};

export const initialNodes = [
  // ── TIER 1: External pressure (y=100) ─────────────────────────────────
  {
    id: 'eu',
    type: 'actorNode',
    position: { x: 380, y: 100 },
    data: {
      label: 'EU Delegation',
      fullName: 'EU Office in Pristina',
      tier: 'external',
      role: 'Annual progress reports flag waste management failures. Funded all 7 Kosovo public landfills (2001–2008). Leverage via EU accession conditionality — rarely deployed on this issue specifically.',
      keyPerson: null,
      leverage: [
        'EU accession conditionality for Kosovo',
        'Annual progress reports with public impact',
        'Original funder of Kosovo landfill infrastructure',
      ],
      dependencies: [
        'Kosovo political will to implement reforms',
        'MMPHI to act on policy recommendations',
      ],
      fears: [
        'Kosovo waste situation becoming a diplomatic liability',
        'Reversal of EU-funded landfill investment',
      ],
      stats: [
        { label: 'Landfills funded', value: '7 (2001–2008)' },
        { label: 'Mirash construction cost', value: '~€3.5M (2004–2006)' },
        { label: 'Conditionality status', value: 'Advisory — no binding deadline on waste' },
      ],
      quote: '"Only a few landfills require entrance fees, which only cover the basic cost of landfill management. For waste collection, there is no pay-as-you-throw system."',
      quoteSource: 'EU Office in Pristina, Balkan Insight 2025',
      quoteUrl: 'https://balkaninsight.com/2025/11/28/unbearable-the-legal-and-illegal-landfills-harming-lives-and-land-in-kosovo/',
    },
  },
  {
    id: 'donors',
    type: 'actorNode',
    position: { x: 680, y: 100 },
    data: {
      label: 'Int\'l Donors',
      fullName: 'JICA / GIZ / EU IPA / World Bank',
      tier: 'external',
      role: 'International donors funding infrastructure, assessments, and truck procurement. JICA provided 10 new compactor trucks to Pastrimi and ~30 to Ekoregjioni (Prizren). GIZ conducted landfill assessments.',
      keyPerson: null,
      leverage: [
        'Grant funding (JICA: €4.83M for ~40 trucks regionally)',
        'Technical expertise and assessment capacity',
        'Reporting lines that feed into EU accession reviews',
      ],
      dependencies: [
        'Kosovo government cooperation for project implementation',
        'MMPHI and KLMC as institutional counterparts',
      ],
      fears: [
        'Grant-funded assets (trucks) not maintained after project close',
        'Institutional reforms not sustaining after donor exit',
      ],
      stats: [
        { label: 'JICA grant', value: '543M JPY / ~€4.83M' },
        { label: 'Trucks to Pastrimi', value: '10 new compactors' },
        { label: 'Trucks to Ekoregjioni', value: '~30 new compactors' },
      ],
      quote: null,
      quoteSource: null,
      quoteUrl: 'https://www.jica.go.jp/kosovo/english/activities/activity05.html',
    },
  },

  // ── TIER 2: National oversight (y=420) ────────────────────────────────
  {
    id: 'courts',
    type: 'actorNode',
    position: { x: 80, y: 420 },
    data: {
      label: 'Supreme Court',
      fullName: 'Supreme Court of Kosovo',
      tier: 'national',
      role: 'Issued the consequential June 2025 ruling upholding the Municipal Assembly\'s December 2024 regulation. Confirmed Pastrimi\'s exclusive billing authority. Ended the dual-billing crisis.',
      keyPerson: null,
      leverage: [
        'Final arbiter of regulatory disputes',
        'June 2025 ruling gave Pastrimi billing authority precedent',
      ],
      dependencies: [
        'Cases brought to it — passive role',
        'Political environment affecting case processing speed',
      ],
      fears: [],
      stats: [
        { label: 'Key ruling', value: 'June 2025 — upheld Dec 2024 regulation' },
        { label: 'Effect', value: 'Municipality forced to return €2.7M in collected funds to Pastrimi' },
        { label: 'Constitutional Court', value: 'Separate case — status unclear as of 2025' },
      ],
      quote: '"This was a verdict that provided a solution and an epilogue to every doubt that has existed so far."',
      quoteSource: 'Petrit Reçica (on the ruling), KOHA March 2026',
      quoteUrl: 'https://www.koha.net/en/lajmet-e-mbremjes-ktv/pastrimi-kerkon-nga-komuna-tia-ktheje-parate-qe-i-mori-nga-qytetaret',
    },
  },
  {
    id: 'mmphi',
    type: 'actorNode',
    position: { x: 380, y: 420 },
    data: {
      label: 'Ministry of Env.',
      fullName: 'Ministry of Environment, Spatial Planning and Infrastructure (MMPHI)',
      tier: 'national',
      role: 'National ministry responsible for environmental policy and waste. Formally approved the Dec 2024 regulation as "in line with the Law on Waste." Holds licensing authority over operators — has not used it to sanction for service failures.',
      keyPerson: null,
      leverage: [
        'Operating license authority over all waste operators',
        'Drafts national waste strategy and laws',
        'MMPHI approval blocked Municipality\'s legal challenge to the Dec 2024 regulation',
      ],
      dependencies: [
        'Municipal compliance for ground-level enforcement',
        'EU accession pressure to actually reform',
        'Budget and staffing for enforcement capacity',
      ],
      fears: [
        'EU accession review finding systemic non-compliance',
        'Mirash environmental disaster triggering liability',
      ],
      stats: [
        { label: 'National waste strategy', value: 'Kosovo Integrated Waste Management Strategy 2021–2030' },
        { label: 'Prior strategy target', value: '100% collection by 2020 — actual: ~85% households, 54% businesses' },
        { label: 'Enforcement actions', value: 'Near zero on operator performance failures' },
      ],
      quote: null,
      quoteSource: null,
      quoteUrl: 'https://www.trade.gov/country-commercial-guides/kosovo-waste-management-and-recycling',
    },
  },
  {
    id: 'ammk',
    type: 'actorNode',
    position: { x: 980, y: 420 },
    data: {
      label: 'Env. Agency (AMMK)',
      fullName: 'Kosovo Environmental Protection Agency (AMMK/KEPA)',
      tier: 'national',
      role: 'Environmental monitoring agency. Maintains the official illegal landfill register. Confirmed no Kosovo sanitary landfill has an integrated environmental permit. Issues reports. Does not enforce.',
      keyPerson: null,
      leverage: [
        'Official data source on illegal landfills',
        'Confirmed environmental non-compliance at Mirash',
      ],
      dependencies: [
        'MMPHI for enforcement authority',
        'Municipal cooperation for ground-level monitoring',
      ],
      fears: [],
      stats: [
        { label: 'Illegal landfills (official count)', value: '458 nationally (contested)' },
        { label: 'Illegal landfills (GIZ/AMMK joint study, 2021)', value: '1,572 across 38 municipalities' },
        { label: 'Environmental permits at landfills', value: '0 — none have integrated permits' },
      ],
      quote: null,
      quoteSource: null,
      quoteUrl: 'https://prishtinainsight.com/waste-management-a-systemic-crisis-in-kosovo-mag/',
    },
  },
  {
    id: 'ombudsperson',
    type: 'actorNode',
    position: { x: 1280, y: 420 },
    data: {
      label: 'Ombudsperson',
      fullName: 'Ombudsperson Institution of Kosovo',
      tier: 'national',
      role: 'Hilmi Jashari. Investigated the May 2025 waste crisis. Convened mediation meeting — Pastrimi\'s CEO attended, Mayor Rama did not. Has long history of environmental rights advocacy, including warnings about Mirash methane risk.',
      keyPerson: 'Hilmi Jashari',
      leverage: [
        'Public moral authority and press attention',
        'Can convene parties and issue public recommendations',
        'Long track record on Mirash environmental warnings (since 2017)',
      ],
      dependencies: [
        'Parties willing to engage (Mayor Rama declined in May 2025)',
        'No enforcement authority — can only recommend and publicize',
      ],
      fears: [
        'Being ignored — which happened publicly in May 2025',
      ],
      stats: [
        { label: 'May 2025 meeting', value: 'Reçica attended. Mayor Rama absent.' },
        { label: 'Mirash warning (2017)', value: '"A permanent danger which could cause the death of people"' },
        { label: 'On courts', value: '"The prosecution and courts are not giving priority to environmental cases"' },
      ],
      quote: '"Complete irresponsibility of the representatives of the municipality in relation to the interests and concerns of the citizens of Pristina."',
      quoteSource: 'Ombudsperson statement, May 19, 2025',
      quoteUrl: 'https://oik-rks.org/en/2025/05/19/the-ombudsperson-met-with-the-ceo-of-the-company-pastrimi-the-mayor-of-pristina-was-absent/',
    },
  },

  // ── TIER 3: Municipal / political (y=740) ─────────────────────────────
  {
    id: 'municipality',
    type: 'actorNode',
    position: { x: 80, y: 740 },
    data: {
      label: 'Municipality',
      fullName: 'Municipality of Pristina',
      tier: 'municipal',
      role: 'Capital city local government. Main shareholder of Pastrimi. Lost billing authority via Dec 2024 regulation. Issued competing bills Jan–Jun 2025. Hired private operators during strike. Forced to return €2.7M to Pastrimi after June 2025 Supreme Court ruling.',
      keyPerson: 'Mayor Përparim Rama (LDK)',
      leverage: [
        'Main shareholder of Pastrimi',
        'Controls client registry — can withhold registrations',
        'Can declare emergencies and contract private operators',
        'Won local election late 2025 — political mandate',
      ],
      dependencies: [
        'Municipal Assembly cooperation (which it lacks — PDK+VV majority)',
        'Pastrimi actually collecting waste',
        'Court system not upholding opposition-passed regulations',
      ],
      fears: [
        'Pastrimi bankruptcy under LDK watch',
        'Being blamed for service failures caused by the billing dispute',
        'Private operator tender being permanently blocked',
      ],
      stats: [
        { label: 'Party', value: 'LDK (Democratic League of Kosovo)' },
        { label: 'Assembly control', value: 'No — PDK+VV majority opposes mayor' },
        { label: 'Debt returned to Pastrimi', value: '€2.7M (June 25, 2025)' },
        { label: 'Population served', value: '~220,000' },
      ],
      quote: '"I apologize to the citizens who are facing confusion because it is true that \'Pastrimi\', citing the changes to the regulation made by the municipal assembly, has started collecting invoices for 2025."',
      quoteSource: 'Bekim Brestovci (Municipality Director of Public Services), KOHA January 2025',
      quoteUrl: 'https://www.koha.net/en/arberi/prishtinasit-do-te-faturohen-dyfish-per-mbeturinat',
    },
  },
  {
    id: 'assembly',
    type: 'actorNode',
    position: { x: 380, y: 740 },
    data: {
      label: 'Municipal Assembly',
      fullName: 'Pristina Municipal Assembly',
      tier: 'municipal',
      role: 'Legislative body of the municipality. PDK and VV hold working majority. Passed the December 5, 2024 regulation granting Pastrimi exclusive billing authority — against Mayor Rama\'s objection. The triggering instrument of the 2024–2025 crisis.',
      keyPerson: 'PDK + VV coalition majority',
      leverage: [
        'Legislative power to pass municipal regulations',
        'Dec 2024 regulation upheld by both MMPHI and Supreme Court',
        'Can block municipal executive agenda',
      ],
      dependencies: [
        'PDK+VV coalition holding together',
        'National-level political dynamics not overriding local coalition',
      ],
      fears: [
        'National VV leadership overriding local VV Assembly behavior',
        'LDK winning enough seats to reverse the regulation',
      ],
      stats: [
        { label: 'Key vote', value: 'Dec 5, 2024 — PDK+VV passed waste regulation' },
        { label: 'Legal instrument', value: 'Regulation No. 01-030/01-161704/24' },
        { label: 'MMPHI response', value: 'Approved as "in line with the Law on Waste"' },
        { label: 'Court response', value: 'Supreme Court upheld June 2025' },
      ],
      quote: null,
      quoteSource: null,
      quoteUrl: 'https://www.koha.net/en/arberi/qytetaret-ne-prishtine-vazhdojne-te-jene-ne-dileme-se-ku-ti-paguajne-tarifat-e-mbeturinave',
    },
  },

  // ── TIER 4: Operational (y=1060) ──────────────────────────────────────
  {
    id: 'workers',
    type: 'actorNode',
    position: { x: 80, y: 1060 },
    data: {
      label: 'Pastrimi Workers',
      fullName: 'Pastrimi Workers\' Union',
      tier: 'operational',
      role: '~800–900 employees. Drivers, collectors, dispatch staff. Heavily unionized. Struck May–June 2025 over Municipality withholding payments and private operators being contracted. Politically aligned with PDK.',
      keyPerson: 'Ardian Krasniqi (Union President)',
      leverage: [
        'Can stop collection entirely by striking',
        'Political alignment with PDK gives union Assembly protection',
        'Public sympathy when framed as "protecting public jobs"',
      ],
      dependencies: [
        'Pastrimi management not collapsing financially',
        'PDK maintaining Assembly influence',
        'No private operators entering territory',
      ],
      fears: [
        'Municipality successfully introducing private operators',
        'Pastrimi bankruptcy → job losses',
        'Being split between Pastrimi and private operator routes',
      ],
      stats: [
        { label: 'Headcount', value: '~800–900' },
        { label: 'Strike duration (2025)', value: '~1 month (May–June)' },
        { label: 'Political alignment', value: 'PDK (same bloc that passed favorable Dec 2024 regulation)' },
      ],
      quote: '"We have been doing this job for many years. Don\'t let them stop us. We are tired of the tricks they play among themselves."',
      quoteSource: 'Adnan Sinani (Pastrimi worker), KOHA June 2025',
      quoteUrl: 'https://www.koha.net/en/lajmet-e-mbremjes-ktv/punetoret-e-krm-pastrimi-sdalin-ne-terren-sduan-ti-ndajne-punet-me-kompani-te-tjera',
    },
  },
  {
    id: 'pastrimi',
    type: 'actorNode',
    position: { x: 680, y: 1060 },
    data: {
      label: 'Pastrimi',
      fullName: 'KRM Pastrimi JSC',
      tier: 'operational',
      role: 'Municipal waste collection company. ~800–900 employees. Exclusive collection territory in Pristina under Dec 2024 regulation, upheld June 2025. Self-financing: covers all costs from citizen fees. CEO Petrit Reçica.',
      keyPerson: 'CEO Petrit Reçica',
      leverage: [
        'Supreme Court-backed exclusive billing authority',
        'Exclusive collection territory — no legal competitor currently',
        '800–900 unionized workers who can strike',
        'Ability to threaten bankruptcy (and the public health crisis it implies)',
      ],
      dependencies: [
        'Municipality must register clients for billing',
        'KLMC must accept trucks at Mirash',
        'Citizen payment compliance',
        'Trucks operational (JICA grant covers 10 new)',
      ],
      fears: [
        'Municipality withholding client registry (23,000-client gap = ~€3.5M/year lost)',
        'KLMC refusing trucks over €1.9M unpaid debt',
        'Private operators entering territory',
        'Revenue too low to cover operating costs',
      ],
      stats: [
        { label: 'Employees', value: '~900' },
        { label: 'Monthly household fee', value: '€6.20 incl. VAT' },
        { label: 'Registered clients', value: '~95,000 (Pastrimi) vs 72,000 (Municipality)' },
        { label: 'Truck fleet', value: '14 household + 3 business + 10 incoming (JICA)' },
        { label: 'Debt to KLMC', value: '~€1.9M' },
        { label: 'Est. annual revenue (full collection)', value: '~€7–8M' },
      ],
      quote: '"From January 2025 onwards, it is our sole competence."',
      quoteSource: 'CEO Petrit Reçica, Telegrafi April 2025',
      quoteUrl: 'https://telegrafi.com/en/mospajtimet-se-ku-duhet-te-paguhen-faturat-e-mbeturinave-ne-prishtine-flet-kryeshefi-ndermarrjes-pastrimi/',
    },
  },
  {
    id: 'klmc',
    type: 'actorNode',
    position: { x: 980, y: 1060 },
    data: {
      label: 'KLMC',
      fullName: 'Kosovo Landfill Management Company (KLMC / KMDK)',
      tier: 'operational',
      role: 'Publicly owned company operating Kosovo\'s public landfills, including Mirash. Reports to Ministry of Economy. Pastrimi owes KLMC ~€1.9M in unpaid landfill fees. Mirash has exceeded capacity for years with no leachate treatment and no environmental permit.',
      keyPerson: 'Dardan Velija (Director)',
      leverage: [
        'Can refuse Pastrimi trucks at Mirash — which would stop collection city-wide',
        'Only viable disposal site for Pristina-region waste',
      ],
      dependencies: [
        'Pastrimi payments for operating revenue',
        'MMPHI for policy direction and funding',
        'EU for closure/replacement funding',
      ],
      fears: [
        'Pastrimi debt growing while KLMC cannot refuse service',
        'Mirash environmental failure triggering liability',
        'EU-mandated Mirash closure before replacement site is ready',
      ],
      stats: [
        { label: 'Pastrimi debt to KLMC', value: '~€1.9M' },
        { label: 'Mirash annual intake', value: '~160,000 metric tons from 6+ cities' },
        { label: 'Mirash age', value: 'Built 2004–2006. Exceeds designed capacity.' },
        { label: 'Environmental permit', value: 'None — despite KLMC applications' },
        { label: 'Leachate treatment', value: 'None' },
      ],
      quote: '"The problem with sewage at this landfill has been out of control for many years because the collection point has flooded."',
      quoteSource: 'Dardan Velija (KLMC Director), RFE/RL 2024',
      quoteUrl: 'https://www.rferl.org/a/pollution-balkans-kosovo/33210735.html',
    },
  },
  {
    id: 'private_operators',
    type: 'actorNode',
    position: { x: 1280, y: 1060 },
    data: {
      label: 'Private Operators',
      fullName: 'Private Waste Operators (tender candidates)',
      tier: 'blocked',
      role: 'Five private operators that the Municipality attempted to contract via a €16M tender in 2024. Blocked by the Dec 2024 regulation. Temporarily hired during the May 2025 strike — "they also failed to do the job properly." Currently blocked from Pristina territory.',
      keyPerson: null,
      leverage: [
        'Municipality political backing if LDK wins Assembly majority',
        'EU preference for private-sector waste management',
      ],
      dependencies: [
        'Municipality successfully overturning the Dec 2024 regulation',
        'Political shift in Municipal Assembly composition',
      ],
      fears: [],
      stats: [
        { label: 'Tender value', value: '~€16M (alleged by Pastrimi)' },
        { label: 'Current status', value: 'Blocked by Dec 2024 regulation' },
        { label: 'Emergency use', value: 'Contracted during May 2025 strike — poor performance' },
      ],
      quote: null,
      quoteSource: null,
      quoteUrl: null,
    },
  },

  // ── TIER 5: End actors (y=1380) ───────────────────────────────────────
  {
    id: 'citizens',
    type: 'actorNode',
    position: { x: 80, y: 1380 },
    data: {
      label: 'Citizens',
      fullName: 'Pristina Residents & Households',
      tier: 'citizens',
      role: '~95,000 registered Pastrimi clients (disputed: Municipality count is 72,000). Pay €6.20/month flat fee. During 2025 crisis, ~21,000 paid the Municipality instead of Pastrimi, creating a dual-billing situation. No pay-as-you-throw mechanism.',
      keyPerson: null,
      leverage: [
        'Collective non-payment can destabilize Pastrimi financially',
        'Complaints and press attention create political costs for both sides',
      ],
      dependencies: [
        'Pastrimi for collection — no alternative for household waste',
        'Clarity on where to pay (which broke down in 2025)',
      ],
      fears: [
        'Double billing',
        'Non-collection and associated health/smell problems',
        'Paying for a service that doesn\'t arrive',
      ],
      stats: [
        { label: 'Registered clients (Pastrimi)', value: '~95,000' },
        { label: 'Registered clients (Municipality)', value: '~72,000' },
        { label: 'Pristina population', value: '~220,000' },
        { label: 'Paid Municipality during dispute', value: '~21,000 citizens (by April 2025)' },
        { label: 'Monthly fee', value: '€6.20 (flat, no volume incentive)' },
      ],
      quote: '"The waste in every corner is causing us problems even in business. The containers are of poor quality and insufficient given the high volume."',
      quoteSource: 'Bajram Islami (Kalabria neighbourhood), Prishtina Insight 2025',
      quoteUrl: 'https://prishtinainsight.com/waste-management-a-systemic-crisis-in-kosovo-mag/',
    },
  },
  {
    id: 'informal_collectors',
    type: 'actorNode',
    position: { x: 680, y: 1380 },
    data: {
      label: 'Informal Collectors',
      fullName: 'Informal Waste Pickers (predominantly RAE community)',
      tier: 'informal',
      role: 'Predominantly Roma, Ashkali, Egyptian community members. Work bins before Pastrimi trucks arrive (~5am). Extract metal, plastic, paper, glass. Earn ~€15/day from ~100kg recyclables. Sell to aggregators (Rec-Kos, etc.) who export to Turkey and Greece. Technically unlicensed but zero enforcement.',
      keyPerson: 'Emrah Cermjani (Roma in Action NGO)',
      leverage: [
        'Provide recycling function the state does not provide',
        'Zero enforcement means they operate freely',
      ],
      dependencies: [
        'Bins being accessible and full',
        'Rec-Kos and other aggregators buying materials',
        'Not being formalized (formalization would cost benefits and expose to taxes)',
      ],
      fears: [
        'EU compliance pressure leading to formalization drives',
        'Bins being moved indoors or locked',
        'Aggregator prices falling',
      ],
      stats: [
        { label: 'Community', value: 'Predominantly Roma, Ashkali, Egyptian (RAE)' },
        { label: 'Daily earnings', value: '~€15 from ~100kg recyclables' },
        { label: 'Export chain', value: 'Rec-Kos → steel factories in Turkey and Greece' },
        { label: 'Legal status', value: 'Unlicensed — enforcement is zero' },
        { label: 'Kosovo recycling rate', value: '~3% — informal sector does most of it' },
      ],
      quote: null,
      quoteSource: null,
      quoteUrl: 'https://prishtinainsight.com/waste-warriors-of-necessity-informal-waste-pickers-carving-a-livelihood-from-scraps-mag/',
    },
  },
  {
    id: 'mirash',
    type: 'actorNode',
    position: { x: 980, y: 1380 },
    data: {
      label: 'Mirash Landfill',
      fullName: 'Mirash Regional Landfill (Obiliq municipality)',
      tier: 'endpoint',
      role: 'Physical disposal endpoint for Pristina-region waste. Built 2004–2006 (€3.5M EU-funded). 7 hectares, ~10km west of Pristina. Receives ~160,000 tons/year from 6+ cities. Exceeds designed capacity. No leachate treatment, no environmental permit. Methane fire risk. Closure is EU priority — not closed.',
      keyPerson: null,
      leverage: [],
      dependencies: [
        'KLMC operational management',
        'Pastrimi trucks continuing to deliver',
        'EU and Kosovo government not forcing closure before replacement is ready',
      ],
      fears: [],
      stats: [
        { label: 'Built', value: '2004–2006, cost ~€3.5M (EU-funded)' },
        { label: 'Size', value: '7 hectares (~10 football pitches)' },
        { label: 'Annual intake', value: '~160,000 metric tons from 6+ cities' },
        { label: 'Municipalities served', value: 'Pristina, Drenas, Lipjan, Podujeva, Gracanica, Obilic, Fushe Kosove' },
        { label: 'Leachate treatment', value: 'None. Collection point has flooded for years.' },
        { label: 'Environmental permit', value: 'None (despite KLMC applications)' },
        { label: 'Methane risk', value: 'Ombudsperson warned of potential explosion risk (2017)' },
        { label: 'Closure status', value: 'EU-flagged immediate priority. Not closed.' },
      ],
      quote: '"During the summer, the smell here is unbearable, we complain, but no one listens to us."',
      quoteSource: 'Adem Shalaku (Lajthishtë village, near Mirash), Prishtina Insight 2025',
      quoteUrl: 'https://prishtinainsight.com/waste-management-a-systemic-crisis-in-kosovo-mag/',
    },
  },
]
