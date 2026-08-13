/**
 * Keyword groups for grocery aisle inference when adding recipe ingredients.
 *
 * MATCHING STRATEGY
 * ------------------
 * 1. Overrides (checked first): a small set of blanket modifiers - "frozen", "canned" - 
 *    that should win regardless of what other word appears in the ingredient name.
 *    e.g. "frozen broccoli" should be Frozen, not Produce, even though "broccoli" is a
 *    valid Produce keyword.
 *
 * 2. Specific rules (checked next, most specific first): every keyword below is matched
 *    as a whole word, not a raw substring, with basic plural handling built in. This
 *    fixes false positives like "egg" matching inside "eggplant", or "corn" matching
 *    inside "cornstarch", or "butter" matching inside "peanut butter".
 *
 *    All keywords are pooled together and sorted by word count (then length) before
 *    matching, so multi-word phrases always win over the shorter generic word they
 *    contain - regardless of which category each is listed under. This is how the same
 *    base word safely means different things in different aisles:
 *
 *      "pepper" alone           -> Produce (fresh bell/chili pepper, the common case)
 *      "black pepper"           -> Spices & Seasonings
 *      "peppercorn"             -> Spices & Seasonings
 *      "cayenne pepper"         -> Spices & Seasonings
 *      "red pepper flakes"      -> Spices & Seasonings
 *
 *      "tomato" alone           -> Produce
 *      "tomato paste"/"sauce"   -> Canned & Jarred
 *
 *      "garlic" alone           -> Produce
 *      "garlic powder"          -> Spices & Seasonings
 *
 *      "cream" alone            -> Dairy & Eggs
 *      "ice cream"              -> Frozen
 *      "coconut cream"          -> Canned & Jarred
 *      "cream of tartar"        -> Pantry & Dry Goods (baking chemical, not dairy)
 *
 *      "mustard" alone          -> Condiments & Sauces
 *      "mustard greens"         -> Produce
 *
 *    No keyword string appears twice in the rule set below.
 *
 * 3. If nothing matches, the function returns null (uncategorized) rather than guessing.
 */

interface CategoryRule {
  category: string;
  keywords: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: "Produce",
    keywords: [
      "onion", "garlic", "garlic clove", "shallot", "scallion", "leek",
      "potato", "sweet potato", "yam", "carrot", "beet", "turnip", "parsnip", "radish",
      "ginger", "fresh ginger",
      "tomato", "eggplant", "pepper", "bell pepper", "poblano pepper", "serrano pepper",
      "jalapeno", "jalapeño", "habanero", "chili", "chile",
      "lettuce", "romaine", "arugula", "spinach", "kale", "chard", "cabbage",
      "broccoli", "cauliflower", "brussels sprout", "bok choy", "watercress", "endive",
      "collard greens", "dandelion greens", "mustard greens",
      "cucumber", "zucchini", "yellow squash", "butternut squash", "acorn squash",
      "pumpkin", "corn", "corn on the cob", "green bean", "snap pea", "snow pea",
      "asparagus", "celery", "fennel", "artichoke", "okra", "jicama",
      "mushroom", "cremini", "portobello", "shiitake",
      "lemon", "lime", "avocado", "apple", "banana", "orange", "grapefruit", "grape",
      "strawberry", "blueberry", "raspberry", "blackberry", "cranberry", "peach", "pear",
      "plum", "cherry", "watermelon", "cantaloupe", "honeydew", "pineapple", "mango",
      "kiwi", "apricot",
      "basil", "cilantro", "parsley", "mint", "dill", "chives", "tarragon", "sage",
      "fresh thyme", "fresh rosemary", "fresh oregano", "fresh bay leaf",
      "bean sprout",
    ],
  },
  {
    category: "Dairy & Eggs",
    keywords: [
      "milk", "whole milk", "skim milk", "buttermilk",
      "cream", "heavy cream", "whipping cream", "whipped cream", "half and half",
      "sour cream", "cream cheese", "cottage cheese",
      "butter", "margarine",
      "egg", "egg white", "egg yolk",
      "yogurt", "greek yogurt",
      "cheese", "cheddar", "mozzarella", "parmesan", "feta", "ricotta", "mascarpone",
      "goat cheese", "brie", "gouda", "swiss cheese", "provolone", "monterey jack",
      "string cheese",
    ],
  },
  {
    category: "Meat & Seafood",
    keywords: [
      "chicken", "chicken breast", "chicken thigh", "chicken wing", "ground chicken",
      "beef", "ground beef", "steak", "brisket", "short rib",
      "pork", "pork chop", "ground pork", "bacon",
      "sausage", "italian sausage",
      "turkey", "ground turkey", "lamb", "ground lamb", "veal", "ham",
      "deli meat", "salami", "pepperoni", "prosciutto",
      "salmon", "shrimp", "prawn", "tuna", "tilapia", "cod", "halibut",
      "crab", "lobster", "scallop", "mussel", "clam", "oyster", "anchovy",
    ],
  },
  {
    category: "Bakery",
    keywords: [
      "bread", "baguette", "sourdough", "tortilla", "pita", "bun", "bagel", "roll",
      "croissant", "english muffin", "pizza dough", "pie crust",
    ],
  },
  {
    category: "Pantry & Dry Goods",
    keywords: [
      "flour", "all purpose flour", "cake flour", "self-rising flour", "bread flour",
      "sugar", "granulated sugar", "brown sugar", "powdered sugar",
      "rice", "jasmine rice", "basmati rice", "pasta", "spaghetti", "penne", "macaroni",
      "noodle", "quinoa", "couscous", "oats", "cornmeal",
      "black bean", "kidney bean", "chickpea", "garbanzo bean", "pinto bean",
      "cannellini bean", "navy bean", "lentil", "split pea",
      "cornstarch", "baking powder", "baking soda", "cream of tartar", "yeast", "gelatin",
      "vanilla extract", "almond extract", "cocoa powder", "chocolate chip",
      "unsweetened chocolate",
      "honey", "maple syrup", "agave", "molasses",
      "almond", "walnut", "pecan", "cashew", "peanut", "pistachio",
      "sunflower seed", "sesame seed", "chia seed", "flaxseed",
      "raisin", "dried cranberry", "dried apricot", "coconut flake", "shredded coconut",
      "peanut butter", "almond butter", "nutella",
      "breadcrumb", "panko",
    ],
  },
  {
    category: "Spices & Seasonings",
    keywords: [
      "salt", "kosher salt", "table salt", "sea salt",
      "black pepper", "white pepper", "ground pepper", "peppercorn", "cayenne pepper",
      "red pepper flakes", "crushed red pepper", "chili powder", "chili flakes",
      "cumin", "ground cumin", "paprika", "smoked paprika",
      "cinnamon", "ground cinnamon", "nutmeg", "ground nutmeg", "clove", "ground clove",
      "allspice", "cardamom", "coriander", "turmeric", "curry powder", "garam masala",
      "oregano", "dried oregano", "thyme", "dried thyme", "rosemary", "dried rosemary",
      "bay leaf", "marjoram", "herbes de provence", "italian seasoning",
      "poultry seasoning", "garlic powder", "granulated garlic", "onion powder",
      "ginger powder", "ground ginger", "mustard powder", "mustard seed",
      "dried basil", "dried parsley", "dried dill", "dried mint", "dried chives",
      "dried tarragon", "dried cilantro",
      "saffron", "sumac", "za'atar", "five spice", "old bay", "taco seasoning",
      "ranch seasoning",
    ],
  },
  {
    category: "Condiments & Sauces",
    keywords: [
      "soy sauce", "tamari", "coconut aminos", "worcestershire sauce",
      "hot sauce", "sriracha", "ketchup", "mustard", "dijon mustard", "yellow mustard",
      "mayonnaise", "relish", "bbq sauce", "ranch dressing", "italian dressing",
      "vinaigrette", "salsa", "pesto", "tahini", "hoisin sauce", "oyster sauce",
      "fish sauce", "gochujang", "miso", "teriyaki sauce", "marinara sauce",
      "alfredo sauce", "pasta sauce", "salad dressing", "sauce",
      "lemon juice", "lime juice",
      "olive oil", "vegetable oil", "canola oil", "sesame oil", "coconut oil",
      "avocado oil", "peanut oil", "oil",
      "balsamic vinegar", "red wine vinegar", "white wine vinegar",
      "apple cider vinegar", "white vinegar", "rice vinegar", "sherry vinegar",
      "vinegar", "mirin", "cooking sherry", "cooking wine",
    ],
  },
  {
    category: "Canned & Jarred",
    keywords: [
      "tomato paste", "tomato sauce", "canned tomato", "diced tomato", "crushed tomato",
      "tomato puree", "sun-dried tomato",
      "coconut milk", "coconut cream",
      "canned corn", "creamed corn", "canned pumpkin", "pumpkin puree",
      "chicken broth", "beef broth", "vegetable broth", "chicken stock", "beef stock",
      "vegetable stock", "bone broth", "broth", "stock", "bouillon",
      "canned tuna", "canned salmon",
      "pickle", "olive", "caper", "roasted red pepper", "artichoke heart",
      "jam", "jelly", "preserves",
    ],
  },
  {
    category: "Frozen",
    keywords: [
      "frozen", "ice cream", "popsicle", "sorbet", "hash brown", "waffle", "frozen dough",
    ],
  },
  {
    category: "Beverages",
    keywords: [
      "water", "sparkling water", "soda", "juice", "orange juice", "apple juice",
      "coffee", "tea", "wine", "beer", "seltzer", "kombucha",
      "almond milk", "oat milk", "soy milk",
    ],
  },
];

const OVERRIDE_RULES: { category: string; keyword: string }[] = [
  { category: "Frozen", keyword: "frozen" },
  { category: "Canned & Jarred", keyword: "canned" },
];

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildKeywordRegex(keyword: string): RegExp {
  return new RegExp(`\\b${escapeRegExp(keyword)}(e?s)?\\b`, "i");
}

const OVERRIDE_MATCHERS = OVERRIDE_RULES.map((rule) => ({
  category: rule.category,
  regex: buildKeywordRegex(rule.keyword),
}));

const FLAT_RULES = CATEGORY_RULES.flatMap((rule) =>
  rule.keywords.map((keyword) => ({
    category: rule.category,
    regex: buildKeywordRegex(keyword),
    wordCount: keyword.split(" ").length,
    length: keyword.length,
  }))
).sort((a, b) => b.wordCount - a.wordCount || b.length - a.length);

export function inferIngredientCategory(name: string): string | null {
  const normalized = name.trim();
  if (!normalized) return null;

  for (const override of OVERRIDE_MATCHERS) {
    if (override.regex.test(normalized)) {
      return override.category;
    }
  }

  for (const rule of FLAT_RULES) {
    if (rule.regex.test(normalized)) {
      return rule.category;
    }
  }

  return null;
}
