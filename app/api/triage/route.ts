import { NextRequest, NextResponse } from 'next/server';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function assessSeverity(message: string) {
  const m = normalize(message);
  const redFlags = [
    'douleur thoracique',
    'oppression thoracique',
    'difficulte a respirer',
    'essoufflement',
    'confusion severe',
    'paralysie',
    'faiblesse d\'un cote',
    'trouble de la parole',
    'saignement abondant',
    'perte de connaissance',
    'suicide',
    'idees suicidaires',
    'overdose',
    'reaction allergique severe',
    'gonflement de la gorge'
  ];

  const urgent = redFlags.some((k) => m.includes(k));

  const infectionHints = ['fievre', 'toux', 'mal de gorge', 'frissons', 'rhume'];
  const giHints = ['vomissement', 'diarrhee', 'maux de ventre', 'naus\u00e9e', 'naus\u00e9es'];
  const painHints = ['douleur', 'mal'];

  const categories: string[] = [];
  if (infectionHints.some((k) => m.includes(k))) categories.push('infection');
  if (giHints.some((k) => m.includes(k))) categories.push('digestif');
  if (painHints.some((k) => m.includes(k))) categories.push('douleur');

  return { urgent, categories } as const;
}

function buildResponse(message: string) {
  const { urgent, categories } = assessSeverity(message);

  if (urgent) {
    return (
      '?? Cela peut etre une urgence. Appelez immediatement les services d\'urgence (112/15) ou rendez-vous aux urgences.\n' +
      "Si des symptomes s'aggravent ou si vous etes seul(e), cherchez de l'aide maintenant."
    );
  }

  const prompts: string[] = [];
  if (categories.includes('infection')) {
    prompts.push("Avez-vous de la fievre (temperature > 38?C) ? Depuis quand ?");
  }
  if (categories.includes('digestif')) {
    prompts.push('Buvez-vous assez pour eviter la deshydratation ? Avez-vous du sang dans les selles ?');
  }
  if (categories.includes('douleur')) {
    prompts.push('Ou est la douleur (1 endroit), sur une echelle de 0 a 10, et depuis quand ?');
  }

  const generic =
    "Je peux vous proposer des conseils generaux. Ceci ne remplace pas l\"avis d\"un professionnel de sante. " +
    'Indiquez votre age, antecedents importants, et medicaments. Decrivez les symptomes, leur intensite, et leur evolution.';

  const advice =
    categories.length === 0
      ? 'Pouvez-vous preciser vos symptomes (localisation, debut, intensite, facteurs aggravants/soulageants) ?'
      : prompts.join(' ');

  const followUp =
    'Consultez un medecin rapidement si les symptomes persistent >48h, s\'aggravent, ou si vous avez un doute.';

  return `${generic}\n\n${advice}\n\n${followUp}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message: string = String(body?.message ?? '').slice(0, 2000);

    if (!message.trim()) {
      return NextResponse.json({ reply: "Decrivez vos symptomes pour commencer." }, { status: 200 });
    }

    const reply = buildResponse(message);
    return NextResponse.json({ reply }, { status: 200 });
  } catch {
    return NextResponse.json({ reply: 'Erreur lors du traitement. Reessayez.' }, { status: 200 });
  }
}
