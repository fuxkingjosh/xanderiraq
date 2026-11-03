/* XanderIraq catalog. Add a product by copying an object in PRODUCTS.
   Drop screenshots in public/images/ and schematic files in public/downloads/.
   stripePaymentLink is the public Payment Link URL (https://buy.stripe.com/...).
   Leave it "" until it exists. Never put a Stripe secret key in this file.

   images: [{ src: "images/example.jpg", alt: "East wall", width: 1600, height: 900 }]
   video: a YouTube id, or "".
   files[].href: a path such as "downloads/example.litematic", or "" if not uploaded yet.
   versions: Minecraft versions this file supports, or ["any"] for photos and kits.
   sizeClass: "small" | "medium" | "large" (used by the shop filter).
   size: { x, y, z, blocks } for schematics. Omit blocks you don't have.
   deal: "" | "3-for-2" | "starter-kit". includes: product ids inside a bundle.
   compareAt: full price before the deal. 0 if there is no discount.
   sample: true hides it from the shop and uses the free-sample email gate.
*/
window.XI_CATALOG = {
  web3formsKey: "21ad7332-886a-40fb-9041-4ee5e11c9c19",
  analyticsToken: "",
  currency: "USD",
  perPage: 6,
  instagram: "https://www.instagram.com/epicwatch6/",
  instagramHandle: "@epicwatch6",
  youtube: "",
  showcaseVideo: "",
  products: [
    {
      id: "spawn-castle",
      cat: "Schematics",
      name: "Obsidian Spawn Castle",
      desc: "Fortified keep with ender-chest vault and nether portal room.",
      price: 12,
      compareAt: 0,
      featured: false,
      sample: false,
      deal: "",
      includes: [],
      versions: ["1.20", "1.21"],
      sizeClass: "large",
      size: { x: 87, y: 64, z: 91, blocks: 212000 },
      spec: ["87×64×91", "212k blocks", "1.20+"],
      included: [".schem file", ".litematic file", "Block list", "Personal-use license"],
      images: [],
      video: "",
      stripePaymentLink: "",
      files: [
        { name: "Obsidian Spawn Castle.litematic", href: "" },
        { name: "Obsidian Spawn Castle.schem", href: "" }
      ],
      colors: ["#2b2140", "#6c4fb0", "#e0811b"]
    },
    {
      id: "stash-hall",
      cat: "Schematics",
      name: "Hidden Stash Hall",
      desc: "Underground storage hall, 432 double chests, item sorter built in.",
      price: 8,
      compareAt: 0,
      featured: false,
      sample: false,
      deal: "",
      includes: [],
      versions: ["1.20", "1.21"],
      sizeClass: "small",
      size: { x: 48, y: 12, z: 60, blocks: 38000 },
      spec: ["48×12×60", "38k blocks", "1.20+"],
      included: [".schem file", ".litematic file", "Sorter layout notes", "Personal-use license"],
      images: [],
      video: "",
      stripePaymentLink: "",
      files: [
        { name: "Hidden Stash Hall.litematic", href: "" },
        { name: "Hidden Stash Hall.schem", href: "" }
      ],
      colors: ["#1f2a24", "#3f7a5a", "#d6c27a"]
    },
    {
      id: "mapart",
      cat: "Schematics",
      name: "Map Art Starter Pack",
      desc: "Six 128×128 map arts with block lists and staircase layouts.",
      price: 6,
      compareAt: 0,
      featured: true,
      sample: false,
      deal: "",
      includes: [],
      versions: ["1.19", "1.20", "1.21"],
      sizeClass: "medium",
      size: { x: 128, y: 1, z: 128, blocks: 98304 },
      spec: ["6 maps", "flat + stair", "1.19+"],
      included: ["6 map schematics", ".schem and .litematic", "Block lists", "Staircase layouts"],
      images: [],
      video: "",
      stripePaymentLink: "",
      files: [
        { name: "Map Art Starter Pack.zip", href: "" }
      ],
      colors: ["#1d3047", "#3b79c2", "#f2d16b"]
    },
    {
      id: "ruins-photo",
      cat: "Photos",
      name: "Overworld Ruins Set",
      desc: "24 cinematic shader screenshots of abandoned bases, 4K.",
      price: 5,
      compareAt: 0,
      featured: true,
      sample: false,
      deal: "",
      includes: [],
      versions: ["any"],
      sizeClass: "medium",
      size: null,
      spec: ["24 images", "3840×2160", "PNG"],
      included: ["24 PNG screenshots", "3840×2160", "Personal-use license"],
      images: [],
      video: "",
      stripePaymentLink: "",
      files: [
        { name: "Overworld Ruins Set.zip", href: "" }
      ],
      colors: ["#3a2a1c", "#b5703a", "#f3c98b"]
    },
    {
      id: "nether-photo",
      cat: "Photos",
      name: "Nether Highway Set",
      desc: "18 wide shots along the highways, good for wallpapers and thumbnails.",
      price: 4,
      compareAt: 0,
      featured: false,
      sample: false,
      deal: "",
      includes: [],
      versions: ["any"],
      sizeClass: "small",
      size: null,
      spec: ["18 images", "3840×2160", "PNG"],
      included: ["18 PNG screenshots", "3840×2160", "Personal-use license"],
      images: [],
      video: "",
      stripePaymentLink: "",
      files: [
        { name: "Nether Highway Set.zip", href: "" }
      ],
      colors: ["#3b1414", "#c0392b", "#f39c4a"]
    },
    {
      id: "thumb-kit",
      cat: "Packs",
      name: "YouTube Thumbnail Kit",
      desc: "Layered backgrounds, block icons and fonts for build videos.",
      price: 7,
      compareAt: 0,
      featured: true,
      sample: false,
      deal: "",
      includes: [],
      versions: ["any"],
      sizeClass: "medium",
      size: null,
      spec: ["40 assets", "PSD + PNG"],
      included: ["40 layered assets", "PSD and PNG files", "Block icons and fonts"],
      images: [],
      video: "",
      stripePaymentLink: "",
      files: [
        { name: "YouTube Thumbnail Kit.zip", href: "" }
      ],
      colors: ["#141c2e", "#e0811b", "#eef0f5"]
    },
    {
      id: "tex-pack",
      cat: "Packs",
      name: "Muted Stone Texture Pack",
      desc: "16× pack that tones down stone, deepslate and cobble for cleaner builds.",
      price: 3,
      compareAt: 0,
      featured: false,
      sample: false,
      deal: "",
      includes: [],
      versions: ["1.21"],
      sizeClass: "small",
      size: null,
      spec: ["16×", "Java 1.21"],
      included: ["16× resource pack", "Stone, deepslate, and cobble", "pack.mcmeta for Java 1.21"],
      images: [],
      video: "",
      stripePaymentLink: "",
      files: [
        { name: "Muted Stone Texture Pack.zip", href: "" }
      ],
      colors: ["#2c2f36", "#7a8091", "#c9ccd4"]
    },
    {
      id: "schematic-trio",
      cat: "Bundles",
      name: "Schematic 3-for-2",
      desc: "Obsidian Spawn Castle, Hidden Stash Hall, and the Map Art Starter Pack. The cheapest of the three is included.",
      price: 20,
      compareAt: 26,
      featured: false,
      sample: false,
      deal: "3-for-2",
      includes: ["spawn-castle", "stash-hall", "mapart"],
      versions: ["1.20", "1.21"],
      sizeClass: "medium",
      size: null,
      spec: ["3 builds", "Cheapest included", "1.20+"],
      included: ["Obsidian Spawn Castle", "Hidden Stash Hall", "Map Art Starter Pack", "One checkout for all three"],
      images: [],
      video: "",
      stripePaymentLink: "",
      files: [],
      colors: ["#2b2140", "#3f7a5a", "#e0811b"]
    },
    {
      id: "starter-kit",
      cat: "Bundles",
      name: "Builder Starter Kit",
      desc: "A spawn castle, a 4K ruin photo set, and the muted stone pack. One download, one payment.",
      price: 16,
      compareAt: 20,
      featured: false,
      sample: false,
      deal: "starter-kit",
      includes: ["spawn-castle", "ruins-photo", "tex-pack"],
      versions: ["1.21"],
      sizeClass: "medium",
      size: null,
      spec: ["Build + photos + pack", "Save $4", "1.21"],
      included: ["Obsidian Spawn Castle", "Overworld Ruins Set", "Muted Stone Texture Pack", "One checkout for the set"],
      images: [],
      video: "",
      stripePaymentLink: "",
      files: [],
      colors: ["#e0811b", "#b5703a", "#7a8091"]
    },
    {
      id: "sample-watchtower",
      cat: "Schematics",
      name: "Sample Watchtower",
      desc: "A small tower you can paste before you buy a full build. Free after an email signup.",
      price: 0,
      compareAt: 0,
      featured: false,
      sample: true,
      deal: "",
      includes: [],
      versions: ["1.20", "1.21"],
      sizeClass: "small",
      size: { x: 11, y: 18, z: 11, blocks: 900 },
      spec: ["11×18×11", "Sample", "1.20+"],
      included: ["Sample notes until the .litematic is added", "Install pointers for Litematica and WorldEdit"],
      images: [],
      video: "",
      stripePaymentLink: "",
      files: [
        { name: "Sample pack notes", href: "downloads/sample-pack.txt" }
      ],
      colors: ["#3a2a1c", "#e0811b", "#f6f1e8"]
    }
  ],
  reviews: [
    {
      id: "placeholder-castle",
      productId: "spawn-castle",
      author: "Sample reviewer",
      rating: 5,
      text: "Placeholder review for the spawn castle. Not a real customer. Replace this after someone actually buys it.",
      placeholder: true
    },
    {
      id: "placeholder-ruins",
      productId: "ruins-photo",
      author: "Sample reviewer",
      rating: 4,
      text: "Placeholder review for the ruins set. The stars are made up so the layout can be checked.",
      placeholder: true
    },
    {
      id: "placeholder-kit",
      productId: "starter-kit",
      author: "Sample reviewer",
      rating: 5,
      text: "Placeholder review for the starter kit. Swap this for a real note when you have one.",
      placeholder: true
    }
  ]
};
