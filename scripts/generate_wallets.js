
var pg = require('pg');
var content = require('../content.json');
var databaseConfig = require('../database.json');
var dogeAPIUtilities = require('./lib/doge_api_utilities.js');

console.log("STARTING WALLET GENERATOR");

var i = 0;

// Postgres Setup
var postgres_client = new pg.Client(process.env.DATABASE_URL || databaseConfig.dev);
postgres_client.connect(function(err) {

	if(err) {
		console.log('could not connect to postgres', err);
		return;
	}

	// begin recursive wallet generation
	dogeAPIUtilities.generateWallet(postgres_client,true,50);

});