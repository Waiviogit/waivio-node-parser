const {faker, getRandomString} = require('../../testHelper');
const {PostFactory} = require('../../factories');

const getMocks = async () => {
        const forecastData = {
            wia: {
                quoteSecurity: "Bitcoin",
                market: "Crypto",
                recommend: "Buy",
                postPrice: 4069,
                expiredAt: "2019-03-22T14:09:28.000Z",
                slPrice: 4068,
                createdAt: "2019-03-21T14:09:28.000Z",
                tpPrice: null
            }
        };

        const expForecastData = {
            "action": "forecastExpired",
            "exp_forecast": {
                "profitability": -3036,
                "bars": [
                    {
                        "closeAsk": 3893970000,
                        "closeBid": 3792910000,
                        "highAsk": 3905910000,
                        "highBid": 3800660000,
                        "lowAsk": 3890490000,
                        "lowBid": 3785400000,
                        "openAsk": 3892350000,
                        "openBid": 3787350000,
                        "time": 1552564800000
                    }, {
                        "closeAsk": 3906000000,
                        "closeBid": 3801290000,
                        "highAsk": 3957900000,
                        "highBid": 3849270000,
                        "lowAsk": 3830650000,
                        "lowBid": 3722540000,
                        "openAsk": 3893140000,
                        "openBid": 3792180000,
                        "time": 1552579200000
                    }],
                "rate": {
                    "quote": {
                        "security": "Bitcoin",
                        "bidPrice": "3934.72",
                        "askPrice": "4039.35",
                        "expiredByTime": true,
                        "timeScale": "Hour4"
                    },
                    "cross_rate": null
                },
                "id": "suy38\/5zyz3z-forecast",
                "expiredAt": "2019-03-22T14:12:47Z"
            }
        };

        const existingPost = await PostFactory.Create({additionsForMetadata: forecastData});
        const newPost = await PostFactory.Create({additionsForMetadata: forecastData, onlyData: true});
        return {
            existingPost, newPost, forecastData, expForecastData
        }

    }
;

module.exports = {getMocks}