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

exports.REQUIREDFIELDS_PARENT = [
  this.FIELDS_NAMES.MAP,
];

exports.TAG_CLOUDS_UPDATE_COUNT = 5;
exports.RATINGS_UPDATE_COUNT = 4;
exports.MIN_PERCENT_TO_SHOW_UPDATE = 70;
