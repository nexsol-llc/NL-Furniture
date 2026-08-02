export type InfluencerProduct = {
  id: string;
  name: string;
  image: string | null;
  price: string;
  originalPrice?: string;
  hasPriceDrop?: boolean;
  productId?: string;
};

export type InfluencerFAQ = {
  question: string;
  answer: string;
};

export type InfluencerPost = {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  heroImage: string | null;
  caption: string;
  title: string;
  products: InfluencerProduct[];
  longContent: string;
  faqs: InfluencerFAQ[];
  similarCategories: string[];
  tags: string[];
};

const defaultFaqs = (title: string): InfluencerFAQ[] => [
  {
    question: `Wie kaufe ich die Produkte aus "${title}"?`,
    answer:
      'Klicken Sie auf ein Produkt in der "Shop this post"-Sektion. Sie werden direkt zum Partner-Shop weitergeleitet, wo Sie den Artikel kaufen können.',
  },
  {
    question: "Sind die gezeigten Preise aktuell?",
    answer:
      'Ja, wir aktualisieren die Preise regelmäßig mit unseren Partnerhändlern. Ein rotes "Price ↓"-Badge zeigt an, wenn ein Produkt gerade im Angebot ist.',
  },
  {
    question: 'Was bedeutet "Paid links"?',
    answer:
      "Einige Links auf dieser Seite sind Affiliate-Links. Wenn Sie über diese Links einkaufen, erhalten wir ggf. eine kleine Provision – für Sie entstehen keine Mehrkosten.",
  },
  {
    question: "Kann ich diesen Look in meinem Zuhause nachstellen?",
    answer:
      "Absolut! Alle gezeigten Möbel und Accessoires sind einzeln erhältlich. Nutzen Sie die ähnlichen Produkte weiter unten, um passende Alternativen zu entdecken.",
  },
];

export const influencerPosts: InfluencerPost[] = [
  {
    id: "e99676c3-6004-11f1-8760-0242ac11001c",
    username: "sherricalnanhome",
    displayName: "Sherri Calnan Home",
    avatar: null,
    heroImage: null,
    title: "Layered Coastal Bedroom",
    caption:
      "Layered coastal bedroom! This bedroom is all about almond layers, soft blues, and classic coastal textures. Shop every piece from this look below.",
    products: [
      { id: "p1", name: "Leinenvorhang Weiß", image: null, price: "€89,00", productId: "" },
      { id: "p2", name: "Massivholz Kommode", image: null, price: "€349,00", originalPrice: "€399,00", hasPriceDrop: true },
      { id: "p3", name: "Messing Gardinenstange", image: null, price: "€45,00" },
      { id: "p4", name: "Gardinenringe Schwarz", image: null, price: "€12,90" },
      { id: "p5", name: "Keramik Tischlampe", image: null, price: "€79,00", originalPrice: "€99,00", hasPriceDrop: true },
      { id: "p6", name: "Landschaftsbild Gerahmt", image: null, price: "€59,00" },
      { id: "p7", name: "Dekokissen Set Blau", image: null, price: "€39,90" },
      { id: "p8", name: "Strick-Plaid Blau", image: null, price: "€49,00" },
      { id: "p9", name: "Rippenvase Weiß", image: null, price: "€29,00" },
      { id: "p10", name: "Polsterstuhl Creme", image: null, price: "€189,00" },
      { id: "p11", name: "Wollteppich Beige", image: null, price: "€129,00", originalPrice: "€159,00", hasPriceDrop: true },
      { id: "p12", name: "Nachttisch Lampe", image: null, price: "€65,00" },
    ],
    longContent: `Dieser Look vereint zeitlose Küsteneleganz mit modernem Komfort. Die warmen Mandeltöne der Wände und Möbel schaffen eine einladende Basis, während sanfte Blautöne in Textilien und Accessoires für frische Akzente sorgen.

**Schichten schaffen Tiefe**
Der Schlüssel zu diesem Schlafzimmer-Look liegt in der Schichtung: Leinenvorhänge, ein strukturiertes Plaid und gemusterte Kissen verleihen dem Raum Wärme und Charakter – ohne ihn zu überladen.

**Natürliche Materialien**
Massivholz, Keramik und Leinen dominieren diesen Look. Diese Materialien altern wunderschön und passen perfekt zu einem nachhaltigen Einrichtungsstil.

**Kleine Details, große Wirkung**
Von der Messing-Gardinenstange bis zur gerippten Vase – es sind die Details, die einen Raum von schön zu unvergesslich machen. Jedes Stück in diesem Look wurde sorgfältig ausgewählt, um Harmonie und Funktionalität zu vereinen.`,
    faqs: defaultFaqs("Layered Coastal Bedroom"),
    similarCategories: ["Schlafzimmer", "Wohnzimmer", "Dekoration"],
    tags: ["Coastal", "Schlafzimmer", "Interior Design", "Wohnideen"],
  },
  {
    id: "modern-dining-look",
    username: "nl-furniture",
    displayName: "NL FURNITURE",
    avatar: null,
    heroImage: null,
    title: "Modernes Esszimmer",
    caption:
      "Ein modernes Esszimmer mit warmen Holztönen und minimalistischem Design. Shoppe alle Möbel aus diesem Look.",
    products: [
      { id: "d1", name: "Esstisch Eiche", image: null, price: "€599,00" },
      { id: "d2", name: "Esszimmerstuhl Set", image: null, price: "€249,00", hasPriceDrop: true, originalPrice: "€299,00" },
      { id: "d3", name: "Pendelleuchte Messing", image: null, price: "€129,00" },
      { id: "d4", name: "Sideboard Natur", image: null, price: "€449,00" },
      { id: "d5", name: "Teppich Unter Esstisch", image: null, price: "€89,00" },
      { id: "d6", name: "Wandregal Eiche", image: null, price: "€79,00" },
    ],
    longContent: `Modernes Esszimmer-Design trifft auf gemütliche Wohnlichkeit. Dieser Look zeigt, wie warme Holztöne und klare Linien einen einladenden Essbereich schaffen.

**Der Esstisch als Mittelpunkt**
Ein massiver Eichentisch bildet das Herzstück. Seine natürliche Maserung bringt Wärme in den Raum und passt zu vielen Stilen.

**Beleuchtung mit Charakter**
Eine Messing-Pendelleuchte setzt einen eleganten Akzent über dem Tisch und sorgt für die richtige Atmosphäre beim Abendessen.`,
    faqs: defaultFaqs("Modernes Esszimmer"),
    similarCategories: ["Esszimmer", "Stühle", "Beleuchtung"],
    tags: ["Esszimmer", "Modern", "Holz", "Einrichtung"],
  },
];

export function getInfluencerPost(username: string, id: string): InfluencerPost | undefined {
  return influencerPosts.find((p) => p.username === username && p.id === id);
}

export function getPostsByUsername(username: string): InfluencerPost[] {
  return influencerPosts.filter((p) => p.username === username);
}
