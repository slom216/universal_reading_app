import { Link } from 'react-router-dom';
import { LANG_IDS, LANGS } from '../languages';
import heroArt from '../assets/art/hero-reading.webp';
import artA1 from '../assets/art/level-a1-family.webp';
import artA2 from '../assets/art/level-a2-travel.webp';

const SECTIONS = [
  {
    to: '/reading',
    art: { src: artA2, width: 404, height: 167 },
    chip: 'A1–B1',
    title: 'Reading',
    blurb:
      'Graded texts set where the language is spoken, with a glossary and a short quiz after each one.',
    meta: '300 texts per language',
    cta: 'Start reading',
  },
  {
    to: '/phrases',
    art: { src: artA1, width: 410, height: 167 },
    chip: 'Phrasebook',
    title: 'Everyday phrases',
    blurb:
      'The 1000 phrases you need most, from “Hello” to “Good luck with everything”, ordered by how useful they are.',
    meta: '1000 phrases per language',
    cta: 'Learn phrases',
  },
];

export function HubPage() {
  return (
    <div className="stack">
      <section className="hero">
        <div className="hero__copy">
          <p className="eyebrow">Eight languages, A1 to B1</p>
          <h1>
            Learn a language <span className="hero__accent">one step at a time.</span>
          </h1>
          <p className="lead">
            {LANG_IDS.map((id) => LANGS[id].name).join(', ')}. Read graded stories, or
            start with the phrases you will use on your first day.
          </p>
        </div>
        <img className="hero__art" src={heroArt} alt="" width={743} height={371} />
      </section>

      <div className="level-grid level-grid--two">
        {SECTIONS.map((s) => (
          <article key={s.to} className="card level-card">
            <div className="level-card__frame">
              <img
                className="level-card__art"
                src={s.art.src}
                alt=""
                width={s.art.width}
                height={s.art.height}
              />
            </div>
            <span className="chip">{s.chip}</span>
            <h2>{s.title}</h2>
            <p className="level-card__blurb">{s.blurb}</p>
            <p className="level-card__meta">{s.meta}</p>
            <div className="level-card__actions">
              <Link className="button button--primary" to={s.to}>
                {s.cta}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
