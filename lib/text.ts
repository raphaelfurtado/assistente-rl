import type { Lang } from "./types";
import type { KbDoc } from "./kb";

export const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const EN = new Set("the my how is are can do does you what why your credits long i it with where when valid work".split(" "));
const ES = new Set("el los mi mis esta salio puedo ustedes usted tengo quiero cuanto marcador equivocado la las y es su nota cuando".split(" "));
const PT = new Set("o os meu minha nao voce voces vcs do da dos das um uma pra para quero gasta fica com e eu ao".split(" "));

// Detecção simples por palavras frequentes. Suficiente para decidir se as regras (só em português) se aplicam.
export function detectLang(text: string): Lang {
  const words = norm(text).split(/[^a-z]+/).filter(Boolean);
  let en = 0, es = 0, pt = 0;
  for (const w of words) {
    if (EN.has(w)) en++;
    if (ES.has(w)) es++;
    if (PT.has(w)) pt++;
  }
  if (en > pt && en >= es) return "en";
  if (es > pt && es > en) return "es";
  return "pt";
}

// Busca por palavras-chave. Com ~14 trechos, um banco vetorial seria overengineering.
export function retrieve(text: string, kb: KbDoc[], produto?: string, limit = 4): KbDoc[] {
  const toks = norm(text).split(/[^a-z0-9]+/).filter((t) => t.length > 3);
  return kb.map((d) => {
    const keys = norm(d.keys);
    const body = norm(d.text);
    let score = 0;
    for (const t of toks) {
      if (keys.includes(t)) score += 2;
      else if (body.includes(t)) score += 1;
    }
    if (produto && d.produto === produto) score += 2;
    return { d, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.d);
}
