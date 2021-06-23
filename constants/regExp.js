const WOBJECT_REF = '/object/([a-z0-9-]*)';

exports.HOSTS_TO_PARSE_LINKS = [
  'waivio.com',
  'dining.gifts',
];

exports.RE_HTTPS = new RegExp(/^https:\/\//);

exports.RE_WOBJECT_REF = new RegExp(`${this.HOSTS_TO_PARSE_LINKS.map((el) => `${el}${WOBJECT_REF}`).join('|')}`);
