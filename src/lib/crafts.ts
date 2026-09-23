/**
 * Textile crafts of North India. Used for the product "Craft" field, the
 * craft filter and the /crafts guide page. Add or edit entries here.
 */
export type Craft = {
  value: string;
  label: string;
  /** Name in Devanagari */
  hindi: string;
  region: string;
  summary: string;
  story: string;
};

export const crafts: Craft[] = [
  {
    value: "pashmina",
    label: "Pashmina",
    hindi: "पश्मीना",
    region: "Kashmir",
    summary: "The finest cashmere, hand-spun and hand-woven in Srinagar.",
    story:
      "Pashmina comes from the soft undercoat of Changthangi goats that graze the high plateaus of Ladakh. The fibre is combed by hand, spun on a wooden charkha and woven on handlooms in Srinagar. The finest are said to be light enough to pass through a ring, yet warm enough for a Himalayan winter.",
  },
  {
    value: "kani",
    label: "Kani",
    hindi: "कानी",
    region: "Kanihama, Kashmir",
    summary: "Tapestry-woven with small wooden bobbins, following a coded pattern.",
    story:
      "Kani shawls are woven with dozens of small wooden bobbins, the kanis, that carry each colour across the loom. Weavers follow a coded pattern called a talim, and a single shawl can take many months to finish. The craft is centred on the village of Kanihama near Srinagar.",
  },
  {
    value: "sozni",
    label: "Sozni",
    hindi: "सोज़नी",
    region: "Kashmir",
    summary: "Needle-fine embroidery of paisleys, chinar leaves and blossoms.",
    story:
      "Sozni, from the Persian word for needle, is embroidery worked in fine silk or wool thread. Artisans cover borders, and sometimes the whole shawl, with paisleys, chinar leaves and flowering vines. Stitches this fine can take weeks of work.",
  },
  {
    value: "jamawar",
    label: "Jamawar",
    hindi: "जामावार",
    region: "Kashmir",
    summary: "Richly patterned weaving once made for Mughal courts.",
    story:
      "Jamawar weaving covers the cloth in dense, colourful motifs, with the paisley (buta) at their heart. Mughal nobility prized these textiles and cut them into robes, which gave them the name: jama for robe, war for yardage.",
  },
  {
    value: "tilla",
    label: "Tilla",
    hindi: "तिल्ला",
    region: "Kashmir",
    summary: "Embroidery in gleaming gold and silver thread.",
    story:
      "Tilla is Kashmiri embroidery worked in metallic thread and couched onto the fabric by hand. It makes borders that glow in lamplight, which is why it is a favourite for weddings and festive evenings.",
  },
  {
    value: "kullu",
    label: "Kullu weave",
    hindi: "कुल्लू",
    region: "Kullu Valley, Himachal Pradesh",
    summary: "Bright geometric borders on warm mountain wool.",
    story:
      "In the Kullu Valley, weavers work bold geometric borders into warm wool, often in bright colours on a natural ground. Kullu shawls carry a Geographical Indication tag, which recognises their origin in Himachal Pradesh.",
  },
  {
    value: "phulkari",
    label: "Phulkari",
    hindi: "फुलकारी",
    region: "Punjab",
    summary: "“Flower work”: silk floss darned in radiant geometric blooms.",
    story:
      "Phulkari means flower work. Women in Punjab embroider it with untwisted silk floss in long darning stitches, building bright geometric flowers across the cloth. A phulkari was traditionally made for a daughter's wedding and handed down through the family.",
  },
  {
    value: "banarasi",
    label: "Banarasi",
    hindi: "बनारसी",
    region: "Varanasi, Uttar Pradesh",
    summary: "Lustrous silk brocade woven with zari.",
    story:
      "In Varanasi, weavers make silk brocades with zari (gold or silver thread) and motifs drawn from Mughal gardens: creepers, florals and small butis. Banarasi textiles are among the most treasured in India.",
  },
  {
    value: "chikankari",
    label: "Chikankari",
    hindi: "चिकनकारी",
    region: "Lucknow, Uttar Pradesh",
    summary: "Delicate shadow-work embroidery from the city of Nawabs.",
    story:
      "Chikankari is fine hand embroidery from Lucknow. It is traditionally white thread on pale muslin, and uses dozens of stitch types, including shadow work that glows softly through the cloth.",
  },
  {
    value: "bandhani",
    label: "Bandhani",
    hindi: "बांधनी",
    region: "Rajasthan",
    summary: "Tie-dye made by pinching and binding thousands of tiny dots.",
    story:
      "For bandhani, artisans pinch the fabric and bind thousands of tiny points with thread before each dye bath. When the threads are untied, the pattern appears as constellations of dots. The name comes from bandhan, to tie.",
  },
  {
    value: "block-print",
    label: "Hand block print",
    hindi: "हाथ छपाई",
    region: "Bagru & Sanganer, Rajasthan",
    summary: "Stamped by hand with carved wooden blocks and natural dyes.",
    story:
      "Printers carve motifs into blocks of sheesham wood and stamp them onto cloth by hand, one colour at a time. Small shifts in alignment are the signature of a human hand.",
  },
];

export function craftByValue(value?: string) {
  return value ? crafts.find((c) => c.value === value) : undefined;
}
