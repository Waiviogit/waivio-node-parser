const WOBJECT_REF = '/object/([a-z0-9-]*)';

const HOSTS_TO_PARSE_LINKS = [
  'waivio.com',
  'waiviodev.com',
  'dining.gifts',
  'social.gifts',
];

const RE_HTTPS = new RegExp(/^https:\/\//);

const RE_LINKS = /https?:\/\/[^\s\/$.?#].[^\s]*/gm;

const RE_HASHTAGS = new RegExp(/(?<=[^\[]|^)#(\w[a-z-]+\w)(?!;)/);

module.exports = {
  WOBJECT_REF,
  HOSTS_TO_PARSE_LINKS,
  RE_HTTPS,
  RE_HASHTAGS,
  RE_LINKS,
};
