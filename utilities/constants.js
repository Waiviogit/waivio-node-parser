const appsBots = [ 'partico', 'dtube', 'actifit', 'steemhunt', 'drugwars' ];

const serviceBots = [ 'steemitboard', 'siditech', 'booster', 'bot-helper', 'cheetah', 'cleverbot', 'discordia', 'drdoogie-rb-vote-trail-script', 'dr-otto-vote-bidding-bot',
    'freakazoid', 'gentlebot', 'helpbot', 'lovejuice', 'minnowsupport', 'mrsquiggle', 'promoted', 'randowhale', 'seraph', 'steemprice', 'steemvoter', 'thing-2',
    'treeplanter', 'trufflepig', 'welcomebot', 'morwhale', 'remind.bot', 'wang', 'boxmining', 'merej99', 'samstonehill', 'inertia', 'somethingsubtle',
    'stefen', 'ropaga', 'vmsolutionsltd', 'stellabelle', 'acidyo', 'ethandsmith', 'ura-soul', 'crokkon', 'eturnerx', 'greer184', 'mack-bot', 'spaminator' ];

const otherBots = [ 'voteme', 'raise-me-up', 'steeming-hot', 'steem-ua', 'vortac', 'steemchoose', 'photocircle',
    'a-bot', 'acehbot', 'actionbot', 'admiralbot', 'aldebot', 'altobot', 'altruisticbot', 'anonbot',
    'assbot', 'atombot', 'atomicfanbot', 'bangladeshbot', 'barbadossobot', 'bd-bot', 'bdbot', 'bdyabot1', 'beanbot', 'beerbot', 'bestbot', 'bidbotsarecoming', 'bigbot',
    'bigobot', 'bilbot', 'bitinfobot', 'blp-bot', 'bobot', 'boostbot', 'bot-bd', 'bot-o-belli', 'bot.vote', 'bot2020', 'bot35', 'botaktong',
    'botbangla', 'botbd', 'botchetobg', 'botcoin', 'botje11', 'botlatino', 'botreporter', 'botsownarmy', 'botsteem', 'botswork', 'bott', 'bottomse1', 'bottomses',
    'bottrain', 'bottumyfeeder', 'botty', 'bottymcbotface', 'botvoter', 'brainbot', 'bro-bot', 'bullbot', 'cabotmurder', 'ccsbot', 'ceskyrobot', 'charitybot', 'cheap-bot',
    'cleverbot', 'conectionbot', 'coolbot', 'corpusclerobotic', 'crabbot', 'crystalrobot', 'curatorbot', 'destabot', 'destabot1', 'destabot3',
    'deutschbot', 'devaultbot', 'diosbot', 'downbot', 'downvote-bot', 'duplibot', 'dvotebot', 'earthnation-bot', 'easybot', 'embot', 'farmbot', 'filebot', 'findurfinebot',
    'flag.god.bot', 'flamingbot', 'flashbot', 'foodforestbot', 'free.sbd.bot', 'freetherobots', 'fulltimebot', 'fulltimebot1', 'fulltimebot10', 'fulltimebot11', 'fulltimebot12', 'fulltimebot13',
    'fulltimebot14', 'fulltimebot15', 'fulltimebot16', 'fulltimebot17', 'fulltimebot18', 'fulltimebot19', 'fulltimebot2', 'fulltimebot20', 'fulltimebot21', 'fulltimebot22', 'fulltimebot23',
    'fulltimebot24', 'fulltimebot25', 'fulltimebot26', 'fulltimebot27', 'fulltimebot28', 'fulltimebot29', 'fulltimebot3', 'fulltimebot30', 'fulltimebot31', 'fulltimebot32', 'fulltimebot33',
    'fulltimebot34', 'fulltimebot35', 'fulltimebot36', 'fulltimebot37', 'fulltimebot38', 'fulltimebot39', 'fulltimebot4', 'fulltimebot40', 'fulltimebot41', 'fulltimebot42', 'fulltimebot43',
    'fulltimebot44', 'fulltimebot45', 'fulltimebot46', 'fulltimebot47', 'fulltimebot48', 'fulltimebot49', 'fulltimebot5', 'fulltimebot50', 'fulltimebot51', 'fulltimebot52', 'fulltimebot53',
    'fulltimebot54', 'fulltimebot55', 'fulltimebot56', 'fulltimebot57', 'fulltimebot58', 'fulltimebot59', 'fulltimebot6', 'fulltimebot60', 'fulltimebot61', 'fulltimebot62', 'fulltimebot63', 'fulltimebot64',
    'fulltimebot65', 'fulltimebot66', 'fulltimebot67', 'fulltimebot68', 'fulltimebot69', 'fulltimebot7', 'fulltimebot70', 'fulltimebot71', 'fulltimebot72', 'fulltimebot73', 'fulltimebot74', 'fulltimebot75',
    'fulltimebot8', 'fulltimebot9', 'funbot', 'gan.bot', 'germanbot', 'glitterbot', 'goodcontentbot', 'goodcontentbot1', 'goodcontentbot2', 'googlybot', 'greatbot', 'grow-bot', 'gumbotrader', 'hatotobot',
    'hellobot', 'hkupvotebot', 'honestbot', 'honestbotes', 'honestbots', 'iamgirlbot', 'iamrobotboy', 'ibot', 'incrediblebot', 'incubot', 'indiaunited-bot', 'intro.bot', 'introduce.bot', 'jellyfishbot',
    'joshwho-bot', 'jumbot', 'k-bot', 'kennybot', 'killerbot', 'king-bot', 'kingbott', 'kinggbot', 'kiwibot', 'koinbot', 'krejbot', 'kryptoniabot', 'lazybot', 'lifetimebot',
    'linuxbot', 'lossbot', 'm3bot', 'mbot', 'mediabot', 'meme-bot', 'mercuribot', 'mercurybot', 'mermaidbot', 'messageinabottle', 'microbot', 'millibot', 'minibot', 'mm-creativebot', 'momabottpa1', 'monabot',
    'monsterbot', 'mrizibot', 'mrnormanobot', 'msp-bidbot', 'msp-creativebot', 'msp-lovebot', 'musicbot', 'mydicebot', 'nanobot', 'nicestbot', 'ninjabot', 'ninjapiraterobot', 'noblebot', 'oceansbot',
    'octopusbot', 'onlyprofitbot', 'palsbot', 'patternbot', 'payoutbot', 'peace-bot', 'penguinbot', 'peoplesbot', 'phenombot', 'photocirclebot', 'pibarabot', 'postbot', 'predictionbot', 'prepperbot',
    'profitable-bot', 'profitbot', 'promobot', 'ptbot', 'qamal-roion-bot', 'r-bot', 'rabbitbot', 'rabbot', 'raspibot', 'realbot', 'realprofitbot', 'remindme.bot', 'rentenbot', 'resteem-bot', 'resteembot',
    'resteemerbot', 'resteemmebot', 'reversed-bidbot', 'robotics101', 'robotjoe', 'roboto', 'robotq', 'robotsteemit', 'saveoceansbot', 'sbcbot', 'sbdbot', 'sbot', 'sdibot', 'sexbot',
    'shadowbot', 'shakespearebot', 'silvergoldbotty', 'smartbot', 'smellslikebots', 'smileybot', 'snailbot', 'soteyapanbot', 'spacebot', 'spiderbot', 'spoilerbot', 'sportbot', 'starfishbot', 'steem-bot',
    'steembot-colonel', 'steembot-general', 'steembot-soldier', 'steemboter', 'steemeditor.bot', 'steemersbot', 'steeminfobot', 'steemit-bot', 'steemitbotfree', 'steemplus-bot', 'steemus-bot', 'steemybot',
    'steevebot', 'stockholmebot', 'superbot', 'superbot777', 'swiftbot', 't-bot', 'talbot2alf', 'thebot', 'thebotfather', 'thehappybot', 'therebotlove', 'timbot606',
    'tonybot', 'transparencybot', 'travelbot', 'trustbot', 'truthbot', 'turtlebot', 'tweetbot', 'umvbot', 'upvote.bot', 'upvoting-bot', 'urobotics', 'vectorabbot', 'voteboter', 'votingbot', 'wbot01',
    'webbotreader', 'whalepromobot', 'winvotebot', 'witnessbot', 'xibot', 'yahoobot', 'zappl-bot', 'zapplbot', 'zenbot', 'haejin', 'sigizzang', 'happybelly' ];

const bitBots = [ 'postpromoter', 'buildawhale', 'sneaky-ninja', 'appreciator', 'therising', 'jerrybanfield', 'boomerang', 'upmyvote', 'promobot', 'minnowvotes',
    'smartsteem', 'upmewhale', 'inciter', 'rocky1', 'minnowbooster', 'smartmarket', 'tipu', 'tipu', 'bdvoter', 'rewards-pool', 'treeplanter', 'originalworks',
    'drotto', 'minnowpond', 'byresteem', 'siditech', 'blissfish', 'postdoctor', 'hottopic', 'steemvote', 'thundercurator', 'lays', 'bumper', 'promotedpost',
    'upvotewhale', 'steemlike', 'followforupvotes', 'withsmn', 'botcoin', 'big-whale', 'friends-bot', 'morwhale', 'earthnation-bot', 'coolbot', 'tisko',
    'crystalhuman', 'resteemable', 'microbot', 'steemvoter', 'upvotebank', 'echowhale', 'refresh', 'flagship', 'bidseption', 'resteemr', 'kiwibot', 'bubblebee',
    'cleansingpoetry', 'moonbot', 'resteembot', 'hugewhale', 'resteemyou', 'schoolofminnows', 'zerotoherobot', 'superbot', 'queqtra', 'blockgators', 'steemthat',
    'reblogit', 'earnmoresteem', 'frontrunner', 'photocontests', 'ottoman', 'fresteem', 'oceansbot', 'red-rose', 'otobot', 'postresteem', 'talhadogan', 'danzy',
    'growingpower', 'giftbox', 'jeryalex', 'highvote', 'drewardsresteem', 'bestvote', 'bidbot', 'thehumanbot', 'mecurator', 'okankarol', 'astrobot', 'alphaprime', 'gangvote',
    'buildawhale', 'booster', 'upmyvote', 'promobot', 'postpromoter', 'acidyo', 'reggaemuffin', 'gtg', 'inciter', 'top-exchanges', 'joeparys', 'a-bot', 'tipu', 'oceanwhale',
    'alfanso', 'bue', 'brupvoter', 'cervantes', 'spydo', 'thebot', 'onlyprofitbot', 'newhope', 'jphamer1', 'bid4joy', 'wackou', 'steem-ambassador',
    'emperorofnaps', 'howo', 'delegate.lafona', 'suesa', 'pgarcgo', 'chris4210', 'starkerz', 'fredrikaa', 'sorin.cristescu', 'heiditravels',
    'chorock', 'project7', 'swapsteem', 'kenmelendez', 'gargon', 'llfarms', 'alexs1320', 'zephyraijunzo', 'nateaguila', 'jgcastrillo19', 'arv1',
    'ashtv', 'wartrapa', 'beamentor', 'delabo', 'blewitt', 'smartvote', 'ivet', 's4s', 'firepower', 'ocdb', 'tarazkp', 'booster', 'oracle-d',
    'appreciator', 'rocky1', 'byresteem', 'gangstalking', 'steemcleaners' ];

exports.BLACK_LIST_BOTS = [ ...appsBots, ...serviceBots, ...bitBots, ...otherBots ];
exports.LANGUAGES = [ 'en-US',
    'id-ID',
    'ms-MY',
    'ca-ES',
    'cs-CZ',
    'da-DK',
    'de-DE',
    'et-EE',
    'es-ES',
    'fil-PH',
    'fr-FR',
    'hr-HR',
    'it-IT',
    'hu-HU',
    'nl-HU',
    'no-NO',
    'pl-PL',
    'pt-BR',
    'ro-RO',
    'sl-SI',
    'sv-SE',
    'vi-VN',
    'tr-TR',
    'yo-NG',
    'el-GR',
    'bg-BG',
    'ru-RU',
    'uk-UA',
    'he-IL',
    'ar-SA',
    'ne-NP',
    'hi-IN',
    'as-IN',
    'bn-IN',
    'ta-IN',
    'lo-LA',
    'th-TH',
    'ko-KR',
    'ja-JP',
    'zh-CN',
    'auto'
];
exports.WOBJECT_LATEST_POSTS_COUNT = 30;
exports.COMMENT_REF_TYPES = {
    postWithWobjects: 'post_with_wobj',
    createWobj: 'create_wobj',
    appendWobj: 'append_wobj',
    wobjType: 'wobj_type'
};
exports.MIN_REDIS_REFS_IDLE_TIME_IN_SEC = 2592000;
// exports.WAIVIO_PROXY_BOTS = JSON.parse( process.env.WAIVIO_PROXY_BOTS ) || [ 'asd09' ];
const getProxyBots = () => {
    try {
        return JSON.parse( process.env.WAIVIO_PROXY_BOTS );
    } catch ( e ) {
        return [ 'asd09' ];
    }
};
exports.WAIVIO_PROXY_BOTS = getProxyBots();
