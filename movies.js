/*
  MOCTALE TOP 100 DATA

  Keep exactly 100 entries.
  Each entry:
    { rank: 1, title: "Movie name", year: 2019 }

  I have intentionally NOT fabricated Moctale's current Top 100.
  The public Moctale page does not expose the Top 100 list in its indexed
  page data. Paste/export the exact 100 entries here when available.

  The UI works with rank-only data until titles are filled.
*/

const MOVIES = Array.from({ length: 100 }, (_, i) => ({
  rank: i + 1,
  title: `Moctale #${i + 1}`,
  year: ""
}));
