import { Link } from 'react-router-dom';
import { WORD_RANGE } from '../content/schema';

/** `/about`: who makes Polyglot and how its content is made and checked. */
export function AboutPage() {
  return (
    <div className="stack reader about">
      <h1>About Polyglot</h1>
      <p className="lead">
        Polyglot is made by Slobodan Markovic as part of{' '}
        <a href="https://deulern.com">DeuLern</a>. It is free graded reading and everyday
        language practice in fifteen languages.
      </p>

      <section className="stack stack--tight" aria-labelledby="ai-heading">
        <h2 id="ai-heading">How the content is made</h2>
        <p>
          The reading texts, quiz questions, glossaries, phrase translations and{' '}
          <Link to="/pronunciation">pronunciation rules</Link> were written with the help of
          AI. Most German texts were adapted from Lese Reise, an earlier DeuLern reading app;
          the rest were written with AI like the other languages.
        </p>
        <p>The audio narration uses AI-generated voices.</p>
      </section>

      <section className="stack stack--tight" aria-labelledby="review-heading">
        <h2 id="review-heading">How it is checked</h2>
        <p>All content passes automated checks before it is published:</p>
        <ul>
          <li>
            each text has the length of its level ({WORD_RANGE.A1.join('–')} words at A1,{' '}
            {WORD_RANGE.B1.join('–')} at B1) and five to eight quiz questions;
          </li>
          <li>every glossary word appears in the text it belongs to;</li>
          <li>every phrase is translated and keeps its [placeholders];</li>
          <li>
            Chinese, Hindi, Serbian and Interslavic use only the letters of their standard
            alphabet;
          </li>
          <li>
            each pronunciation rule matches words in the texts and is listed by how often it
            occurs.
          </li>
        </ul>
        <p>
          These checks catch mistakes of form, not of meaning. The content has not been
          reviewed by native speakers.
        </p>
        <p>
          <b>There are almost certainly mistakes</b> in the texts, translations and
          pronunciation rules: wrong words, grammar errors or phrasing a native speaker would
          not use. We are working on finding and fixing them. Until then, use Polyglot as
          practice material alongside other sources.
        </p>
      </section>
    </div>
  );
}
