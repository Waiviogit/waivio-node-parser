const allIngredients = {
  Ingredients: {
    cheese: 'cheese',
    'cheese curds': 'cheese-curds',
    butter: 'butter',
    egg: 'egg',
    milk: 'milk',
    focaccia: 'focaccia',
    parmesan: 'parmesan',
    sourdough: 'sourdough',
    cheddar: 'cheddar',
    'american cheese': 'american-cheese',
    'sour cream': 'sour-cream',
    'cream cheese': 'cream-cheese',
    mozzarella: 'mozzarella',
    yogurt: 'yogurt',
    cream: 'cream',
    'evaporated milk': 'evaporated-milk',
    'whipped cream': 'whipped-cream',
    'half and half': 'half-and half',
    feta: 'feta',
    'monterey jack cheese': 'monterey-jack-cheese',
    'condensed milk': 'condensed-milk',
    'cottage cheese': 'cottage-cheese',
    'ice cream': 'ice-cream',
    'swiss cheese': 'swiss-cheese',
    velveeta: 'velveeta',
    frosting: 'frosting',
    fries: 'fries',
    onions: 'onion',
    'caesar salad': 'caesar-salad',
    buttermilk: 'buttermilk',
    ricotta: 'ricotta',
    'goat cheese': 'goat-cheese',
    provolone: 'provolone',
    'blue cheese': 'blue-cheese',
    'powdered milk': 'powdered-milk',
    'colby cheese': 'colby-cheese',
    'pepper jack': 'pepper-jack',
    'italian cheese': 'italian-cheese',
    'soft cheese': 'soft-cheese',
    gouda: 'gouda',
    'pepperjack cheese': 'pepperjack-cheese',
    romano: 'romano',
    brie: 'brie',
    'pizza cheese': 'pizza-cheese',
    ghee: 'ghee',
    'creme fraiche': 'creme-fraiche',
    gruyere: 'gruyere',
    'pecorino cheese': 'pecorino-cheese',
    custard: 'custard',
    muenster: 'muenster',
    'queso fresco cheese': 'queso-fresco-cheese',
    'hard cheese': 'hard-cheese',
    'havarti cheese': 'havarti-cheese',
    asiago: 'asiago',
    mascarpone: 'mascarpone',
    neufchatel: 'neufchatel',
    halloumi: 'halloumi',
    paneer: 'paneer',
    'brick cheese': 'brick-cheese',
    'camembert cheese': 'camembert-cheese',
    'goat milk': 'goat-milk',
    'garlic herb cheese': 'garlic-herb-cheese',
    'edam cheese': 'edam-cheese',
    manchego: 'manchego',
    fontina: 'fontina',
    'stilton cheese': 'stilton-cheese',
    'emmenthaler cheese': 'emmenthaler-cheese',
    'red leicester cheese': 'red-leicester-cheese',
    'jarlsberg cheese': 'jarlsberg-cheese',
    'bocconcini cheese': 'bocconcini-cheese',
    'farmer cheese': 'farmer-cheese',
    'creme de cassis': 'creme-de-cassis',
    'wensleydale cheese': 'wensleydale-cheese',
    'longhorn cheese': 'longhorn-cheese',
    'double gloucester cheese': 'double-gloucester-cheese',
    'raclette cheese': 'raclette-cheese',
    'lancashire cheese': 'lancashire-cheese',
    'cheshire cheese': 'cheshire-cheese',
    onion: 'onion',
    garlic: 'garlic',
    tomato: 'tomato',
    tomatoes: 'tomato',
    potato: 'potato',
    carrot: 'carrot',
    'bell pepper': 'bell-pepper',
    basil: 'basil',
    lettuce: 'lettuce',
    jalapeno: 'jalapeno',
    'keefer sauce': 'keefer-sauce',
    redcurrant: 'redcurrant',
    'yunzhi syrup': 'yunzhi-syrup',
    'spiced syrup': 'spiced-syrup',
    pecans: 'pecans',
    parsley: 'parsley',
    broccoli: 'broccoli',
    corn: 'corn',
    spinach: 'spinach',
    capicollo: 'capicollo',
    mushroom: 'mushroom',
    mushrooms: 'mushroom',
    'green beans': 'green-beans',
    ginger: 'ginger',
    'chili pepper': 'chili-pepper',
    celery: 'celery',
    rosemary: 'rosemary',
    'salad greens': 'salad-greens',
    'red onion': 'red-onion',
    'chili oil': 'chili-oil',
    cucumber: 'cucumber',
    cucumbers: 'cucumber',
    'sweet potato': 'sweet-potato',
    pickle: 'pickle',
    truffle: 'truffle',
    brisket: 'brisket',
    avocado: 'avocado',
    zucchini: 'zucchini',
    cilantro: 'cilantro',
    'frozen vegetables': 'frozen-vegetables',
    'seasonal vegetables': 'seasonal-vegetables',
    olive: 'olive',
    olives: 'olive',
    asparagus: 'asparagus',
    cabbage: 'cabbage',
    cauliflower: 'cauliflower',
    dill: 'dill',
    kale: 'kale',
    'mixed vegetable': 'mixed-vegetable',
    pumpkin: 'pumpkin',
    squash: 'squash',
    mint: 'mint',
    scallion: 'scallion',
    'sun dried tomato': 'sun-dried-tomato',
    shallot: 'shallot',
    eggplant: 'eggplant',
    beet: 'beet',
    'butternut squash': 'butternut-squash',
    horseradish: 'horseradish',
    leek: 'leek',
    caper: 'caper',
    'brussels sprout': 'brussels-sprout',
    'artichoke heart': 'artichoke-heart',
    'chia seeds': 'chia-seeds',
    'grilled sourdough': 'grilled-sourdough',
    'herb salad': 'herb-salad',
    'sesame seeds': 'sesame-seeds',
    radish: 'radish',
    sauerkraut: 'sauerkraut',
    artichoke: 'artichoke',
    'portobello mushroom': 'portobello-mushroom',
    'sweet pepper': 'sweet-pepper',
    ' shark spice': ' shark-spice',
    arugula: 'arugula',
    'spaghetti squash': 'spaghetti-squash',
    capsicum: 'capsicum',
    'bok choy': 'bok-choy',
    parsnip: 'parsnip',
    okra: 'okra',
    yam: 'yam',
    fennel: 'fennel',
    turnip: 'turnip',
    'snow peas': 'snow-peas',
    'bean sprouts': 'bean-sprouts',
    seaweed: 'seaweed',
    chard: 'chard',
    collard: 'collard',
    'canned tomato': 'canned-tomato',
    pimiento: 'pimiento',
    watercress: 'watercress',
    tomatillo: 'tomatillo',
    rocket: 'rocket',
    'mustard greens': 'mustard-greens',
    'bamboo shoot': 'bamboo-shoot',
    rutabaga: 'rutabaga',
    endive: 'endive',
    'broccoli rabe': 'broccoli-rabe',
    jicama: 'jicama',
    kohlrabi: 'kohlrabi',
    'hearts of palm': 'hearts-of palm',
    butternut: 'butternut',
    'celery root': 'celery-root',
    daikon: 'daikon',
    radicchio: 'radicchio',
    porcini: 'porcini',
    'chinese broccoli': 'chinese-broccoli',
    'jerusalem artichoke': 'jerusalem-artichoke',
    cress: 'cress',
    'water chestnut': 'water-chestnut',
    dulse: 'dulse',
    'micro greens': 'micro-greens',
    burdock: 'burdock',
    chayote: 'chayote',
    lemon: 'lemon',
    apple: 'apple',
    banana: 'banana',
    lime: 'lime',
    strawberry: 'strawberry',
    orange: 'orange',
    pineapple: 'pineapple',
    nuts: 'nuts',
    blueberry: 'blueberry',
    raisin: 'raisin',
    coconut: 'coconut',
    grape: 'grape',
    peach: 'peach',
    raspberry: 'raspberry',
    cranberry: 'cranberry',
    mango: 'mango',
    pear: 'pear',
    blackberry: 'blackberry',
    cherry: 'cherry',
    cherries: 'cherries',
    sorrel: 'sorrel',
    'stewed fruit': 'stewed-fruit',
    hazelnuts: 'hazelnuts',
    'nasturtium oil': 'nasturtium-oil',
    date: 'date',
    watermelon: 'watermelon',
    berries: 'berries',
    fruits: 'fruits',
    kiwi: 'kiwi',
    grapefruit: 'grapefruit',
    mandarin: 'mandarin',
    craisins: 'craisins',
    cantaloupe: 'cantaloupe',
    plum: 'plum',
    apricot: 'apricot',
    clementine: 'clementine',
    prunes: 'prunes',
    'apple butter': 'apple-butter',
    pomegranate: 'pomegranate',
    nectarine: 'nectarine',
    fig: 'fig',
    tangerine: 'tangerine',
    papaya: 'papaya',
    rhubarb: 'rhubarb',
    sultanas: 'sultanas',
    plantain: 'plantain',
    currant: 'currant',
    'passion fruit': 'passion-fruit',
    guava: 'guava',
    persimmons: 'persimmons',
    lychee: 'lychee',
    lingonberry: 'lingonberry',
    tangelos: 'tangelos',
    kumquat: 'kumquat',
    boysenberry: 'boysenberry',
    'star fruit': 'star-fruit',
    quince: 'quince',
    honeydew: 'honeydew',
    crabapples: 'crabapples',
    rice: 'rice',
    pasta: 'pasta',
    flour: 'flour',
    bread: 'bread',
    beets: 'beets',
    'baking powder': 'baking-powder',
    'baking soda': 'baking-soda',
    'bread crumbs': 'bread-crumbs',
    cornstarch: 'cornstarch',
    'rolled oats': 'rolled-oats',
    noodle: 'noodle',
    'flour tortillas': 'flour-tortillas',
    'pancake mix': 'pancake-mix',
    yeast: 'yeast',
    cracker: 'cracker',
    quinoa: 'quinoa',
    'brown rice': 'brown-rice',
    cornmeal: 'cornmeal',
    'self rising flour': 'self-rising-flour',
    'cake mix': 'cake-mix',
    saltines: 'saltines',
    popcorn: 'popcorn',
    'macaroni cheese mix': 'macaroni-cheese-mix',
    'corn tortillas': 'corn-tortillas',
    ramen: 'ramen',
    cereal: 'cereal',
    biscuits: 'biscuits',
    'stuffing mix': 'stuffing-mix',
    couscous: 'couscous',
    'pie crust': 'pie-crust',
    bisquick: 'bisquick',
    chips: 'chips',
    'angel hair': 'angel-hair',
    'coconut flake': 'coconut-flake',
    'bread flour': 'bread-flour',
    croutons: 'croutons',
    lasagne: 'lasagne',
    'pizza dough': 'pizza-dough',
    bagel: 'bagel',
    'puff pastry': 'puff-pastry',
    'hot dog bun': 'hot-dog bun',
    barley: 'barley',
    'multigrain bread': 'multigrain-bread',
    'potato flakes': 'potato-flakes',
    pretzel: 'pretzel',
    cornbread: 'cornbread',
    'english muffin': 'english-muffin',
    cornflour: 'cornflour',
    'crescent roll dough': 'crescent-roll-dough',
    'cream of wheat': 'cream-of wheat',
    meat: 'meat',
    'coconut flour': 'coconut-flour',
    pita: 'pita',
    risotto: 'risotto',
    'muffin mix': 'muffin-mix',
    'bicarbonate of soda': 'bicarbonate-of-soda',
    ravioli: 'ravioli',
    wheat: 'wheat',
    'rice flour': 'rice-flour',
    polenta: 'polenta',
    baguette: 'baguette',
    gnocchi: 'gnocchi',
    vermicelli: 'vermicelli',
    semolina: 'semolina',
    'wheat germ': 'wheat-germ',
    buckwheat: 'buckwheat',
    croissants: 'croissants',
    'bread dough': 'bread-dough',
    'filo dough': 'filo-dough',
    'yeast flake': 'yeast-flake',
    pierogi: 'pierogi',
    'matzo meal': 'matzo-meal',
    rye: 'rye',
    'tapioca flour': 'tapioca-flour',
    'shortcrust pastry': 'shortcrust-pastry',
    'potato starch': 'potato-starch',
    breadsticks: 'breadsticks',
    ciabatta: 'ciabatta',
    spelt: 'spelt',
    'angel food': 'angel-food',
    'tapioca starch': 'tapioca-starch',
    starch: 'starch',
    'whole wheat flour': 'whole-wheat-flour',
    'gram flour': 'gram-flour',
    'sourdough starter': 'sourdough-starter',
    wafer: 'wafer',
    bran: 'bran',
    challah: 'challah',
    'sponge cake': 'sponge-cake',
    'malt extract': 'malt-extract',
    'sorghum flour': 'sorghum-flour',
    sugar: 'sugar',
    'brown sugar': 'brown-sugar',
    honey: 'honey',
    'confectioners sugar': 'confectioners-sugar',
    'maple syrup': 'maple-syrup',
    'corn syrup': 'corn-syrup',
    molasses: 'molasses',
    'artificial sweetener': 'artificial-sweetener',
    'agave nectar': 'agave-nectar',
    cinnamon: 'cinnamon',
    vanilla: 'vanilla',
    'garlic powder': 'garlic-powder',
    paprika: 'paprika',
    oregano: 'oregano',
    'chili powder': 'chili-powder',
    'red pepper flake': 'red-pepper-flake',
    cumin: 'cumin',
    cayenne: 'cayenne',
    'italian seasoning': 'italian-seasoning',
    thyme: 'thyme',
    eggs: 'egg',
    'onion powder': 'onion-powder',
    nutmeg: 'nutmeg',
    'ground nutmeg': 'ground-nutmeg',
    'curry powder': 'curry-powder',
    'bay leaf': 'bay-leaf',
    'taco seasoning': 'taco-seasoning',
    sage: 'sage',
    clove: 'clove',
    allspice: 'allspice',
    turmeric: 'turmeric',
    chive: 'chive',
    peppercorn: 'peppercorn',
    'ground coriander': 'ground-coriander',
    'cajun seasoning': 'cajun-seasoning',
    coriander: 'coriander',
    'celery salt': 'celery-salt',
    'vanilla essence': 'vanilla-essence',
    herbs: 'herbs',
    'steak seasoning': 'steak-seasoning',
    'poultry seasoning': 'poultry-seasoning',
    'chile powder': 'chile-powder',
    cardamom: 'cardamom',
    'italian herbs': 'italian-herbs',
    tarragon: 'tarragon',
    'garam masala': 'garam-masala',
    marjoram: 'marjoram',
    'mustard seed': 'mustard-seed',
    'celery seed': 'celery-seed',
    'chinese five spice': 'chinese-five-spice',
    'italian spice': 'italian-spice',
    saffron: 'saffron',
    'onion flake': 'onion-flake',
    'herbes de provence': 'herbes-de-provence',
    chipotle: 'chipotle',
    'dill seed': 'dill-seed',
    'fennel seed': 'fennel-seed',
    caraway: 'caraway',
    cacao: 'cacao',
    'star anise': 'star-anise',
    savory: 'savory',
    'chili paste': 'chili-paste',
    tamarind: 'tamarind',
    aniseed: 'aniseed',
    fenugreek: 'fenugreek',
    lavender: 'lavender',
    'old bay seasoning': 'old-bay-seasoning',
    'lemon balm': 'lemon-balm',
    chicken: 'chicken',
    breast: 'breast',
    ground: 'ground',
    bacon: 'bacon',
    sausage: 'sausage',
    steak: 'steak',
    ham: 'ham',
    'hot dog': 'hot-dog',
    thighs: 'thighs',
    turkey: 'turkey',
    pork: 'pork',
    pepperoni: 'pepperoni',
    'whole chicken': 'whole-chicken',
    chorizo: 'chorizo',
    wings: 'wings',
    'polish sausage': 'polish-sausage',
    salami: 'salami',
    spam: 'spam',
    venison: 'venison',
    shoulder: 'shoulder',
    bologna: 'bologna',
    bratwurst: 'bratwurst',
    prosciutto: 'prosciutto',
    'corned beef': 'corned-beef',
    chops: 'chops',
    pancetta: 'pancetta',
    'ground lamb': 'ground-lamb',
    ribs: 'ribs',
    duck: 'duck',
    belly: 'belly',
    leg: 'leg',
    'canadian bacon': 'canadian-bacon',
    shank: 'shank',
    veal: 'veal',
    giblets: 'giblets',
    'cornish hen': 'cornish-hen',
    'lamb shoulder': 'lamb-shoulder',
    deer: 'deer',
    'ground veal': 'ground-veal',
    pastrami: 'pastrami',
    rabbit: 'rabbit',
    'sliced turkey': 'sliced-turkey',
    elk: 'elk',
    suet: 'suet',
    cutlet: 'cutlet',
    'lamb loin': 'lamb-loin',
    goose: 'goose',
    quail: 'quail',
    oxtail: 'oxtail',
    pheasant: 'pheasant',
    moose: 'moose',
    lamb: 'lamb',
    beef: 'beef',
    liver: 'liver',
    'foie gras': 'foie-gras',
    sirloin: 'sirloin',
    'curry sauce': 'curry sauce',
    'frisée salad': 'frisée-salad',
    'liver sausage': 'liver-sausage',
    sweetbread: 'sweetbread',
    'wild boar': 'wild-boar',
    snail: 'snail',
    pigeon: 'pigeon',
    grouse: 'grouse',
    ostrich: 'ostrich',
    soppressata: 'soppressata',
    alligator: 'alligator',
    'canned tuna': 'canned-tuna',
    salmon: 'salmon',
    'brussel sprouts': 'brussel-sprouts',
    tilapia: 'tilapia',
    fish: 'fish',
    fillets: 'fillets',
    cod: 'cod',
    'canned salmon': 'canned-salmon',
    anchovy: 'anchovy',
    sardines: 'sardines',
    'tuna steak': 'tuna-steak',
    whitefish: 'whitefish',
    halibut: 'halibut',
    trout: 'trout',
    haddock: 'haddock',
    flounder: 'flounder',
    catfish: 'catfish',
    'mahi mahi': 'mahi-mahi',
    mackerel: 'mackerel',
    sole: 'sole',
    'sea bass': 'sea-bass',
    'red snapper': 'red-snapper',
    swordfish: 'swordfish',
    pollock: 'pollock',
    herring: 'herring',
    perch: 'perch',
    grouper: 'grouper',
    caviar: 'caviar',
    monkfish: 'monkfish',
    rockfish: 'rockfish',
    'lemon sole': 'lemon-sole',
    pike: 'pike',
    barramundi: 'barramundi',
    eel: 'eel',
    bluefish: 'bluefish',
    carp: 'carp',
    cuttlefish: 'cuttlefish',
    pompano: 'pompano',
    'arctic char': 'arctic-char',
    'john dory': 'john-dory',
    marlin: 'marlin',
    amberjack: 'amberjack',
    sturgeon: 'sturgeon',
    shrimp: 'shrimp',
    crab: 'crab',
    prawns: 'prawns',
    scallop: 'scallop',
    clam: 'clam',
    lobster: 'lobster',
    mussel: 'mussel',
    oyster: 'oyster',
    squid: 'squid',
    calamari: 'calamari',
    crawfish: 'crawfish',
    octopus: 'octopus',
    cockle: 'cockle',
    conch: 'conch',
    'sea urchin': 'sea-urchin',
    mayonnaise: 'mayonnaise',
    ketchup: 'ketchup',
    mustard: 'mustard',
    vinegar: 'vinegar',
    'soy sauce': 'soy-sauce',
    'balsamic vinegar': 'balsamic-vinegar',
    worcestershire: 'worcestershire',
    'hot sauce': 'hot-sauce',
    'barbecue sauce': 'barbecue-sauce',
    'ranch dressing': 'ranch-dressing',
    'wine vinegar': 'wine-vinegar',
    'apple cider vinegar': 'apple-cider-vinegar',
    'cider vinegar': 'cider-vinegar',
    'italian dressing': 'italian-dressing',
    'rice vinegar': 'rice-vinegar',
    'salad dressing': 'salad-dressing',
    tabasco: 'tabasco',
    'fish sauce': 'fish-sauce',
    teriyaki: 'teriyaki',
    'steak sauce': 'steak-sauce',
    tahini: 'tahini',
    'enchilada sauce': 'enchilada-sauce',
    'vinaigrette dressing': 'vinaigrette-dressing',
    'oyster sauce': 'oyster-sauce',
    'honey mustard': 'honey-mustard',
    sriracha: 'sriracha',
    'caesar dressing': 'caesar-dressing',
    'taco sauce': 'taco-sauce',
    mirin: 'mirin',
    'thousand island': 'thousand-island',
    'picante sauce': 'picante-sauce',
    'buffalo sauce': 'buffalo-sauce',
    'buffalo brie': 'buffalo-brie',
    'french dressing': 'french-dressing',
    tartar: 'tartar',
    'pickled red onion': 'pickled-red-onion',
    'cocktail sauce': 'cocktail-sauce',
    marsala: 'marsala',
    'house made gravy': 'house-gravy',
    'adobo sauce': 'adobo-sauce',
    'tzatziki sauce': 'tzatziki-sauce',
    'sesame dressing': 'sesame-dressing',
    ponzu: 'ponzu',
    'duck sauce': 'duck-sauce',
    'pickapeppa sauce': 'pickapeppa-sauce',
    'yuzu juice': 'yuzu-juice',
    'cream sauce': 'cream-sauce',
    'olive oil': 'olive-oil',
    'vegetable oil': 'vegetable-oil',
    'cooking spray': 'cooking-spray',
    'canola oil': 'canola-oil',
    shortening: 'shortening',
    'sesame oil': 'sesame-oil',
    'coconut oil': 'coconut-oil',
    'peanut oil': 'peanut-oil',
    'sunflower oil': 'sunflower-oil',
    lard: 'lard',
    'grape seed oil': 'grape-seed-oil',
    'corn oil': 'corn-oil',
    'almond oil': 'almond-oil',
    'avocado oil': 'avocado-oil',
    'safflower oil': 'safflower-oil',
    'walnut oil': 'walnut-oil',
    'hazelnut oil': 'hazelnut-oil',
    'palm oil': 'palm-oil',
    'soybean oil': 'soybean-oil',
    'mustard oil': 'mustard-oil',
    'pistachio oil': 'pistachio-oil',
    'soya oil': 'soya-oil',
    bouillon: 'bouillon',
    'ground ginger': 'ground-ginger',
    'sesame seed': 'sesame-seed',
    'cream of tartar': 'cream-of tartar',
    'chili sauce': 'chili-sauce',
    'soya sauce': 'soya-sauce',
    'apple cider': 'apple-cider',
    'hoisin sauce': 'hoisin-sauce',
    'liquid smoke': 'liquid-smoke',
    'rice wine': 'rice-wine',
    'vegetable bouillon': 'vegetable-bouillon',
    'poppy seed': 'poppy-seed',
    'balsamic glaze': 'balsamic-glaze',
    miso: 'miso',
    wasabi: 'wasabi',
    'rose water': 'rose-water',
    'pickling salt': 'pickling-salt',
    'champagne vinegar': 'champagne-vinegar',
    'bbq rub': 'bbq-rub',
    'accent seasoning': 'accent-seasoning',
    'pickling spice': 'pickling-spice',
    'mustard powder': 'mustard-powder',
    'mango powder': 'mango-powder',
    'adobo seasoning': 'adobo-seasoning',
    'kasuri methi': 'kasuri-methi',
    brine: 'brine',
    'matcha powder': 'matcha-powder',
    cassia: 'cassia',
    'tomato sauce': 'tomato-sauce',
    'tomato paste': 'tomato-paste',
    salsa: 'salsa',
    pesto: 'pesto',
    'alfredo sauce': 'alfredo-sauce',
    gravy: 'gravy',
    'curry paste': 'curry-paste',
    'cranberry sauce': 'cranberry-sauce',
    'sausage gravy': 'sausage-gravy',
    'cream gravy': 'cream-gravy',
    giblet: 'giblet',
    peas: 'peas',
    'black beans': 'black-beans',
    chickpea: 'chickpea',
    chickpeas: 'chickpea',
    lentil: 'lentil',
    hummus: 'hummus',
    'chili beans': 'chili-beans',
    'lima beans': 'lima-beans',
    'kidney beans': 'kidney-beans',
    'pinto beans': 'pinto-beans',
    edamame: 'edamame',
    'split peas': 'split-peas',
    'snap peas': 'snap-peas',
    soybeans: 'soybeans',
    'navy beans': 'navy-beans',
    'french beans': 'french-beans',
    'red beans': 'red-beans',
    'fava beans': 'fava-beans',
    wine: 'wine',
    beer: 'beer',
    'red wine': 'red-wine',
    vodka: 'vodka',
    rum: 'rum',
    whiskey: 'whiskey',
    tequila: 'tequila',
    sherry: 'sherry',
    bourbon: 'bourbon',
    'cooking wine': 'cooking-wine',
    whisky: 'whisky',
    liqueur: 'liqueur',
    brandy: 'brandy',
    gin: 'gin',
    kahlua: 'kahlua',
    'irish cream': 'irish-cream',
    'triple sec': 'triple-sec',
    champagne: 'champagne',
    amaretto: 'amaretto',
    'cabernet sauvignon': 'cabernet-sauvignon',
    vermouth: 'vermouth',
    bitters: 'bitters',
    maraschino: 'maraschino',
    sake: 'sake',
    'grand marnier': 'grand-marnier',
    masala: 'masala',
    'dessert wine': 'dessert-wine',
    schnapps: 'schnapps',
    'port wine': 'port-wine',
    'sparkling wine': 'sparkling-wine',
    cognac: 'cognac',
    limoncello: 'limoncello',
    'bloody mary': 'bloody-mary',
    liquor: 'liquor',
    curacao: 'curacao',
    frangelico: 'frangelico',
    'shaoxing wine': 'shaoxing-wine',
    absinthe: 'absinthe',
    'madeira wine': 'madeira-wine',
    ouzo: 'ouzo',
    anisette: 'anisette',
    grappa: 'grappa',
    ciclon: 'ciclon',
    drambuie: 'drambuie',
    patty: 'patty',
    'ranch dip': 'ranch-dip',
    'spicy grilled beef': 'spicy-grilled-beef',
    broth: 'broth',
    soup: 'soup',
    vegetable: 'vegetable',
    dashi: 'dashi',
    stock: 'stock',
    'peanut butter': 'peanut-butter',
    almond: 'almond',
    almonds: 'almond',
    tzatziki: 'tzatziki',
    walnut: 'walnut',
    pecan: 'pecan',
    peanut: 'peanut',
    cashew: 'cashew',
    flax: 'flax',
    'pine nut': 'pine-nut',
    pistachio: 'pistachio',
    'almond meal': 'almond-meal',
    hazelnut: 'hazelnut',
    macadamia: 'macadamia',
    'almond paste': 'almond-paste',
    chestnut: 'chestnut',
    praline: 'praline',
    macaroon: 'macaroon',
    margarine: 'margarine',
    'coconut milk': 'coconut-milk',
    'almond milk': 'almond-milk',
    'soy milk': 'soy-milk',
    'rice milk': 'rice-milk',
    'hemp milk': 'hemp-milk',
    'non dairy creamer': 'non-dairy-creamer',
    chocolate: 'chocolate',
    'apple sauce': 'apple-sauce',
    'strawberry jam': 'strawberry-jam',
    'graham cracker': 'graham-cracker',
    marshmallow: 'marshmallow',
    'chocolate syrup': 'chocolate-syrup',
    'potato chips': 'potato-chips',
    potatoes: 'potato',
    nutella: 'nutella',
    'chocolate morsels': 'chocolate-morsels',
    'bittersweet chocolate': 'bittersweet-chocolate',
    'pudding mix': 'pudding-mix',
    'raspberry jam': 'raspberry-jam',
    'dark chocolate': 'dark-chocolate',
    'chocolate chips': 'chocolate-chips',
    jam: 'jam',
    'white chocolate': 'white-chocolate',
    'brownie mix': 'brownie-mix',
    'chocolate pudding': 'chocolate-pudding',
    jello: 'jello',
    caramel: 'caramel',
    'chocolate powder': 'chocolate-powder',
    candy: 'candy',
    'corn chips': 'corn-chips',
    cookies: 'cookies',
    'apricot jam': 'apricot-jam',
    'chocolate bar': 'chocolate-bar',
    'cookie dough': 'cookie-dough',
    oreo: 'oreo',
    doritos: 'doritos',
    'chocolate cookies': 'chocolate-cookies',
    butterscotch: 'butterscotch',
    'blackberry preserves': 'blackberry-preserves',
    'blueberry jam': 'blueberry-jam',
    'peach preserves': 'peach-preserves',
    'cherry jam': 'cherry-jam',
    'fig jam': 'fig-jam',
    'plum jam': 'plum-jam',
    'cinnamon roll': 'cinnamon-roll',
    fudge: 'fudge',
    'cookie crumb': 'cookie-crumb',
    'grape jelly': 'grape-jelly',
    'chilli jam': 'chilli-jam',
    'lady fingers': 'lady-fingers',
    'black pudding': 'black-pudding',
    'chocolate wafer': 'chocolate-wafer',
    'gummy worms': 'gummy-worms',
    'biscotti biscuit': 'biscotti-biscuit',
    doughnut: 'doughnut',
    'amaretti cookies': 'amaretti-cookies',
    'apple jelly': 'apple-jelly',
    'red pepper jelly': 'red-pepper jelly',
    peppers: 'pepper',
    'orange jelly': 'orange-jelly',
    'jalapeno jelly': 'jalapeno-jelly',
    'mint jelly': 'mint-jelly',
    'currant jelly': 'currant-jelly',
    'lemon jelly': 'lemon-jelly',
    'quince jelly': 'quince-jelly',
    coffee: 'coffee',
    'orange juice': 'orange-juice',
    tea: 'tea',
    'green tea': 'green-tea',
    'apple juice': 'apple-juice',
    'tomato juice': 'tomato-juice',
    coke: 'coke',
    'chocolate milk': 'chocolate-milk',
    'pineapple juice': 'pineapple-juice',
    lemonade: 'lemonade',
    'cranberry juice': 'cranberry-juice',
    espresso: 'espresso',
    'fruit juice': 'fruit-juice',
    'ginger ale': 'ginger-ale',
    'club soda': 'club-soda',
    sprite: 'sprite',
    'kool aid': 'kool-aid',
    grenadine: 'grenadine',
    'margarita mix': 'margarita-mix',
    'cherry juice': 'cherry-juice',
    pepsi: 'pepsi',
    'mountain dew': 'mountain-dew',
    'bean sprout': 'bean-sprout',
  },
  Cuisine: {
    American: 'american',
    Italian: 'italian',
    Steakhouse: 'steakhouse',
    Seafood: 'seafood',
    French: 'french',
    Indian: 'indian',
    Mexican: 'mexican',
    Japanese: 'japanese',
    British: 'british',
    Chinese: 'chinese',
    German: 'german',
    Spanish: 'spanish',
    Pizzeria: 'pizzeria',
    Fusion: 'fusion',
    Eclectic: 'fusion',
    Barbecue: 'barbecue',
    Greek: 'greek',
    Tapas: 'tapas',
    'Small Plates': 'tapas',
    Grill: 'grill',
    'Comfort Food': 'comfortfood',
    Irish: 'irish',
    'Afternoon Tea': 'teaceremony',
    Portuguese: 'portuguese',
    Burgers: 'burgers',
    Canadian: 'canadian',
    Lebanese: 'labenese',
    Korean: 'korean',
    Cuban: 'cuban',
    Moroccan: 'moroccan',
    Organic: 'organic',
    Vegetarian: 'vegetarian',
    Vegan: 'vegetarian',
    Ethiopian: 'ethiopian',
    Nepalese: 'nepalese',
    Breakfast: 'breakfast',
    Fish: 'fish',
    Dessert: 'dessert',
    'Home cooking': 'homecooking',
    'Fine cuts': 'finecuts',
    Filipino: 'filipino',
    'Country kitchen': 'country',
    Polynesian: 'polynesian',
    Ecuadorian: 'ecuadorian',
    Ukrainian: 'ukrainian',
    African: 'african',
    Asian: 'asian',
    Bar: 'bar',
    Bistro: 'bistro',
    'Bottle Service': 'bar',
    Lounge: 'bar',
    Brewery: 'brewery',
    Cajun: 'cajun',
    Caribbean: 'caribbean',
    'Cocktail Bar': 'cocktail',
    'Contemporary Asian': 'contemporary',
    'Contemporary European': 'contemporary',
    'Contemporary French': 'contemporary',
    'Contemporary Southern': 'contemporary',
    Continental: 'continental',
    'Dim Sum': 'dimsum',
    'Dining Bar': 'diningbar',
    'Farm-to-table': 'farmtotable',
    'Gastro Pub': 'gastropub',
    Global: 'global',
    'Latin American': 'latinamerican',
    'Modern European': 'modern',
    'Pacific Rim': 'pacificrim',
    'Pan-Asian': 'panasian',
    'Rotisserie Chicken': 'rotisseriechicken',
    'Southeast Asian': 'southeastasian',
    'Sports Bar': 'sportsbar',
    Unspecified: 'unspecified',
    'Quick Bites': 'quickbite',
    'Coffee & Tea': 'coffee',
    Bakeries: 'bakery',
    'Bars & Pubs': 'pub',
    'Speciality Food Market': 'foodmarket',
    Afghani: 'afghani',
    Albanian: 'albanian',
    Arabic: 'arabic',
    Armenian: 'armenian',
    Australian: 'australian',
    Austrian: 'austrian',
    Belgian: 'belgian',
    Brazilian: 'brazilian',
    'Brew Pub': 'brewpub',
    Burmese: 'burmese',
    Cafe: 'cafe',
    'Cajun & Creole': 'cajun',
    Cambodian: 'cambodian',
    Campania: 'campania',
    Cantonese: 'cantonese',
    Catalan: 'catalan',
    'Central American': 'centralamerican',
    'Central Asian': 'centralasian',
    'Central European': 'centraleuropean',
    Colombian: 'colombian',
    Contemporary: 'contemporary',
    Deli: 'deli',
    Diner: 'diner',
    'Dining bars': 'digingbar',
    Dutch: 'dutch',
    'Eastern European': 'easterneuropean',
    Egyptian: 'egyptian',
    European: 'european',
    'Fast food': 'fastfood',
    Gastropub: 'gastropub',
    Hawaiian: 'hawaiian',
    Healthy: 'healthy',
    'Hong Kong': 'hongkong',
    Indonesian: 'indonesian',
    International: 'international',
    Israeli: 'israeli',
    Jamaican: 'jamaican',
    'Japanese Fusion': 'japanesefusion',
    Latin: 'latin',
    Malaysian: 'malaysian',
    Mediterranean: 'mediterranean',
    'Middle Eastern': 'middleeastern',
    Mongolian: 'mongolian',
    'Native American': 'nativeamerican',
    Neapolitan: 'neapolitan',
    'New Zealand': 'newzealand',
    'Northern-Italian': 'northernitalian',
    Pakistani: 'pakistani',
    Persian: 'persian',
    Peruvian: 'peruvian',
    Philippine: 'philippine',
    Pizza: 'pizza',
    Polish: 'polish',
    Pub: 'pub',
    Russian: 'russian',
    Salvadoran: 'salvadoran',
    Scandinavian: 'scandinavian',
    Shanghai: 'shanghai',
    Sicilian: 'sicilian',
    Singaporean: 'singaporean',
    Soups: 'soups',
    'South American': 'south american',
    'Southern-Italian': 'southernitalian',
    Southwestern: 'southwestern',
    'Sri Lankan': 'srilankan',
    'Street Food': 'street food',
    Sushi: 'sushi',
    Swiss: 'swiss',
    Szechuan: 'szechuan',
    Taiwanese: 'taiwanese',
    Thai: 'thai',
    Tibetan: 'tibetan',
    Tunisian: 'tunisian',
    Turkish: 'turkish',
    Vietnamese: 'vietnamese',
    'Wine Bar': 'wine',
    'Vegetarian Friendly': 'vegetarian',
    'Vegan Options': 'vegan',
    'Gluten Free Options': 'glutenfree',
    Halal: 'halal',
    Kosher: 'kosher',
    'North Indian': 'northindian',
    'South Indian': 'indianindian',
    'Gluten Free Friendly': 'glutterfree',
    'Vegan Friendly': 'vegan',
    'Indian Curry': 'indian',
    'Coffee and Tea': 'drinks',
    Desserts: 'desserts',
    BBQ: 'bbq',
    Southern: 'southern',
    'Breakfast and Brunch': 'breakfast',
    'Public House': 'publichouse',
    'Canadian Cuisine': 'canadian',
    'Bar Food': 'barfood',
    Szechwan: 'szechwan',
    Chicken: 'chicken',
    Americana: 'american',
    'Fast Food': 'fastfood',
    'New Mexican': 'newmexican',
    'Allergy Friendly': 'allergyfriendly',
    'Asian Fusion': 'asian',
    Rolls: 'asian',
    寿司: 'asian',
    アジア料理: 'asian',
    日本料理: 'japanese',
    Northwest: 'northwest',
    'Contemporary American': 'contemporaryamerican',
    'West Coast': 'westcoast',
    Creative: 'creative',
    'Continental Cuisine': 'continental',
    Chowder: 'crowder',
    'Contemporary Indian': 'contemporaryindian',
    Creole: 'creole',
    'Contemporary Italian': 'contemporaryitalian',
    'Contemporary Canadian': 'contemporarycanadian',
    'Northwest British, Canadian': 'northwestbritish',
    Carribean: 'carribean',
    spanish: 'spanish',
    Western: 'western',
    korean: 'korean',
    Bavarian: 'bavarian',
    Curry: 'indian',
    'Classic French': 'classicfrench',
    Californian: 'californean',
    Burritos: 'mexican',
    Taco: 'mexican',
    'East Indian': 'eastindian',
    Pasta: 'pasta',
    Sandwiches: 'sandwiches',
    Wings: 'wings',
    Noodles: 'noodles',
    Ramen: 'ramen',
    Salads: 'salads',
    Steak: 'steak',
    'Bubble Tea': 'tea',
    pizza: 'pizza',
    pasta: 'pasta',
    Café: 'cafe',
    'Market Cuisine': 'marketcuisine',
    Teppanyaki: 'teppanyaki',
    'Beer bars': 'bar',
    Yakitori: 'yakitori',
    Shellfish: 'fish',
    Wine: 'wine',
    'Gourmet Picnics': 'picnic',
    Casual: 'casual',
    'Wines On Tap': 'wine',
    Lunch: 'lunch',
    Dining: 'dinner',
    Brunch: 'brunch',
    Dinner: 'dinner',
    'Marina View': 'marinaview',
    Online: 'online',
    Patio: 'patio',
    'Private Dining': 'dinner',
    Coffee: 'coffee',
    'Low Country': 'country',
    Panino: 'panino',
    Hotel: 'hotel',
    Antipasti: 'antipasti',
    Meat: 'meat',
    Bakery: 'bakery',
    Vindaloo: 'vindaloo',
    Kheer: 'kheer',
    Biryani: 'biryani',
    Soup: 'soup',
    Specialties: 'specialties',
    Bread: 'Bread',
    Appetizers: 'appetizers',
    Dishes: 'dishes',
    Paneer: 'paneer',
    'Raga Breads': '',
    'Fine dining': 'dinner',
    Regional: 'regional',
    'Chef Michel Jacob': '',
    Restaurant: 'restaurant',
    Diamond: 'diamond',
    Hamburger: 'hamburgers',
    'Tex Mex': 'texmex',
    Salad: 'salad',
    italian: 'italian',
    german: 'german',
    vietnamese: 'vietnamese',
  },
  'Good For': {
    'Great for Outdoor Dining': 'outdoor',
    'Great for Brunch': 'brunches',
    Couples: 'couples',
    Dancing: 'dancing',
    Families: 'families',
    'Father\'s Day': 'fathersday',
    'Fit for Foodies': 'foodies',
    'Good for Anniversaries': 'anniversaries',
    'Good for Birthdays': 'birthdays',
    'Good for Groups': 'groups',
    'Good for a Business Meeting': 'business',
    'Good for a Date': 'date',
    'Kid-friendly': 'kids',
    'Mother\'s Day': 'mothersday',
    'Recommended for Travelers': 'travelers',
    'Special Occasion': 'occasion',
    Tourists: 'tourists',
    'Valentine\'s Day': 'valentinesday',
    'Bar Scene': 'bar',
    'Business meetings': 'business',
    'Child-friendly': 'family',
    Groups: 'groups',
    Kids: 'kids',
    Romantic: 'date',
    'Special Occasion Dining': 'specialoccasion',
  },
  Features: {
    'Top Rated': 'toprated',
    Authentic: 'authentic',
    'Bar Seating': 'bar',
    'Book the Bar': 'bar',
    Cellar: 'cellar',
    Charming: 'charming',
    'Check the Wait': 'longwait',
    'Comfort Food': 'comfortfood',
    Convenient: 'convenient',
    Cozy: 'cozy',
    'Creative Cuisine': 'creative',
    'Earn Bonus Points': 'bonuspoints',
    'Family Style': 'familystyle',
    'Farm To Table': 'farmtotable',
    Fireplace: 'fireplace',
    Formal: 'formal',
    'Fried Food': 'friedfood',
    'Gluten Free Options': 'glutenfree',
    'Good Value': 'goodvalue',
    'Great Beer': 'beer',
    'Great Service': 'service',
    'Great for Brunch': 'brunch',
    'Great for Lunch': 'lunch',
    'Handcrafted Cocktails': 'cocktails',
    'Happy Hour': 'happyhour',
    Healthy: 'healthy',
    'High Ceilings': 'highceilings',
    'Hot Spot': 'hotspot',
    'Live Music': 'livemusic',
    'Local Ingredients': 'localingredients',
    'Modern Decor': 'decor',
    'New & Hot': 'new',
    'Notable Wine List': 'wine',
    'Open Kitchen': 'openkitchen',
    Organic: 'organic',
    'Outdoor Seating': 'patio',
    'People Watching': 'peoplewatching',
    'Prix Fixe Menu': 'prixfixe',
    'Quick Bite': 'quickbite',
    'Quiet Conversation': 'quiet',
    Romantic: 'romantic',
    'Scenic View': 'scenicview',
    Seasonal: 'seasonal',
    Spicy: 'spicy',
    TV: 'tv',
    Tapas: 'tapas',
    'Tasting Flight': 'flight',
    'Tasting Menu': 'tasting',
    Upscale: 'upscale',
    Valet: 'valet',
    Vegan: 'vegan',
    Waterfront: 'waterfront',
    'Wood Oven': 'woodoven',
    Breakfast: 'breakfast',
    Brunch: 'brunch',
    Lunch: 'lunch',
    Dinner: 'dinner',
    'Local cuisine': 'localcuisine',
    View: 'view',
    Buffet: 'buffet',
    Delivery: 'delivery',
    'Free Wifi': 'wifi',
    'Parking Available': 'parking',
    'Private Dining': 'private',
    Reservations: 'reservations',
    'Serves Alcohol': 'alcohol',
    'Table Service': 'tableservice',
    Takeout: 'takeout',
    Television: 'tv',
    'Wheelchair Accessible': 'wheelchair',
    'Outdoor dining': 'outdoor',
    'Gluten-free Menu': 'glutenfree',
    'Private Room': 'privateroom',
    'Patio/Outdoor Dining': 'outdoor',
    'Wi-Fi available': 'wifi',
  },
};

const dish = ['Ingredients', 'Cuisine'];
const restaurant = ['Cuisine', 'Good For', 'Features'];
module.exports = { allIngredients, dish, restaurant };
