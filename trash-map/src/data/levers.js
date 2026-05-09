// 4 lever scenarios. Each lever:
// - highlights affectedNodes and affectedEdges
// - applies a stressLevel to each affected node: 'none' | 'low' | 'medium' | 'high'
// - supplies a short narrative per affected node
// - headlines: 4 breaking-news-style headlines for the ticker
// - revealOrder: arrays of nodeIds showing the shock-wave propagation order
// - historical (optional): true if this already happened; add historicalDate
// - reaction (optional): emoji shown floating above each affected node

export const levers = [
  {
    id: 'klmc-fee-increase',
    emoji: '💰',
    title: 'KLMC raises landfill fees 30%',
    description: 'Kosovo Landfill Management Company increases the per-ton disposal fee at Mirash.',
    context: 'Mirash has no proper cost recovery for remediation or closure. A fee increase is the only financial lever KLMC can pull — but Pastrimi already owes €1.9M.',
    headlines: [
      '💰 KLMC raises landfill fees 30% · Pastrimi already owes €1.9M and has no leverage',
      '📋 Three scenarios: absorb the cost, pass it to citizens, or deepen the debt — all roads lead to the same place',
      '🏠 No pay-as-you-throw mechanism means every household pays equally, regardless of waste produced',
      '🚮 Construction sites expected to increase illegal dumping to avoid higher landfill fees',
    ],
    revealOrder: [
      ['klmc'],
      ['pastrimi'],
      ['workers', 'citizens'],
      ['mirash'],
    ],
    affectedNodeIds: ['klmc', 'pastrimi', 'workers', 'citizens', 'mirash'],
    affectedEdgeIds: ['pastrimi-klmc-debt', 'citizens-pastrimi-payment'],
    nodeEffects: {
      klmc: {
        stressLevel: 'none',
        reaction: '😐',
        narrative: 'Revenue increases in theory. But Pastrimi\'s existing €1.9M debt makes collection of the new fee doubtful without an escalation KLMC can\'t afford — refusing Pastrimi trucks would stop city-wide collection.',
      },
      pastrimi: {
        stressLevel: 'high',
        reaction: '😬',
        narrative: 'Operating costs rise. Three historical responses: absorb (cuts margins → pressure on workers), pass to citizens (raise the flat fee), or delay KLMC payment (deepens the debt). All three have been used.',
      },
      workers: {
        stressLevel: 'medium',
        reaction: '😤',
        narrative: 'If margins compress, the first pressure point is worker headcount or wages. Union will push back. The same PDK political alignment that protected the Dec 2024 regulation also protects workers from layoffs.',
      },
      citizens: {
        stressLevel: 'medium',
        reaction: '💸',
        narrative: 'If Pastrimi passes costs on, the flat fee rises. No pay-as-you-throw mechanism means all households pay the same increase regardless of how much waste they produce.',
      },
      mirash: {
        stressLevel: 'low',
        reaction: '🚮',
        narrative: 'Higher disposal fees may push construction sites toward illegal dumping — CDW is already the primary driver of Kosovo\'s 458–1,572 illegal dump sites.',
      },
    },
  },

  {
    id: 'municipality-wins-billing',
    emoji: '⚖️',
    title: 'Municipality regains billing authority',
    description: 'A court or regulatory reversal gives the Municipality control over waste fee collection again.',
    context: 'This is the hypothetical reversal of the June 2025 Supreme Court ruling — the scenario Pastrimi fears most. It roughly mirrors what existed before December 2024.',
    headlines: [
      '⚖️ COURT REVERSAL — Municipality regains billing authority · Pastrimi loses revenue stream overnight',
      '✊ Workers\' Union: "This is the prelude to privatization — we will not accept it"',
      '🤷 Citizens face confusion again: which bill do I pay? Who sends the other one?',
      '🏗️ €16M private operator tender revived · Mayor Rama calls it "EU-required modernisation"',
    ],
    revealOrder: [
      ['municipality'],
      ['assembly', 'pastrimi'],
      ['workers', 'private_operators'],
      ['citizens'],
    ],
    affectedNodeIds: ['municipality', 'assembly', 'pastrimi', 'workers', 'private_operators', 'citizens'],
    affectedEdgeIds: ['citizens-pastrimi-payment', 'municipality-pastrimi-debt', 'assembly-pastrimi-regulation', 'municipality-private-operators'],
    nodeEffects: {
      municipality: {
        stressLevel: 'none',
        reaction: '🎉',
        narrative: 'Regains revenue control. Can now steer funds and set priorities. Likely to revive the €16M private operator tender — which is its stated preference.',
      },
      assembly: {
        stressLevel: 'medium',
        reaction: '😡',
        narrative: 'PDK+VV political bloc loses the regulation they fought for. PDK has strong incentive to use the Assembly to legislate again. Political cycle resumes.',
      },
      pastrimi: {
        stressLevel: 'high',
        reaction: '😰',
        narrative: 'Loses direct revenue stream. Becomes fully dependent on Municipality transferring funds — which the Municipality has already proven it can withhold. Historical pattern: withholding → cash starvation → workers strike.',
      },
      workers: {
        stressLevel: 'high',
        reaction: '✊',
        narrative: 'Union will interpret this as the prelude to privatization. The last time Pastrimi lost billing leverage (Jan–Jun 2025), workers struck for a month. Expect the same response.',
      },
      private_operators: {
        stressLevel: 'none',
        reaction: '🤑',
        narrative: 'Path clears. The Municipality\'s €16M tender for 5 private operators becomes viable again. The EU, which prefers market-based approaches, would likely approve.',
      },
      citizens: {
        stressLevel: 'medium',
        reaction: '🤷',
        narrative: 'Confusion returns — where do they pay? Dual-billing risk re-emerges. If workers strike again, collection stops. Citizens are the system\'s shock absorbers: they absorb every political failure as a service failure.',
      },
    },
  },

  {
    id: 'eu-formal-warning',
    emoji: '🇪🇺',
    title: 'EU issues formal accession warning on waste',
    description: 'The EU formally conditions Kosovo\'s next accession milestone on measurable waste management progress.',
    context: 'Kosovo\'s EU accession path means EU leverage is real but has never been deployed specifically on waste. A formal warning would be one escalation step above the current "noted in annual report" status.',
    headlines: [
      '🇪🇺 EU formally links Kosovo accession milestone to waste management progress',
      '🏭 Mirash landfill named on accession scorecard — 20 years, no environmental permit, no leachate treatment',
      '📊 MMPHI must respond with measurable targets — previous strategy promised 100% collection by 2020',
      '⚠️ Informal recycling sector faces formalization pressure — Kosovo\'s entire 3% recycling rate at risk',
    ],
    revealOrder: [
      ['eu'],
      ['mmphi', 'klmc'],
      ['municipality', 'pastrimi'],
      ['informal_collectors', 'mirash'],
    ],
    affectedNodeIds: ['eu', 'mmphi', 'klmc', 'municipality', 'pastrimi', 'informal_collectors', 'mirash'],
    affectedEdgeIds: ['eu-mmphi-accession', 'eu-klmc-landfill-funding', 'mmphi-assembly-approval', 'mmphi-pastrimi-license'],
    nodeEffects: {
      eu: {
        stressLevel: 'none',
        reaction: '📋',
        narrative: 'EU deploys its most significant systemic lever. This gives the EU Delegation\'s Pristina office political cover to push harder on specific actors.',
      },
      mmphi: {
        stressLevel: 'high',
        reaction: '😰',
        narrative: 'Must formally respond. Likely: new National Waste Strategy targets, increased pressure on KLMC to get environmental permits, and pressure on Pristina to demonstrate EU-aligned reforms (pay-as-you-throw, collection coverage metrics).',
      },
      klmc: {
        stressLevel: 'high',
        reaction: '😬',
        narrative: 'Mirash becomes a specific liability on Kosovo\'s accession scorecard. EU closure/replacement funding timeline becomes binding, not advisory. KLMC must apply for environmental permits or risk the accession case.',
      },
      municipality: {
        stressLevel: 'medium',
        reaction: '🏗️',
        narrative: 'Political pressure to demonstrate reform. Private operator introduction — which the EU prefers — gets political oxygen. Mayor Rama can frame the tender as "EU-required modernization."',
      },
      pastrimi: {
        stressLevel: 'medium',
        reaction: '📊',
        narrative: 'EU compliance typically means performance requirements: pay-as-you-throw, collection coverage metrics, route reporting. Pastrimi currently has none of these. Compliance would require operational restructuring.',
      },
      informal_collectors: {
        stressLevel: 'high',
        reaction: '😟',
        narrative: 'EU compliance often triggers formalization drives. The informal recycling sector — mostly Roma, Ashkali, Egyptian community — is the most economically vulnerable to formalization pressure. Formalization would mean losing unemployment benefits and exposing collectors to taxes.',
      },
      mirash: {
        stressLevel: 'high',
        reaction: '⚠️',
        narrative: 'Specific EU conditions would likely include a hard timeline for Mirash closure. Funding for a replacement site exists in study form. Political will to actually close and relocate is what\'s missing.',
      },
    },
  },

  {
    id: 'pastrimi-strikes',
    emoji: '🚛',
    title: 'Pastrimi workers strike',
    description: 'Workers stop collection in protest. This is a historical replay of what actually happened in May–June 2025.',
    context: 'This lever shows what already happened. Run it to understand the system\'s stress response. The full crisis ran ~1 month, resolved only after the Supreme Court ruled.',
    historical: true,
    historicalDate: 'May – June 2025',
    headlines: [
      '🚛 WORKERS WALK OUT — Collection stops city-wide · Trash piles up in summer heat',
      '🏛️ Mayor Rama declares state of emergency — contracts private operators who also fail to do the job',
      '📋 Ombudsperson convenes emergency meeting May 19 · Pastrimi CEO attends · Mayor Rama does not show up',
      '🤢 Residents: "The smell here is unbearable" · Supreme Court eventually rules, crisis ends after ~1 month',
    ],
    revealOrder: [
      ['workers'],
      ['pastrimi', 'municipality'],
      ['private_operators', 'ombudsperson'],
      ['citizens'],
    ],
    affectedNodeIds: ['workers', 'pastrimi', 'municipality', 'private_operators', 'citizens', 'ombudsperson'],
    affectedEdgeIds: ['workers-pastrimi-labor', 'municipality-private-operators', 'ombudsperson-municipality-criticism', 'citizens-pastrimi-payment'],
    nodeEffects: {
      workers: {
        stressLevel: 'none',
        reaction: '✊',
        narrative: 'Workers\' chosen action. Union cohesion is high during the strike. Ardian Krasniqi (union president) frames it as defending public employment against "tricks they play among themselves."',
      },
      pastrimi: {
        stressLevel: 'medium',
        reaction: '😤',
        narrative: 'Management supports the strike as leverage against Municipality, but the company stops generating revenue. Adds to financial pressure. Strike ends only after Supreme Court ruling gives Pastrimi a clear win.',
      },
      municipality: {
        stressLevel: 'high',
        reaction: '😱',
        narrative: 'Forced to act. Declares state of emergency in waste collection. Contracts private operators. Emergency declaration is politically costly — it admits service failure on the mayor\'s watch. Mayor Rama cites "significant risk of public health crisis."',
      },
      private_operators: {
        stressLevel: 'none',
        reaction: '🤑',
        narrative: 'Gets temporary emergency contracts. Historical note: "they also failed to do the job properly" (KOHA retrospective on 2025). Emergency contracts are not the same as winning the long-term tender.',
      },
      citizens: {
        stressLevel: 'high',
        reaction: '🤢',
        narrative: 'Trash accumulates. Summer heat amplifies smell. Complaints spike. Citizens were described reporting stench, full containers, and no response. The dual-billing confusion continues on top of non-collection.',
      },
      ombudsperson: {
        stressLevel: 'medium',
        reaction: '😑',
        narrative: 'Convenes emergency mediation on May 19, 2025. Reçica attends. Mayor Rama does not. Jashari publicly criticizes the Municipality for "complete irresponsibility." Jashari cannot sanction anyone — can only name and shame.',
      },
    },
  },
]
