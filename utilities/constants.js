const appsBots = ["partico", "dtube", "actifit", "steemhunt", "dragwars"];

const serviceBots = ["steemitboard", "siditech", "booster", "bot-helper", "cheetah", "cleverbot", "discordia", "drdoogie-rb-vote-trail-script", "dr-otto-vote-bidding-bot",
    "freakazoid", "gentlebot", "helpbot", "lovejuice", "minnowsupport", "mrsquiggle", "promoted", "randowhale", "seraph", "steemprice", "steemvoter", "thing-2",
    "treeplanter", "trufflepig", "welcomebot", "morwhale", "remind.bot", "wang", "boxmining", "merej99", "samstonehill", "inertia", "somethingsubtle",
    "stefen", "ropaga", "vmsolutionsltd", "stellabelle", "acidyo", "ethandsmith", "ura-soul", "crokkon", "eturnerx", "greer184"];

const bitBots = ["postpromoter", "buildawhale", "sneaky-ninja", "appreciator", "therising", "jerrybanfield", "boomerang", "upmyvote", "promobot", "minnowvotes",
    "smartsteem", "upmewhale", "inciter", "rocky1", "minnowbooster", "smartmarket", "tipu", "tipu", "bdvoter", "rewards-pool", "treeplanter", "originalworks",
    "drotto", "minnowpond", "byresteem", "siditech", "blissfish", "postdoctor", "hottopic", "steemvote", "thundercurator", "lays", "bumper", "promotedpost",
    "upvotewhale", "steemlike", "followforupvotes", "withsmn", "botcoin", "big-whale", "friends-bot", "morwhale", "earthnation-bot", "coolbot", "tisko",
    "crystalhuman", "resteemable", "microbot", "steemvoter", "upvotebank", "echowhale", "refresh", "flagship", "bidseption", "resteemr", "kiwibot", "bubblebee",
    "cleansingpoetry", "moonbot", "resteembot", "hugewhale", "resteemyou", "schoolofminnows", "zerotoherobot", "superbot", "queqtra", "blockgators", "steemthat",
    "reblogit", "earnmoresteem", "frontrunner", "photocontests", "ottoman", "fresteem", "oceansbot", "red-rose", "otobot", "postresteem", "talhadogan", "danzy",
    "growingpower", "giftbox", "jeryalex", "highvote", "drewardsresteem", "bestvote", "bidbot", "thehumanbot", "mecurator", "okankarol", "astrobot", "alphaprime",
    "gangvote"];

const otherBots = ["voteme", "raise-me-up", "steeming-hot", "steem-ua", "vortac", "steemchoose", "photocircle"];

const BLACK_LIST_BOTS = [...appsBots, ...serviceBots, ...bitBots, ...otherBots];
module.exports = {BLACK_LIST_BOTS}