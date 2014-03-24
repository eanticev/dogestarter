
var pg = require('pg');
var DogeAPI = require('dogeapi');
var content = require('../content.json');
var databaseConfig = require('../database.json');

var dogeAPI = new DogeAPI({
							apikey: content.settings.doge_api_key,
							endpoint: 'https://dogeapi.com/'
						});

console.log("STARTING VALIDATOR");

// Postgres Setup
var postgres_client = new pg.Client(process.env.DATABASE_URL || databaseConfig.dev);
postgres_client.connect(function(err) {

	if(err) {
		console.log('could not connect to postgres', err);
		return;
	}

	console.log("grabbing pledges to validate from DB");

	postgres_client.query('SELECT * FROM pledges WHERE validated = false LIMIT 500',function(error, result) {
		if(error) {
			console.log(error);
		} else {
			for (var i=0; i<result.rows.length; i++) {
				var address = result.rows[i]["wallet_address"];
				var id = result.rows[i]["id"];
				// console.log("validating ("+address+")");
				dogeAPI.getAddressReceived(address, null, function (error, response) {
					if (error) {
						console.log("Error validating wallet ("+address+"): "+error);
					} else {
						var amount_received = JSON.parse(response)["data"]["received"];
						console.log("validated amount for address ("+address+") = "+amount_received);
						if (amount_received) {
							postgres_client.query('UPDATE pledges SET validated_wallet_amount=$1,validated=true WHERE id=$2', [amount_received,id],function(err, result) {});
						}
					}
				});
			}
		}

		postgres_client.end();
	});

});