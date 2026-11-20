/**
 * American spelling for option names shown on the website (e.g. an Etsy colour "Heather Grey" shows as
 * "Heather Gray"). Only for display: the admin, Etsy and Meta keep the names as they are, so matching an
 * option by name (Meta content IDs, ?color= links) runs both sides through this first.
 */
const WORDS: Record<string, string> = {
  grey: "gray",
  greys: "grays",
  greyish: "grayish",
  colour: "color",
  colours: "colors",
  coloured: "colored",
  multicoloured: "multicolored",
  multicolour: "multicolor",
  colourful: "colorful",
  centre: "center",
  metre: "meter",
  metres: "meters",
  fibre: "fiber",
  woollen: "woolen",
  jewellery: "jewelry",
  favourite: "favorite",
};
const RE = new RegExp(`\\b(${Object.keys(WORDS).join("|")})\\b`, "gi");

/** "Heather Grey" → "Heather Gray", "heather-grey" → "heather-gray"; keeps the original's capitals. */
export function american(text: string): string {
  return text.replace(RE, (w) => {
    const to = WORDS[w.toLowerCase()];
    if (w === w.toUpperCase()) return to.toUpperCase();
    if (w[0] === w[0].toUpperCase()) return to[0].toUpperCase() + to.slice(1);
    return to;
  });
}
