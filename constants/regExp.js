const WOBJECT_REF = '/object/([a-z0-9-]*)';

const HOSTS_TO_PARSE_LINKS = [
  'waivio.com',
  'dining.gifts',
];

exports.RE_WOBJECT_LINK = new RegExp(/waivio\.com\/object\/[a-z0-9-]+$|waivio\.com\/object\/.*[\/)?:;,. ]/gm);

exports.RE_WOBJECT_AUTHOR_PERMLINK = new RegExp(/waivio\.com\/object\/([a-z0-9-]+)[\/)?:;,. ]/);

exports.RE_WOBJECT_AUTHOR_PERMLINK_ENDS = new RegExp(/waivio\.com\/object\/([a-z0-9-]+$)/);

exports.RE_HTTPS = new RegExp(/^https:\/\//);

exports.RE_WOBJECT_REF = new RegExp(`${HOSTS_TO_PARSE_LINKS.map((el) => el + WOBJECT_REF).join('|')}`, 'gm');
