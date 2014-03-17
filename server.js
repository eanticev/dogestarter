
// libraries
var pg = require('pg');
var express = require("express");
var logfmt = require("logfmt");
var sass = require('node-sass');
var path = require('path');
var DogeAPI = require('dogeapi');
var dogeAPIUtilities = require('./lib/doge_api_utilities.js');
var settings = require('./settings.js')
var mandrill = require('mandrill-api/mandrill');
var qrcode=require('qrcode-js');
var cache = require('memory-cache');
var content = require('./content.json');

var dogeAPI = new DogeAPI({
							apikey: settings.dogeApiKey,
							endpoint: 'https://dogeapi.com/'
						});

// Express Setup
var app = express();
app.use(logfmt.requestLogger());
app.use(express.bodyParser({ keepExtensions: true, uploadDir: '/tmp' }));
app.set('view engine', 'ejs');
app.use(sass.middleware({
      src: 	path.join(__dirname, 'public')
    , dest: path.join(__dirname, 'public')
    , debug: true
    , force: true
    , outputStyle: 'compressed'
 }));
app.use(express.static('public'))
// app.set('views',__dirname + '/templates');


// Basic AUTH middleware -  Asynchronous
var auth = express.basicAuth(function(user, pass, callback) {
 var result = (user === settings.httpAuth.username && pass === settings.httpAuth.password);
 callback(null /* error */, result);
});


// Postgres Setup
var postgres_client = new pg.Client(process.env.DATABASE_URL || "postgres://localhost:5432/duelyst_dogecoin");
postgres_client.connect(function(err) {
  if(err) {
    return console.error('could not connect to postgres', err);
  }
  postgres_client.query('SELECT NOW() AS "theTime"', function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }
    console.log("POSTGRES Connected. Server Time: ",result.rows[0].theTime);
  });
});

// Mandrill Setup
var mandrill_client = new mandrill.Mandrill(settings.notifications.mandrillApiKey);

app.get('/', function(req, res) {


	var onComplete = function(data) {
		res.render("start", data);
	};

	var renderData = cache.get('start');

	if (renderData) {
		
		console.log("rendering START from CACHE");
		onComplete(renderData);

	} else {

		console.log("rendering START from DB");

		postgres_client.query('SELECT COUNT(*) as pledge_count FROM pledges',function(error, pledge_count_result) {
			if(error) {
				console.log(error);
				res.json(500, { code:1, error: 'unable to retrieve pledge info' });
			} else {

				postgres_client.query('SELECT COUNT(id) as backer_count, tier FROM pledges GROUP BY tier',function(error, backer_counts_result) {

					var days_remaining = Math.ceil(((settings.campaign.startDate + settings.campaign.durationDayCount*24*60*60*1000) - new Date()) / (1000*60*60*24));
					if (days_remaining < 0)
						days_remaining = 0;

					renderData = {
						content: content,
						backer_counts_rows: backer_counts_result.rows,
						pledge_count: pledge_count_result.rows[0].pledge_count,
						start_date: settings.startDate,
						days_remaining: days_remaining,
						goal: settings.campaign.goal.formatMoney(0,'.',',')
					};

					cache.put('start',renderData,30*1000); // 30 second cache
					onComplete(renderData);

				});
			}
		});

	}
});

app.get('/embed', function(req, res) {
	

	var onComplete = function(data) {
		res.render("embed", data);
	};

	var renderData = cache.get('embed');

	if (renderData) {
		
		console.log("rendering EMBED from CACHE");
		onComplete(renderData);

	} else {

		console.log("rendering EMBED from DB");

		postgres_client.query('SELECT COUNT(*) as pledge_count FROM pledges',function(error, pledge_count_result) {
			if(error) {
				console.log(error);
				res.json(500, { code:1, error: 'unable to retrieve pledge info' });
			} else {

				postgres_client.query('SELECT SUM(amount) as amount FROM pledges',function(error, result) {

					var days_remaining = Math.ceil(((settings.campaign.startDate + settings.campaign.durationDayCount*24*60*60*1000) - new Date()) / (1000*60*60*24));
					if (days_remaining < 0)
						days_remaining = 0;

					renderData = { 
						content: content,
						total_pledged:result.rows[0]["amount"] || 0,
						start_date: settings.startDate,
						days_remaining: days_remaining,
						goal: settings.campaign.goal
					};

					cache.put('embed',renderData,60*1000); // 60 second cache
					onComplete(renderData);
				});
			}
		});
	}

});

app.get('/balance', function(req, res) {

	var onComplete = function(data) {
		res.json(data);
	};

	var renderData = cache.get('balance');

	if (renderData) {
		
		console.log("rendering BALANCE from CACHE");
		onComplete(renderData);

	} else {

		console.log("rendering BALANCE from DogeAPI");

		dogeAPI.getBalance(function (error, response) {
			if(error) {
				console.log(error);
				res.json(500, { code:1, error: 'unable to retrieve balance from DogeAPI' });
			} else {
				renderData = JSON.parse(response)["data"];
				cache.put('balance',renderData,10*1000); // 10 second cache
				onComplete(renderData);
			}
		});
	}

});

app.get('/amount', function(req, res) {

	var onComplete = function(data) {
		res.json(data);
	};

	var renderData = cache.get('amount');

	if (renderData) {
		
		console.log("rendering AMOUNT from CACHE");
		onComplete(renderData);

	} else {

		console.log("rendering AMOUNT from DB");

		postgres_client.query('SELECT SUM(amount) as amount FROM pledges',function(error, result) {

			if(error) {
				console.log(error);
				res.json(500, { code:1, error: 'unable to retrieve balance from DB' });
			} else {

				renderData = {balance:result.rows[0]["amount"]};
				cache.put('amount',renderData,30*1000); // 30 second cache
				onComplete(renderData);
			}
					
		});
	}

});

app.get('/price', function(req, res) {

	dogeAPI.getCurrentPrice(function (error, response) {
		if(error) {
			console.log(error);
			res.json(500, { code:1, error: 'unable to retrieve balance from DogeAPI' });
		} else {
			res.json(JSON.parse(response)["data"]);
		}
	});

});

app.get('/pledges', auth, function(req, res) {

	postgres_client.query('SELECT * FROM pledges LIMIT 5000',function(error, result) {
			if(error) {
				console.log(error);
				res.json(500, { code:1, error: 'unable to retrieve pledge info' });
			} else {
				res.render("pledges",{ rows: result.rows });
			}
	});

});


// curl -X POST http://localhost:5000/pledge -d email=test@test.com
app.post('/pledge', function(req, res) {
	// Get a new address created
	if (req.param("email")) {

		var email_base64 = new Buffer(req.param("email")).toString('base64');
		console.log("Creating DogeAPI address for customer: ", req.param("email"));


		dogeAPIUtilities.grabWallet(postgres_client, function (error, response) {

			if(error) {
				console.log(error);
				res.json(500, { code:1, error: 'unable to retrieve new address from DogeAPI' });

			} else {

				console.log("Found wallet: ", response);
				var wallet_id = response["id"]
				var address = response["wallet_address"];
				var base64qrcode = qrcode.toDataURL(address, 4);
				postgres_client.query('WITH returned_pledge AS (INSERT INTO pledges(email,wallet_address,amount,tier,created_at) VALUES($1,$2,$3,$4,$5) RETURNING id,email) UPDATE wallets SET updated_at=$5, claimed=true, pledge_id=(SELECT id FROM returned_pledge) WHERE id=$6 RETURNING (SELECT id FROM returned_pledge);', [req.param("email"),address,req.param("amount"),req.param("tier"),new Date(),wallet_id],function(err, result) {
				    if(err) {

				    	console.error('error running query', err);
				    } else {

						console.log("Saved to Database");
						sendNotificationEmail(req.param("email"),req.param("amount"),address,base64qrcode);
				    }
				});
				res.json({ email:req.param("email"), address: address, qrcode: base64qrcode });
			}

		});


	} else {
		res.json(500, { code:0, error: 'invalid email' });
	}
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

/******/
function sendNotificationEmail(email,amountPledged,walletAddress,qrcode,tier) {
	if (settings.notifications.mandrillApiKey) {
		app.render('notification', {amount:amountPledged, qrcode:qrcode, walletAddress:walletAddress}, function(err, html){
			console.log(html);
			var message = {
			    "html": html,
			    /* "text": "Example text content", */
			    "subject": settings.notifications.subject,
			    "from_email": settings.notifications.fromEmail,
			    "from_name": settings.notifications.fromName,
			    "to": [{
			            "email": email,
			            "type": "to"
			        }],
			    "important": false,
			    "track_opens": null,
			    "track_clicks": null,
			    "auto_text": null,
			    "auto_html": null,
			    "inline_css": null,
			    "url_strip_qs": null,
			    "preserve_recipients": null,
			    "view_content_link": null,
			    "tracking_domain": null,
			    "signing_domain": null,
			    "return_path_domain": null,
			    "merge": true,
			    "global_merge_vars": [{
			            "name": "amountPledged",
			            "content": amountPledged
			        }],
			    "merge_vars": [{
			            "rcpt": "recipient.email@example.com",
			            "vars": [{
			                    "name": "merge2",
			                    "content": "merge2 content"
			                }]
			        }],
			    "tags": [
			        "password-resets"
			    ]
			};
			mandrill_client.messages.send({"message": message, "async": true, "ip_pool": "Main Pool"}, function(result) {
			    console.log(result);
			    /*
			    [{
			            "email": "recipient.email@example.com",
			            "status": "sent",
			            "reject_reason": "hard-bounce",
			            "_id": "abc123abc123abc123abc123abc123"
			        }]
			    */
			}, function(e) {
			    // Mandrill returns the error as an object with name and message keys
			    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
			    // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
			});
		});
	} else {
		console.log("Not sending notification because MANDRILL is not configured");
	}
}

/******/
/// Covenience Methods

Number.prototype.formatMoney = function(c, d, t){
var n = this, 
    c = isNaN(c = Math.abs(c)) ? 2 : c, 
    d = d == undefined ? "." : d, 
    t = t == undefined ? "," : t, 
    s = n < 0 ? "-" : "", 
    i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
    j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
 };