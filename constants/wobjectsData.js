exports.FIELDS_NAMES = {
  BODY: 'body',
  MAP: 'map',
  TAG_CATEGORY: 'tagCategory',
  CATEGORY_ITEM: 'categoryItem',
  AUTHORITY: 'authority',
  STATUS: 'status',
  NEWS_FILTER: 'newsFilter',
  RATING: 'rating',
  TAG_CLOUD: 'tagCloud',
  TITLE: 'title',
  DESCRIPTION: 'description',
  NAME: 'name',
  PARENT: 'parent',
  GALLERY_ALBUM: 'galleryAlbum',
  GALLERY_ITEM: 'galleryItem',
  AVATAR: 'avatar',
  WEBSITE: 'website',
  BACKGROUND: 'background',
  ADDRESS: 'address',
  LINK: 'link',
  TAG: 'tag',
  PHONE: 'phone',
  EMAIL: 'email',
  PRICE: 'price',
  BUTTON: 'button',
  WORK_TIME: 'workTime',
  CHART_ID: 'chartid',
  PAGE_CONTENT: 'pageContent',
  LIST_ITEM: 'listItem',
  SORT_CUSTOM: 'sortCustom',
  COMPANY_ID: 'companyId',
  PRODUCT_ID: 'productId',
  GROUP_ID: 'groupId',
  OPTIONS: 'options',
  AGE_RANGE: 'ageRange',
  PUBLICATION_DATE: 'publicationDate',
  LANGUAGE: 'language',
  WEIGHT: 'productWeight',
  DIMENSIONS: 'dimensions',
  AUTHORS: 'authors',
  PUBLISHER: 'publisher',
  PRINT_LENGTH: 'printLength',
  WIDGET: 'widget',
  NEWS_FEED: 'newsFeed',
  DEPARTMENTS: 'departments',
  BLOG: 'blog',
  FORM: 'form',
  MERCHANT: 'merchant',
  MANUFACTURER: 'manufacturer',
  BRAND: 'brand',
  FEATURES: 'features',
  PIN: 'pin',
  REMOVE: 'remove',
  SHOP_FILTER: 'shopFilter',
  MENU_ITEM: 'menuItem',
  RELATED: 'related',
  ADD_ON: 'addOn',
  SIMILAR: 'similar',
  AFFILIATE_BUTTON: 'affiliateButton',
  AFFILIATE_PRODUCT_ID_TYPES: 'affiliateProductIdTypes',
  AFFILIATE_GEO_AREA: 'affiliateGeoArea',
  AFFILIATE_URL_TEMPLATE: 'affiliateUrlTemplate',
  AFFILIATE_CODE: 'affiliateCode',
  WEB_PAGE: 'webpage',
  MAP_RECTANGLES: 'mapRectangles',
  MAP_OBJECT_TYPES: 'mapObjectTypes',
  MAP_OBJECT_TAGS: 'mapObjectTags',
  MAP_MOBILE_VIEW: 'mapMobileView',
  MAP_DESKTOP_VIEW: 'mapDesktopView ',
  WALLET_ADDRESS: 'walletAddress',
  DELEGATION: 'delegation',
  URL: 'url',
  CALORIES: 'calories',
  BUDGET: 'budget',
  COOKING_TIME: 'cookingTime',
  COST: 'cost',
  RECIPE_INGREDIENTS: 'recipeIngredients',
  PROMOTION: 'promotion',
};

exports.SEARCH_FIELDS = [
  'author_permlink',
  this.FIELDS_NAMES.NAME,
  this.FIELDS_NAMES.EMAIL,
  this.FIELDS_NAMES.PHONE,
  this.FIELDS_NAMES.ADDRESS,
  this.FIELDS_NAMES.TITLE,
  this.FIELDS_NAMES.DESCRIPTION,
  this.FIELDS_NAMES.CATEGORY_ITEM,
  this.FIELDS_NAMES.COMPANY_ID,
  this.FIELDS_NAMES.PRODUCT_ID,
  this.FIELDS_NAMES.GROUP_ID,
  this.FIELDS_NAMES.AUTHORS,
  this.FIELDS_NAMES.PUBLISHER,
  this.FIELDS_NAMES.BRAND,
  this.FIELDS_NAMES.MANUFACTURER,
  this.FIELDS_NAMES.MERCHANT,
  this.FIELDS_NAMES.RECIPE_INGREDIENTS,
];

exports.AUTHORITY_FIELD_ENUM = {
  ADMINISTRATIVE: 'administrative',
  OWNERSHIP: 'ownership',
};

exports.OBJECT_TYPES = {
  HASHTAG: 'hashtag',
  LIST: 'list',
  PAGE: 'page',
  RESTAURANT: 'restaurant',
  DISH: 'dish',
  DRINK: 'drink',
  BUSINESS: 'business',
  PRODUCT: 'product',
  SERVICE: 'service',
  COMPANY: 'company',
  PERSON: 'person',
  PLACE: 'place',
  CRYPTO: 'crypto',
  HOTEL: 'hotel',
  ORGANIZATION: 'organization',
  MOTEL: 'motel',
  RESORT: 'resort',
  BnB: 'b&b',
  BOOK: 'book',
  WIDGET: 'widget',
  NEWS_FEED: 'newsfeed',
  SHOP: 'shop',
  WEB_PAGE: 'webpage',
  MAP: 'map',
  LINK: 'link',
  RECIPE: 'recipe',
};

exports.CREATE_TAGS_ON_UPDATE_TYPES = [
  this.OBJECT_TYPES.RESTAURANT,
  this.OBJECT_TYPES.DRINK,
  this.OBJECT_TYPES.DISH,
];

exports.ADMIN_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  OWNERSHIP: 'ownership',
  ADMINISTRATIVE: 'administrative',
};

exports.VOTE_STATUSES = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

exports.TAG_CLOUDS_UPDATE_COUNT = 5;
exports.RATINGS_UPDATE_COUNT = 4;
exports.MIN_PERCENT_TO_SHOW_UPDATE = 70;

exports.OBJECT_TYPES_WITH_ALBUM = [
  this.OBJECT_TYPES.CRYPTO,
  this.OBJECT_TYPES.LIST,
  this.OBJECT_TYPES.PRODUCT,
  this.OBJECT_TYPES.BOOK,
  this.OBJECT_TYPES.RECIPE,
  this.OBJECT_TYPES.LINK,
  this.OBJECT_TYPES.DRINK,
  this.OBJECT_TYPES.PLACE,
  this.OBJECT_TYPES.BUSINESS,
  this.OBJECT_TYPES.PAGE,
  this.OBJECT_TYPES.SERVICE,
  this.OBJECT_TYPES.COMPANY,
  this.OBJECT_TYPES.PERSON,
  this.OBJECT_TYPES.HOTEL,
  this.OBJECT_TYPES.RESTAURANT,
  this.OBJECT_TYPES.DISH,
];

exports.WOBJECT_LATEST_POSTS_COUNT = 30;

exports.OBJECT_TYPES_FOR_COMPANY = [
  this.OBJECT_TYPES.BnB,
  this.OBJECT_TYPES.BUSINESS,
  this.OBJECT_TYPES.COMPANY,
  this.OBJECT_TYPES.HOTEL,
  this.OBJECT_TYPES.MOTEL,
  this.OBJECT_TYPES.ORGANIZATION,
  this.OBJECT_TYPES.PLACE,
  this.OBJECT_TYPES.RESORT,
  this.OBJECT_TYPES.RESTAURANT,
];

exports.INDEPENDENT_FIELDS = [
  this.FIELDS_NAMES.STATUS,
  this.FIELDS_NAMES.MAP,
  this.FIELDS_NAMES.PARENT,
];

exports.ARRAY_FIELDS = [
  this.FIELDS_NAMES.CATEGORY_ITEM,
  this.FIELDS_NAMES.LIST_ITEM,
  this.FIELDS_NAMES.TAG_CATEGORY,
  this.FIELDS_NAMES.GALLERY_ITEM,
  this.FIELDS_NAMES.GALLERY_ALBUM,
  this.FIELDS_NAMES.RATING,
  this.FIELDS_NAMES.BUTTON,
  this.FIELDS_NAMES.PHONE,
  this.FIELDS_NAMES.BLOG,
  this.FIELDS_NAMES.FORM,
  this.FIELDS_NAMES.NEWS_FILTER,
  this.FIELDS_NAMES.COMPANY_ID,
  this.FIELDS_NAMES.PRODUCT_ID,
  this.FIELDS_NAMES.OPTIONS,
  this.FIELDS_NAMES.AUTHORS,
  this.FIELDS_NAMES.DEPARTMENTS,
  // works different from waivio.api used only for task
  this.FIELDS_NAMES.AUTHORITY,
];

exports.categorySwitcher = {
  galleryAlbum: this.FIELDS_NAMES.GALLERY_ITEM,
  galleryItem: this.FIELDS_NAMES.GALLERY_ITEM,
  tagCategory: this.FIELDS_NAMES.CATEGORY_ITEM,
};

exports.OBJECT_TYPES_FOR_PRODUCT = [
  this.OBJECT_TYPES.PRODUCT,
  this.OBJECT_TYPES.SERVICE,
  this.OBJECT_TYPES.BOOK,
  this.OBJECT_TYPES.PERSON,
  this.OBJECT_TYPES.RECIPE,
];

exports.WEIGHT_UNITS = [
  't',
  'kg',
  'gm',
  'mg',
  'mcg',
  'st',
  'lb',
  'oz',
];

exports.DIMENSION_UNITS = [
  'km',
  'm',
  'cm',
  'mm',
  'μm',
  'mi',
  'yd',
  'ft',
  'in',
  'nmi',
];

exports.OBJECT_TYPES_FOR_GROUP_ID = [
  this.OBJECT_TYPES.PRODUCT,
  this.OBJECT_TYPES.SERVICE,
  this.OBJECT_TYPES.BOOK,
];
