
var content = require('../content.json');
var DogeAPI = require('dogeapi');

var dogeAPI = new DogeAPI({
						apikey: content.settings.doge_api_key || settings.doge_api_key,
						endpoint: 'https://dogeapi.com/'
					});

exports.grabWallet = function(postgresClient,onComplete) {

	console.log("Grabbing wallet from DB");

	postgresClient.query('SELECT * FROM wallets WHERE claimed = false LIMIT 1',function(error, result) {
		if(error) {
			console.log(error);
			onComplete(error);
		} else {
			if (result.rows.length > 0) {
				onComplete(error,result.rows[0]);
			} else {
				console.log("no wallet found...");
				exports.generateWallet(postgresClient,false,1,onComplete);
			}
		}
	});
}

exports.generateWallet = function(postgresClient,closeConnection,walletCount,onComplete) {

	console.log("DogeAPI - generating wallet");

	if (!onComplete) {

		if (walletCount<=0) {
			if (closeConnection)
				postgresClient.end();
			return;
		}

		walletCount--;
	}

	var walletLabel = null;

	dogeAPI.getNewAddress(walletLabel, function (error, response) {

		if(error) {

			console.log(error);

		} else {

			console.log("DogeAPI address created: ", response);
			var address = JSON.parse(response)["data"]["address"];

			postgresClient.query('INSERT INTO wallets(label,wallet_address,created_at) VALUES($1,$2,$3) RETURNING id', [walletLabel,address,new Date()],function(err, result) {

				var id = null;

			    if(err) {
			    	console.error('error running query', err);
			    } else {
			    	id = result.rows[0]["id"];
					console.log("Saved Wallet("+id+") to Database");
			    }

				if (onComplete)
					onComplete(error,{id:id,label:walletLabel,wallet_address:address});
				else
					exports.generateWallet(postgresClient,closeConnection,walletCount,onComplete);
			
			});
		}

	});
}