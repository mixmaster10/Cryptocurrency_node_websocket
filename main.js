
'use strict';

console.log('Starting app...');

const request = require('request'), Promise = require("bluebird"); //request for pulling JSON from api. Bluebird for Promises.

const express = require('express'),
    app = express(),
    helmet = require('helmet'),
    http = require('http').Server(app),
    io = require('socket.io')(http); // For websocket server functionality

app.use(helmet.hidePoweredBy({setTo: 'PHP/5.4.0'}));

const port = process.env.PORT || 80;

app.use(express.static(__dirname + '/docs'));

http.listen(port, function () {
    console.log('listening on', port);
});


require('./settings.js')(); //Includes settings file.
// let db = require('./db.js'); //Includes db.js


let coinNames = [];
io.on('connection', function (socket) {
    //socket.emit('coinsAndMarkets', [marketNames, coinNames]);
    socket.emit('results', results);
});

// coin_prices is an object with data on price differences between markets. = {BTC : {market1 : 2000, market2: 4000, p : 2}, } (P for percentage difference)
// results is a 2D array with coin name and percentage difference, sorted from low to high.
let coin_prices = {}, numberOfRequests = 0, results = []; // GLOBAL variables to get pushed to browser.

function getMarketData(options, coin_prices, callback) {   //GET JSON DATA
    return new Promise(function (resolve, reject) {
        request(options.URL, function (error, response, body) {
            try {
                let data = JSON.parse(body);
                console.log("Success", options.marketName);
                if (options.marketName) {

                    let newCoinPrices = options.last(data, coin_prices, options.toBTCURL);
                    numberOfRequests++;
                    if (numberOfRequests >= 1) computePrices(coin_prices);
                    resolve(newCoinPrices);

                }
                else {
                    resolve(data);
                }

            } catch (error) {
                console.log("Error getting JSON response from", options.URL, error); //Throws error
                reject(error);
            }

        });


    });
}


// Emite el Socket
async function computePrices(data) {
	// DATA es el objeto con todo el RAW de mercados y pares
	
    // Nuevo Obj que contendrá los mercados que comparten PAR
	results = {};

	// Loop que lee el objeto RAW data y cargará results{} con solo los mercados que comparten PAR
	for (let coin in data){
		// Si el tamaño del objeto.coin > 1
		if (Object.keys(data[coin]).length>1) { 
		// Añado el mercado al objeto
		results[coin] = data[coin];		
		}
	}
	// Ya tenemos el Objeto filtrado y limpio
	
	
	// Lo volvemos a recorrer y calculamos posibles arbitrajes
	for (let coin in results){
	// Añadimos los calculos al objeto	
	results[coin].status = {BuyIn : "", SellIn :"", Profit : 0};
	}		
	

//console.log(Object.values(results));
	
	//console.log(Object.keys(results));

	
	///////////////////////////////////////////
    console.log("Emitting Results...")
    io.emit('results', results);

}


(async function main() {
    let arrayOfRequests = [];

    for (let i = 0; i < markets.length; i++) {
        arrayOfRequests.push(getMarketData(markets[i], coin_prices));
    }

    await Promise.all(arrayOfRequests.map(p => p.catch(e => e)))

        .then(results => computePrices(coin_prices))

        .catch(e => console.log(e));

    setTimeout(main, 5000);
})();
