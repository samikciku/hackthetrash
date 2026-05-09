// Edge types: money | authority | operational | political | oversight
// Status: active | disputed | resolved | broken

export const EDGE_COLORS = {
  money:       '#F59E0B',
  authority:   '#8B5CF6',
  operational: '#64748B',
  political:   '#EC4899',
  oversight:   '#10B981',
};

export const initialEdges = [
  // ── MONEY FLOWS ─────────────────────────────────────────────────────
  {
    id: 'citizens-pastrimi-payment',
    source: 'citizens',
    target: 'pastrimi',
    data: {
      relationshipType: 'money',
      label: '€6.20/mo × ~95K clients',
      status: 'active',
      note: 'Flat fee billing — no pay-as-you-throw. Pastrimi bills directly per Dec 2024 regulation. During Jan–Jun 2025, the Municipality also billed citizens, creating dual-billing chaos. ~21,000 citizens paid the Municipality instead.',
    },
  },
  {
    id: 'pastrimi-klmc-debt',
    source: 'pastrimi',
    target: 'klmc',
    data: {
      relationshipType: 'money',
      label: '~€1.9M owed (unpaid landfill fees)',
      status: 'disputed',
      note: 'Pastrimi owes KLMC ~€1.9M in landfill disposal fees. KLMC cannot easily refuse Pastrimi trucks without stopping city-wide collection — but also depends on these payments for operating revenue. A structural mutual hostage situation.',
    },
  },
  {
    id: 'municipality-pastrimi-debt',
    source: 'municipality',
    target: 'pastrimi',
    data: {
      relationshipType: 'money',
      label: '€2.7M returned (Jun 2025)',
      status: 'resolved',
      note: 'Municipality owed Pastrimi ~€2.7M in fees collected during the dual-billing period (Jan–Jun 2025). Returned via mediation on June 25, 2025, following Supreme Court ruling.',
    },
  },
  {
    id: 'donors-pastrimi-trucks',
    source: 'donors',
    target: 'pastrimi',
    data: {
      relationshipType: 'money',
      label: 'JICA grant: 10 trucks',
      status: 'active',
      note: 'Japan International Cooperation Agency (JICA) provided 10 new compactor trucks to Pastrimi as part of a €4.83M regional grant (also covering ~30 trucks to Ekoregjioni/Prizren). Non-conditional on performance metrics.',
    },
  },

  // ── LEGAL / REGULATORY AUTHORITY ────────────────────────────────────
  {
    id: 'assembly-pastrimi-regulation',
    source: 'assembly',
    target: 'pastrimi',
    data: {
      relationshipType: 'authority',
      label: 'Dec 2024: exclusive billing authority',
      status: 'active',
      note: 'PDK+VV majority passed regulation No. 01-030/01-161704/24 (Dec 6, 2024) granting Pastrimi exclusive billing authority. Approved by MMPHI as legally consistent. Upheld by Supreme Court June 2025.',
    },
  },
  {
    id: 'mmphi-assembly-approval',
    source: 'mmphi',
    target: 'assembly',
    data: {
      relationshipType: 'authority',
      label: 'Approved regulation as legal',
      status: 'active',
      note: 'MMPHI formally approved the Municipal Assembly\'s Dec 2024 regulation as "in line with the Law on Waste," undermining the Municipality\'s legal challenge and giving the regulation national-level backing.',
    },
  },
  {
    id: 'mmphi-pastrimi-license',
    source: 'mmphi',
    target: 'pastrimi',
    data: {
      relationshipType: 'authority',
      label: 'Operating license (unenforced)',
      status: 'active',
      note: 'MMPHI holds licensing authority over all waste operators including Pastrimi. Has not used this authority to sanction Pastrimi for service failures despite this being legally available.',
    },
  },
  {
    id: 'courts-assembly-ruling',
    source: 'courts',
    target: 'assembly',
    data: {
      relationshipType: 'authority',
      label: 'Upheld Dec 2024 regulation (Jun 2025)',
      status: 'resolved',
      note: 'Supreme Court of Kosovo ruled in June 2025 that the Dec 2024 regulation is valid. Rejected the Municipality\'s claim to repeal it. Forced mediated return of €2.7M collected by the Municipality.',
    },
  },
  {
    id: 'eu-mmphi-accession',
    source: 'eu',
    target: 'mmphi',
    data: {
      relationshipType: 'authority',
      label: 'Accession conditionality (advisory)',
      status: 'active',
      note: 'EU flags waste management failures in annual Kosovo progress reports. Accession conditionality theoretically ties EU integration progress to waste reforms. In practice has not been applied in a specific or binding way on individual waste issues.',
    },
  },
  {
    id: 'eu-klmc-landfill-funding',
    source: 'eu',
    target: 'klmc',
    data: {
      relationshipType: 'authority',
      label: 'Funded original landfills + closure pressure',
      status: 'active',
      note: 'EU funded all 7 Kosovo public landfills (2001–2008), including Mirash (€3.5M). Now flags their current state as a reversal of that investment. Mirash closure is an EU-flagged immediate priority. Closure has not happened.',
    },
  },

  // ── OPERATIONAL DEPENDENCIES ─────────────────────────────────────────
  {
    id: 'pastrimi-mirash-delivery',
    source: 'pastrimi',
    target: 'mirash',
    data: {
      relationshipType: 'operational',
      label: '~160K tons/year',
      status: 'active',
      note: 'Pastrimi trucks deliver collected waste to Mirash. The only practical disposal site for Pristina-region waste. If KLMC refuses Pastrimi trucks (over the €1.9M debt), collection in Pristina effectively stops.',
    },
  },
  {
    id: 'klmc-mirash-operation',
    source: 'klmc',
    target: 'mirash',
    data: {
      relationshipType: 'operational',
      label: 'Operates landfill',
      status: 'active',
      note: 'KLMC manages Mirash under the Ministry of Economy. No leachate treatment, no environmental permit, exceeds designed capacity. Ombudsperson warned of potential methane explosion risk in 2017.',
    },
  },
  {
    id: 'workers-pastrimi-labor',
    source: 'workers',
    target: 'pastrimi',
    data: {
      relationshipType: 'operational',
      label: '~900 employees — can strike',
      status: 'active',
      note: 'Workers provide the physical collection. Unionized under Ardian Krasniqi. Struck May–June 2025 — collection stopped for ~1 month. Politically aligned with PDK, the same bloc that passed the favorable Dec 2024 regulation protecting Pastrimi.',
    },
  },
  {
    id: 'municipality-pastrimi-shareholder',
    source: 'municipality',
    target: 'pastrimi',
    data: {
      relationshipType: 'operational',
      label: 'Main shareholder (adversarial)',
      status: 'disputed',
      note: 'Municipality owns Pastrimi but has minimal operational control. The shareholder relationship is adversarial rather than supervisory due to political misalignment between LDK (mayor) and PDK+VV (assembly protecting Pastrimi).',
    },
  },
  {
    id: 'municipality-registry-control',
    source: 'municipality',
    target: 'pastrimi',
    data: {
      relationshipType: 'operational',
      label: 'Client registry (23K clients withheld)',
      status: 'disputed',
      note: 'The Municipality controls client registration. Pastrimi submitted ~25,000 new clients in June 2023; Municipality did not register them. Pastrimi estimates this costs ~€3.5M/year in foregone revenue. The 23,000-client gap is a structural financing weapon.',
    },
  },
  {
    id: 'informal-citizens-scavenging',
    source: 'informal_collectors',
    target: 'citizens',
    data: {
      relationshipType: 'operational',
      label: 'Pre-pickup extraction at bins',
      status: 'active',
      note: 'Informal collectors work bins at ~5am, before Pastrimi trucks arrive. They extract metal, plastic, paper, glass. ~€15/day earnings per collector from ~100kg of recyclables. They are blamed for litter scatter around bins, but this is downstream of bins being too small and too few.',
    },
  },
  {
    id: 'municipality-private-operators',
    source: 'municipality',
    target: 'private_operators',
    data: {
      relationshipType: 'operational',
      label: '€16M tender (currently blocked)',
      status: 'disputed',
      note: 'Municipality issued a tender for 5 private waste operators in 2024. Blocked by the Dec 2024 regulation. Municipality contracted some operators during May 2025 strike — KOHA reported "they also failed to do the job properly."',
    },
  },

  // ── POLITICAL ALIGNMENT ──────────────────────────────────────────────
  {
    id: 'municipality-assembly-conflict',
    source: 'municipality',
    target: 'assembly',
    data: {
      relationshipType: 'political',
      label: 'LDK mayor vs PDK+VV majority',
      status: 'disputed',
      note: 'Mayor Rama (LDK) cannot control the Assembly, which has a PDK+VV majority. Basic municipal governance is adversarial. The Dec 2024 regulation was passed directly against the mayor\'s stated position.',
    },
  },

  // ── OVERSIGHT / ACCOUNTABILITY ───────────────────────────────────────
  {
    id: 'ombudsperson-municipality-criticism',
    source: 'ombudsperson',
    target: 'municipality',
    data: {
      relationshipType: 'oversight',
      label: 'Criticized absence at May 2025 meeting',
      status: 'active',
      note: 'Ombudsperson Hilmi Jashari convened a mediation meeting on May 19, 2025. Pastrimi CEO Reçica attended. Mayor Rama did not. Jashari publicly called this "complete irresponsibility" and "disrespect for this institution."',
    },
  },
  {
    id: 'ombudsperson-pastrimi-investigation',
    source: 'ombudsperson',
    target: 'pastrimi',
    data: {
      relationshipType: 'oversight',
      label: 'Investigated crisis (Pastrimi "on verge of bankruptcy")',
      status: 'active',
      note: 'Ombudsperson stated Pastrimi was "on the verge of bankruptcy" in May 2025. Investigated the crisis as a public health and rights issue — the ongoing dispute endangered both 800+ workers and the residents depending on collection.',
    },
  },
  {
    id: 'ammk-mirash-monitoring',
    source: 'ammk',
    target: 'mirash',
    data: {
      relationshipType: 'oversight',
      label: 'Monitors, does not enforce',
      status: 'active',
      note: 'AMMK confirmed: no Kosovo sanitary landfill has an integrated environmental permit despite KLMC applications. AMMK produces reports and data. No enforcement mechanism — enforcement would require MMPHI action, which has not occurred.',
    },
  },
  {
    id: 'citizens-mirash-proximity',
    source: 'citizens',
    target: 'mirash',
    data: {
      relationshipType: 'operational',
      label: 'Nearby residents (odor, health risk)',
      status: 'active',
      note: 'Residents near Mirash (Lajthishtë, Obiliq area) report unbearable summer odors and suspected health impacts. The area also hosts Kosovo A and B coal power plants, making it one of the most polluted areas in the country.',
    },
  },
]
