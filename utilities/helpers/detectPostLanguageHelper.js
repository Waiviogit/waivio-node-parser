const _ = require('lodash');
const franc = require('franc-min');
const { User } = require('database').models;

const languageList = {
  'en-US': 'eng',
  'id-ID': 'ind',
  'ms-MY': 'zlm',
  'ca-ES': 'cat',
  'cs-CZ': 'ces',
  'da-DK': 'dan',
  'de-DE': 'deu',
  'et-EE': 'est',
  'es-ES': 'spa',
  'fr-FR': 'fra',
  'hr-HR': 'hrv',
  'it-IT': 'ita',
  'hu-HU': 'hun',
  'nl-HU': 'nld',
  'no-NO': 'nno',
  'pl-PL': 'pol',
  'pt-BR': 'por',
  'ro-RO': 'ron',
  'sl-SI': 'slv',
  'sv-SE': 'swe',
  'vi-VN': 'vie',
  'tr-TR': 'tur',
  'yo-NG': 'yor',
  'el-GR': 'ell',
  'bg-BG': 'bul',
  'ru-RU': 'rus',
  'uk-UA': 'ukr',
  'he-IL': 'heb',
  'ar-SA': 'arb',
  'ne-NP': 'nep',
  'hi-IN': 'hin',
  'bn-IN': 'ben',
  'ta-IN': 'tam',
  'lo-LA': 'lao',
  'th-TH': 'tha',
  'ko-KR': 'kor',
  'ja-JP': 'jpn',
  'zh-CN': 'cmn',
};

const getFormattedLanguages = ({ languages = [] }) => {
  const LANGUAGE_LIST = _.invert(languageList);
  let addMore = true;
  if (!languages.length) return [];
  const result = languages.reduce((acc, el, i) => {
    const [lang] = el;
    if (lang === 'crt') return acc;
    const supportedLang = LANGUAGE_LIST[lang];
    if (!supportedLang || !addMore) return acc;
    acc.push(supportedLang);
    if (lang === 'eng' && !i) addMore = false;
    return acc;
  }, []);
  if (!result.length) return result;
  if (!result.includes(LANGUAGE_LIST.eng)) {
    return [result[0]];
  }
  return result;
};

/**
 * Detect language of Post content depend on User preference
 * @param title Title of the post
 * @param body Body of the post (main content)
 * @param author Author of the post
 * @returns {Promise<string|*>} Sting, code of language in format 'en-US'
 */
module.exports = async ({ title = '', body = '', author } = {}) => {
  const userLanguages = await getUserLanguages(author);
  let text = `${title.replace(/(?:!?\[(.*?)\]\((.*?)\))|(<\/?[^>]+(>|$))/g, '')}\n`;
  text += body.replace(/(?:!?\[(.*?)\]\((.*?)\))|(<\/?[^>]+(>|$))/g, '');
  let existLanguages = franc.all(text, { only: Object.values(languageList) });
  const languages = getFormattedLanguages({ languages: _.take(existLanguages, 2) });

  existLanguages = existLanguages.map((item) => ({
    language: findCorrectLanguageFormat(item[0]),
    rate: item[1],
  }));

  // if lib didn't match any language ¯\_(ツ)_/¯
  if (_.isEmpty(existLanguages)) {
    // chose language from author language, english has priority
    if (_.isEmpty(userLanguages) || (userLanguages.length === 1 && _.get(userLanguages, '[0]') === 'auto')) {
      return {
        language: 'en-US',
        languages,
      };
    }
    if (userLanguages.includes('en-US')) {
      return {
        language: 'en-US',
        languages,
      };
    }
    const index = userLanguages.indexOf('auto');
    if (index !== -1) {
      userLanguages.splice(index, 1);
    }
    return {
      language: _.first(userLanguages),
      languages,
    };
  }
  // else if matched languages not empty,
  // get top 5 matched languages,
  // and overlap it with user languages
  const overlapLang = _
    .chain(existLanguages)
    .slice(0, 5)
    .filter((item) => userLanguages.includes(item.language))
    .get('[0].language')
    .value();
  if (overlapLang) {
    return {
      language: overlapLang,
      languages,
    };
  }
  // else just return top from matched languages

  return {
    language: existLanguages[0].language,
    languages,
  };
};

/**
 * Get preferred user languages, get from read_languages, language of interface and postLanguages
 * @param name Uniq STEEM user name
 * @returns {Promise<*[{String}]>} Array of languages (if format 'en-US', 'ru-RU') or empty array
 */
const getUserLanguages = async (name) => {
  const user = await User.findOne({ name }, { _id: 0, read_locales: 1, 'user_metadata.settings': 1 });
  const userLanguages = new Set([
    ..._.get(user, 'read_locales', []),
    ..._.get(user, 'user_metadata.settings.postLocales', []),
    _.get(user, 'user_metadata.settings.locale'),
  ]);
  return _.compact(Array.from(userLanguages));
};
/**
 * Format language code from "franc" library form( 'eng', 'rus' )
 * to correct form (e.g. 'en-US', 'ru-RU' etc.).
 * If it's no matches => return "en-US" by default
 * @param lang3Format Required param, language in format of 3 letter, e.g. eng, rus, etc.
 */
const findCorrectLanguageFormat = (lang3Format) => _.chain(languageList).invert().get(lang3Format, 'en-US').value();
