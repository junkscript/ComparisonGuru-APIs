let request = module.parent.request,
    log = module.parent.log,
    fs = module.parent.fs;

module.exports = {
    log: function (message) { // Shorthand logging function
        console.log(`\n${message}`);
    },
    refreshRates: function() {
        request(`https://openexchangerates.org/api/latest.json?app_id=${process.env.API_KEY_OPENEXCHANGERATES}&base=USD`,
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                module.parent.rates = JSON.parse(body).rates;
                fs.writeFile(`./lib/exchange-rates.json`, JSON.stringify(module.parent.rates), function(err) {
                    if (err) {
                        console.log(`Exchange rates update failed: ${err}`);
                    } else {
                        console.log(`Exchange rates updated.`);
                    }
                });
            } else {
                console.log(`OpenExchangeRates api error: ${JSON.stringify(response)}`);
            }
        });
    },
    convertCurrency: function(price, from, to) {
        let convertedPrice = (price / module.parent.rates[from]) * module.parent.rates[to];
        return convertedPrice;
    },
    optimizeResults: function(products) {
        if (!products || products.length == 0) return products;
        let possibleIndexes = [];
        for (let i = 0; i < products.length - 1; i++) {
            let jump = (products[i+1].salePrice || products[i+1].price) - 
                        (products[i].salePrice || products[i].price);
            let percent;
            if ((percent = (jump * 100 / (products[i].salePrice || products[i].price))) > 200) {
                possibleIndexes.push({index: i + 1, percent: percent});
            }
        }
        if (possibleIndexes.length > 0) {
            let max = possibleIndexes.reduce(function(prev, current) {
                return (prev.percent > current.percent) ? prev : current;
            });
            if ((max.index * 100 / (products.length - max.index)) > 500) {
                products = products.slice(0, max.index - 1);
            } else {
                products = products.slice(max.index, products.length);
            }
        }
        return products;
    }
}
