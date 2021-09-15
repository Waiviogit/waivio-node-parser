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
