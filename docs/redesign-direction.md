# Gary Lai — website redesign direction

Status: proposed direction for implementation

Primary goal: build a durable personal brand around **Gary Lai**

## 1. Brand position

The site should introduce Gary as a thoughtful builder with technical depth,
product judgment, and a clear point of view. Engineering is evidence of the
brand, not the visual theme of the brand.

### Desired first impression

> Gary builds thoughtful products and writes about the systems behind them.

The experience should feel calm, precise, and self-assured: closer to an
independent founder's publication than a developer portfolio.

### Naming hierarchy

1. **Gary Lai** — the public-facing name and primary wordmark.
2. **laigary.com** — the domain and handle, used in metadata and the footer.
3. **Unconstrained** — available as an editorial idea or future newsletter
   title, but not the primary site identity.

### Voice

- Direct rather than promotional.
- Curious rather than authoritative for its own sake.
- Specific rather than filled with startup language.
- Personal, but not diary-like.
- Technical when the subject requires it, never as decoration.

## 2. Information architecture

The public navigation should contain three primary destinations:

| Destination | Purpose                                                    |
| ----------- | ---------------------------------------------------------- |
| **Writing** | Essays and technical notes in one discoverable collection. |
| **Work**    | A small selection of products, projects, and experiments.  |
| **About**   | Gary's focus, background, and ways to get in touch.        |

Search, locale, and theme are utilities, not peer navigation items.

### Proposed sitemap

```text
/
├── writing
│   ├── all
│   ├── essays
│   ├── notes
│   └── topic/<slug>
├── work
│   └── <slug>
└── about
```

The initial implementation does not need to migrate stored content or break
existing URLs. `/posts/<slug>` and `/interview/<section>/<slug>` can remain the
canonical detail URLs while `/writing` becomes their shared discovery layer.
The existing `/posts`, `/interview`, `/works`, `/labs`, and `/tags` URLs should
continue to resolve during the transition.

### Writing taxonomy

Content type answers **what kind of piece this is**:

- **Essay** — an authored argument, experience, or longer-form article.
- **Note** — a focused technical reference or learning artifact, including the
  existing interview-preparation library.

Topic answers **what it is about**. Existing tags and interview sections can
power topic filters without being promoted to primary navigation.

“Interview” should no longer be a top-level identity. It may appear as a topic
or archive label on older notes where that context is genuinely useful.

## 3. Experience principles

### Content before filing system

Do not ask visitors to understand the CMS model. Posts and interview notes
should appear together, ordered by publication date, with a quiet content-type
label that preserves context.

### Editorial, not dashboard-like

Avoid a grid of interchangeable cards. Use typography, rhythm, and a restrained
rule system to create hierarchy. Lists should remain easy to scan without
looking like database tables.

### One global shell

Writing, notes, work, and about should share one header, one search surface,
and one footer. Entering a note must not feel like entering a separate site.

### Progressive disclosure

The first screen explains who Gary is and offers a small number of strong next
steps. Counts, complete taxonomies, archives, and secondary utilities appear
only after visitors express intent.

## 4. Visual direction: Quiet Founder

### Characteristics

- Warm, near-white default canvas rather than terminal black.
- Ink-like foreground color instead of pure black.
- Generous vertical rhythm and a narrow, comfortable reading measure.
- A humanist sans-serif for interface and body copy.
- A restrained serif accent for selected display moments, if bilingual
  rendering remains equally strong.
- Monospace reserved for code, compact metadata, and rare technical details.
- One low-saturation accent color.
- Minimal borders, no ornamental shadows, and no “window chrome.”
- Motion limited to fast opacity, underline, and small positional transitions.

### Draft tokens

These are targets, not final production values.

| Token   | Light     | Dark      | Use                         |
| ------- | --------- | --------- | --------------------------- |
| Canvas  | `#F7F6F2` | `#171816` | Page background             |
| Surface | `#FFFFFF` | `#20211F` | Sparse elevated regions     |
| Ink     | `#20211F` | `#ECECE7` | Primary text                |
| Muted   | `#6F716B` | `#A6A79F` | Metadata and secondary copy |
| Rule    | `#DEDED7` | `#343630` | Dividers                    |
| Accent  | `#365F4B` | `#8DB69F` | Links and selected states   |

### Typography targets

- Body: `16–18px`, approximately `1.7` line height.
- Reading measure: `64–70ch`.
- Home statement: fluid `clamp(2.5rem, 6vw, 5.25rem)` with compact leading.
- Navigation and metadata: smaller than body, but never below a comfortable
  mobile reading size.
- Chinese copy must receive deliberate line breaking and must not inherit
  overly loose Latin letter spacing.

### What is intentionally removed

- Terminal traffic-light controls.
- Persistent path and prompt breadcrumb.
- `$ whoami`, `$ cat`, `$ cd`, and filesystem language as primary UI copy.
- A monospace typeface across the entire public site.
- Green-on-black as the default brand signature.
- Tags and Labs as first-level navigation items.

Technical character can survive in code blocks, search shortcuts, metadata,
and a subtle footer detail without controlling the whole experience.

## 5. Core page wireframes

### Home

```text
Gary Lai                         Writing    Work    About    Search
────────────────────────────────────────────────────────────────

I build thoughtful products
and write about the systems
behind them.

A concise introduction: current focus, product perspective, and the
kind of problems Gary cares about.

Explore my writing  →


Selected writing

Essay       A meaningful article title                     2026
Note        A focused technical note                        2025
Essay       Another article that expresses a point of view  2025

View all writing  →


Selected work

Project name
A short, outcome-oriented description rather than a stack list.

Project name
A short explanation of the problem and Gary's contribution.


Currently
A brief, editable sentence about what Gary is exploring or building.

────────────────────────────────────────────────────────────────
GitHub    LinkedIn    Email                      © Gary Lai
```

The page should not lead with content counts or a directory listing. The main
statement, introduction, selected writing, and selected work establish the
brand in that order.

### Writing index

```text
Writing

Ideas, technical notes, and lessons from building products.

All    Essays    Notes                         Search writing
────────────────────────────────────────────────────────────

2026

Essay · Product
Article title
One concise excerpt that helps a reader decide whether to open it.     Jan 12

Note · System design
Technical note title                                                  Jan 04

2025

Essay · Engineering
Article title                                                         Dec 18
```

Requirements:

- Essays and notes share one chronological stream.
- Type and topic remain visible but secondary to the title.
- Search covers both content models from the same surface.
- Filters are URL-addressable and work on mobile.
- Pagination remains server-driven for collections that can grow large.

### Article or note

```text
Writing / Topic

Article title with a comfortable,
editorial line length

Essay · 12 Jan 2026 · 8 min read

Optional excerpt or standfirst.

────────────────────────────────────

Article body...

                               On this page
                               Section one
                               Section two

────────────────────────────────────
Topics: Product, Systems

Previous article                         Next article
```

Notes and essays should use the same reading shell. A content-type label is
enough differentiation; a note should not switch the reader into another
brand or navigation system.

### Work

Work is curated rather than exhaustive. Each item should prioritize the
problem, outcome, and Gary's role. Technology belongs in supporting metadata.

### About

Recommended sequence:

1. A direct portrait or typographic opening.
2. Short present-tense biography.
3. Current interests and strengths.
4. Selected career or building history.
5. Contact and social links.

## 6. Identity and logo

### Primary wordmark

Use **Gary Lai** as a text-first wordmark. The initial implementation should
avoid a decorative logo font; spacing and one carefully selected type family
should do most of the work.

### GL monogram brief

The supporting mark should:

- Combine `G` and `L` in one continuous or interlocking construction.
- Work at `16px` as a favicon and at social-avatar size.
- Use one color and remain identifiable when reversed.
- Feel editorial or architectural rather than “tech startup.”
- Avoid brackets, angle brackets, hexagons, terminal prompts, and gradients.

Three forms to sketch before choosing one:

1. **Open G** — the horizontal stroke extends down to become the stem of `L`.
2. **Framed initials** — a light rectangular frame remains open at one corner,
   expressing the old “Unconstrained” idea without writing the name.
3. **Ligature** — a typographic `GL` with a shared vertical stroke, optimized
   for small sizes rather than used as a large hero graphic.

The wordmark should be approved before the monogram is polished. A symbol must
support recognition of Gary's name, not replace it prematurely.

## 7. Responsive behavior

- The full wordmark remains visible on mobile; do not reduce the identity to an
  unexplained icon on first visit.
- Primary navigation may collapse behind a conventional menu at narrow widths.
- Search remains a visible icon with an accessible label.
- Writing filters scroll horizontally only as a last resort; wrapping is
  preferable when labels remain short.
- Article side navigation becomes an inline disclosure below the heading.
- Hover is enhancement only. Every interaction must remain clear by focus and
  touch.

## 8. Accessibility and performance

- Maintain WCAG AA contrast for text and controls in both themes.
- Preserve visible focus states and skip navigation.
- Respect `prefers-reduced-motion`.
- Keep semantic headings and descriptive link labels.
- Avoid shipping a font weight that has no clear use.
- Prefer self-hosted, subsetted fonts and preserve the current SSR-first model.
- Keep existing edge-cache boundaries and scheduled-publishing behavior.

## 9. Implementation sequence

### Phase 1 — shared identity and shell

- Introduce the Gary Lai wordmark.
- Replace terminal window chrome with the global navigation.
- Establish the new tokens, typography, width system, footer, and responsive
  behavior.
- Give the interview routes the same global shell as the rest of the site.
- Keep existing routes and data models intact.

### Phase 2 — unified Writing discovery

- Add `/writing` as the shared index for posts and notes.
- Add server-side type, topic, page, and query filters.
- Search posts and notes together.
- Keep legacy list routes available, then decide whether they should redirect.

### Phase 3 — page redesign

- Rebuild Home around positioning, selected writing, and selected work.
- Unify the essay and note reading shells.
- Redesign Work and About using the same editorial system.
- Restyle Tags and Labs as secondary pages.

### Phase 4 — identity assets and polish

- Draw and test the selected GL monogram.
- Produce favicon and social-avatar variants.
- Update OG templates to the new identity.
- Audit bilingual line breaks, focus states, reduced motion, and Core Web
  Vitals.

## 10. Acceptance criteria

The redesign is successful when:

- A first-time visitor can identify Gary and his focus without opening another
  page.
- Posts and interview notes are discoverable from one Writing page and one
  search experience.
- Entering an old interview note does not switch to a different site identity.
- The primary navigation has no more than three content destinations.
- The interface no longer depends on terminal metaphors to communicate its
  hierarchy.
- English and Traditional Chinese versions both feel intentionally typeset.
- Existing public detail URLs and publishing visibility rules continue to
  work.
