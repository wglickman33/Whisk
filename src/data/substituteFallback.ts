import { SOURCING_NOTE_ANIMAL_DERIVED, type SubstituteOption } from "../types/dietary";

type FlagOverrides = Partial<Omit<SubstituteOption, "text">>;

/** Defaults assume plant-based / free of common allergens unless overridden. */
function s(text: string, flags: FlagOverrides = {}): SubstituteOption {
  return {
    text,
    dairyFree: flags.dairyFree ?? true,
    glutenFree: flags.glutenFree ?? true,
    nutFree: flags.nutFree ?? true,
    soyFree: flags.soyFree ?? true,
    vegetarian: flags.vegetarian ?? true,
    vegan: flags.vegan ?? true,
    ...(flags.sourcingNote ? { sourcingNote: flags.sourcingNote } : {}),
  };
}

const dairy: FlagOverrides = { dairyFree: false, vegan: false };
const egg: FlagOverrides = { vegan: false };
const gluten: FlagOverrides = { glutenFree: false };
const soy: FlagOverrides = { soyFree: false };
const nut: FlagOverrides = { nutFree: false };
const meat: FlagOverrides = { vegetarian: false, vegan: false };
const honey: FlagOverrides = { vegan: false };
const animalMaybe: FlagOverrides = { sourcingNote: SOURCING_NOTE_ANIMAL_DERIVED };

export const substituteFallback: Record<string, SubstituteOption[]> = {
  "balsamic vinegar": [
    s("red wine vinegar + a pinch of sugar"),
    s("apple cider vinegar + a splash of soy sauce", soy),
  ],
  "red wine vinegar": [
    s("apple cider vinegar (1:1)"),
    s("balsamic vinegar, use slightly less"),
  ],
  "apple cider vinegar": [
    s("white wine vinegar (1:1)"),
    s("lemon juice (1:1)"),
  ],
  "white vinegar": [
    s("apple cider vinegar (1:1)"),
    s("lemon juice (1:1)"),
  ],
  buttermilk: [
    s("1 cup milk + 1 tbsp lemon juice or white vinegar, rested 5-10 min", dairy),
    s("1 cup plain yogurt thinned with a splash of milk", dairy),
    s("1 cup unsweetened oat milk + 1 tbsp lemon juice, rested 5-10 min"),
  ],
  "heavy cream": [
    s("3/4 cup milk + 1/4 cup melted butter (for cooking, not whipping)", dairy),
    s("evaporated milk (for cooking, not whipping)", dairy),
    s("full-fat coconut cream (1:1, for cooking)"),
  ],
  milk: [
    s("water + 2 tbsp powdered milk per cup", dairy),
    s("unsweetened plant milk (1:1) for most recipes"),
  ],
  "sour cream": [
    s("plain Greek yogurt (1:1)", dairy),
    s("buttermilk (thinner, best in baking)", dairy),
    s("unsweetened coconut yogurt (1:1)"),
  ],
  "cream cheese": [
    s("mascarpone (1:1)", dairy),
    s("thick Greek yogurt (for dips/spreads, not baking)", dairy),
    s("thick coconut cream cheese-style spread (for dips/spreads)"),
  ],
  "baking powder": [
    s("1/4 tsp baking soda + 1/2 tsp cream of tartar per 1 tsp baking powder"),
  ],
  "cream of tartar": [
    s("1.5 tsp baking powder replaces 1 tsp cream of tartar (for leavening use)"),
    s("lemon juice or white vinegar, 1 tsp replaces 1/2 tsp (for stabilizing egg whites)"),
  ],
  "baking soda": [
    s("3x the amount of baking powder (adjust salt down, result will be less strong-rising)"),
  ],
  cornstarch: [
    s("all-purpose flour, 2 tbsp per 1 tbsp cornstarch, mixed to a paste first", gluten),
    s("arrowroot powder (1:1)"),
  ],
  "all-purpose flour (for thickening)": [
    s("cornstarch, half the amount called for in flour"),
  ],
  "self-rising flour": [
    s("1 cup all-purpose flour + 1.5 tsp baking powder + 1/4 tsp salt", gluten),
  ],
  "egg (baking, binder)": [
    s("1 tbsp ground flaxseed + 3 tbsp water, rested 5 min, per egg"),
    s("1/4 cup unsweetened applesauce per egg (adds moisture, less structure)"),
  ],
  "egg (baking, leavening/structure heavy - cakes, souffles)": [
    s("aquafaba (liquid from canned chickpeas), 3 tbsp per egg, whipped"),
  ],
  "brown sugar": [
    s("1 cup white sugar + 1 tbsp molasses"),
  ],
  molasses: [
    s("dark brown sugar dissolved in a little water"),
    s("honey (flavor will differ, use slightly less)", honey),
  ],
  honey: [
    s("sugar + a little extra liquid to match consistency (honey is sweeter, use slightly less sugar)"),
  ],
  "granulated sugar": [
    s("brown sugar (1:1, adds moisture)"),
    s("honey, 3/4 cup per 1 cup sugar, reduce other liquids slightly", honey),
  ],
  "vegetable oil": [
    s("melted butter (1:1)", dairy),
    s("canola oil (1:1)"),
  ],
  "canola oil": [
    s("vegetable oil (1:1)"),
    s("melted coconut oil (1:1)"),
  ],
  "butter (baking)": [
    s("margarine (1:1)", { ...dairy, sourcingNote: SOURCING_NOTE_ANIMAL_DERIVED }),
    s("vegetable oil, 3/4 the amount (for moisture, texture will differ)"),
  ],
  "olive oil": [
    s("vegetable oil or canola oil (1:1) for cooking, flavor will differ"),
  ],
  "garlic clove": [
    s("1/8 tsp garlic powder per clove"),
    s("1/2 tsp jarred minced garlic per clove"),
  ],
  "garlic powder": [
    s("1 fresh garlic clove, minced, per 1/8 tsp powder"),
  ],
  "onion (fresh)": [
    s("1 tbsp onion powder per medium onion"),
    s("2-3 tbsp dried minced onion, rehydrated"),
  ],
  "onion powder": [
    s("fresh onion, finely minced, use about 4x the volume"),
  ],
  shallot: [
    s("yellow onion + small garlic clove, both finely minced"),
  ],
  "fresh ginger": [
    s("1/4 tsp ground ginger per 1 tbsp fresh, minced"),
  ],
  "fresh herbs (basil, oregano, thyme, etc.)": [
    s("dried version, use 1/3 the amount"),
  ],
  "dried herbs": [
    s("fresh version, use 3x the amount"),
  ],
  "soy sauce": [
    s("tamari (1:1, gluten-free)", soy),
    s("coconut aminos (1:1, less salty, sweeter)"),
  ],
  "worcestershire sauce": [
    s("soy sauce + a dash of vinegar and sugar", {
      ...soy,
      ...animalMaybe,
      vegetarian: false,
      vegan: false,
    }),
    s("coconut aminos + a dash of vinegar and sugar", animalMaybe),
  ],
  "white wine (cooking)": [
    s("chicken or vegetable broth + a splash of white wine vinegar or lemon juice", {
      vegetarian: false,
      vegan: false,
    }),
    s("vegetable broth + a splash of white wine vinegar or lemon juice"),
  ],
  "red wine (cooking)": [
    s("beef or vegetable broth + a splash of red wine vinegar", meat),
    s("vegetable broth + a splash of red wine vinegar"),
  ],
  breadcrumbs: [
    s("crushed crackers (1:1)", gluten),
    s("rolled oats, pulsed finer (1:1)", gluten),
    s("finely crushed gluten-free crackers or certified GF oats (1:1)"),
  ],
  panko: [
    s("regular breadcrumbs (1:1, texture will be denser)", gluten),
    s("gluten-free panko or crushed GF crackers (1:1)"),
  ],
  "parmesan cheese": [
    s("pecorino romano (1:1, saltier)", dairy),
    s("nutritional yeast for a dairy-free approximation"),
  ],
  mayonnaise: [
    s("plain Greek yogurt (1:1, tangier)", dairy),
    s("sour cream (1:1)", dairy),
    s("vegan mayonnaise (1:1)", { ...egg, vegan: true, vegetarian: true }),
  ],
  "lemon juice": [
    s("white vinegar, use half the amount (more acidic)"),
    s("lime juice (1:1)"),
  ],
  "lime juice": [
    s("lemon juice (1:1)"),
  ],
  "chili crisp": [
    s("chili oil + a pinch of crushed red pepper for texture", animalMaybe),
  ],
  "sesame oil": [
    s("walnut oil (1:1, different flavor but similar richness)", nut),
    s("neutral oil + a drop of toasted sesame flavoring if available"),
  ],
  "unsweetened chocolate (baking)": [
    s("3 tbsp cocoa powder + 1 tbsp melted butter or oil, per 1 oz chocolate", dairy),
    s("3 tbsp cocoa powder + 1 tbsp melted oil, per 1 oz chocolate"),
  ],
  "cocoa powder": [
    s("1 oz unsweetened baking chocolate (melted) + reduce a fat in the recipe by 1 tbsp, per 3 tbsp cocoa called for"),
  ],
  "tomato paste": [
    s("tomato sauce, 3 tbsp per 1 tbsp paste, simmered down to thicken and concentrate"),
  ],
  "tomato sauce": [
    s("tomato paste, 1 tbsp whisked with 2 tbsp water, per 3 tbsp sauce needed"),
  ],
  "powdered sugar": [
    s("1 cup granulated sugar + 1 tbsp cornstarch, blended fine in a food processor"),
  ],
  "maple syrup": [
    s("honey (1:1, flavor differs)", honey),
    s("granulated sugar dissolved in a little water"),
  ],
  "agave syrup": [
    s("honey (1:1, less viscous)", honey),
    s("maple syrup (1:1)"),
  ],
  "coconut milk (canned, cooking)": [
    s("heavy cream or whole milk (1:1, less coconut flavor)", dairy),
    s("unsweetened oat cream or soy cream (1:1)", soy),
  ],
  "vanilla extract": [
    s("almond extract, use half the amount (stronger flavor)", nut),
    s("maple syrup, a splash (flavor differs; best in baking)"),
  ],
  "feta cheese": [
    s("goat cheese (1:1, creamier, less tangy)", dairy),
    s("crumbled firm tofu with lemon juice and salt (dairy-free approximation)", soy),
  ],
  "ricotta cheese": [
    s("cottage cheese, blended smooth (1:1)", dairy),
    s("blended silken tofu + lemon juice (dairy-free approximation)", soy),
  ],
  mascarpone: [
    s("cream cheese softened with a splash of heavy cream (1:1)", dairy),
    s("thick coconut cream whipped with a pinch of salt"),
  ],
  "beef broth": [
    s("vegetable broth + a dash of soy sauce or Worcestershire for depth", {
      ...soy,
      ...animalMaybe,
      vegetarian: true,
      vegan: true,
    }),
    s("mushroom broth + a dash of coconut aminos for depth"),
  ],
  "chicken broth": [
    s("vegetable broth (1:1, milder flavor)"),
  ],
  "ground cumin": [
    s("ground coriander (1:1, milder, more citrusy)"),
  ],
  "smoked paprika": [
    s("regular paprika + a few drops liquid smoke, or paprika alone (loses smokiness)"),
  ],
  "ground cinnamon": [
    s("ground allspice or nutmeg, use half the amount (different flavor profile)"),
  ],
  "ground nutmeg": [
    s("ground allspice or cinnamon, use half the amount"),
  ],
  "bell pepper": [
    s("poblano pepper (milder heat, similar texture)"),
  ],
  celery: [
    s("celery seed, 1/4 tsp per stalk (flavor only, no crunch/texture)"),
  ],
  "active dry yeast": [
    s("instant yeast (1:1 by volume, no need to proof first, rises slightly faster)"),
  ],
  "instant yeast": [
    s("active dry yeast (1:1 by volume, dissolve in warm water first, rises 15-20 min slower)"),
  ],
  "table salt": [
    s("kosher salt, use about 1.5x the amount (Morton brand) or 2x the amount (Diamond Crystal brand)"),
  ],
  "kosher salt": [
    s("table salt, use about 2/3 the amount (Morton brand) or 1/2 the amount (Diamond Crystal brand)"),
  ],
  "cake flour": [
    s("1 cup all-purpose flour minus 2 tbsp, plus 2 tbsp cornstarch, sifted together", gluten),
  ],
  "evaporated milk": [
    s("whole milk simmered and reduced by about half", dairy),
    s("half-and-half (1:1, richer)", dairy),
    s("unsweetened oat milk simmered and reduced by about half"),
  ],
  "sweetened condensed milk": [
    s("1 cup sugar + 1/3 cup water dissolved and simmered with 1/2 cup powdered milk until thick", dairy),
    s("1 cup sugar + 1/3 cup coconut milk simmered until thick"),
  ],
  "half and half": [
    s("equal parts whole milk and heavy cream", dairy),
    s("equal parts oat milk and coconut cream"),
  ],
  "ground beef": [
    s("ground turkey or ground chicken (1:1, leaner, milder flavor)", meat),
    s("cooked brown lentils + walnuts, pulsed (vegetarian approximation)", { ...nut, vegetarian: true, vegan: true }),
    s("cooked brown lentils + mushrooms, pulsed (vegetarian, nut-free approximation)"),
  ],
  "ground turkey": [
    s("ground chicken (1:1)", meat),
    s("ground beef (1:1, richer flavor)", meat),
  ],
  shortening: [
    s("butter (1:1, adds flavor, slightly different texture)", dairy),
    s("lard (1:1)", meat),
    s("refined coconut oil (1:1, solid when cool)"),
  ],
  lard: [
    s("shortening (1:1)"),
    s("butter (1:1, adds moisture and flavor)", dairy),
  ],
  ghee: [
    s("butter (1:1, less nutty flavor)", dairy),
    s("refined coconut oil (1:1)"),
  ],
  "fish sauce": [
    s("soy sauce + a squeeze of lime (different flavor but similar salty-umami role)", {
      ...soy,
      vegetarian: false,
      vegan: false,
    }),
    s("coconut aminos + a squeeze of lime"),
  ],
  "oyster sauce": [
    s("hoisin sauce + a dash of soy sauce (sweeter, less briny)", {
      ...soy,
      ...gluten,
      vegetarian: false,
      vegan: false,
      sourcingNote: SOURCING_NOTE_ANIMAL_DERIVED,
    }),
    s("mushroom vegetarian stir-fry sauce + a dash of soy sauce", soy),
  ],
  "hoisin sauce": [
    s("soy sauce + a bit of honey or brown sugar + a dash of rice vinegar", { ...soy, ...gluten, ...honey }),
    s("tamari + maple syrup + rice vinegar", soy),
  ],
  sriracha: [
    s("hot sauce + a pinch of sugar and pinch of garlic powder"),
  ],
  gochujang: [
    s("miso paste + chili flakes + a touch of honey (different but workable in a pinch)", {
      ...soy,
      ...gluten,
      ...honey,
    }),
    s("miso paste + chili flakes + a touch of maple syrup", { ...soy, ...gluten }),
  ],
  "dijon mustard": [
    s("yellow mustard + a splash of white wine vinegar (milder, less sharp)"),
  ],
  "yellow mustard": [
    s("dijon mustard (1:1, sharper, less tangy-sweet)"),
  ],
  capers: [
    s("chopped green olives (similar briny bite)"),
  ],
  "black pepper": [
    s("white pepper (1:1, milder, less floral, no visible flecks)"),
  ],
  "rice vinegar": [
    s("apple cider vinegar + a pinch of sugar, or white vinegar diluted slightly with water"),
  ],
  mirin: [
    s("dry sherry or rice vinegar + a pinch of sugar (1:1)", animalMaybe),
    s("rice vinegar + a pinch of sugar (1:1)"),
  ],
  "cooking sherry": [
    s("dry white wine (1:1)"),
    s("chicken broth + splash of white wine vinegar", meat),
    s("vegetable broth + splash of white wine vinegar"),
  ],
};
