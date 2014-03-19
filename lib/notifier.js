var settings = require('../settings.js');
var content = require('../content.json');
var mandrill = require('mandrill-api/mandrill');

exports.sendNotification = function(app,email,amountPledged,walletAddress,qrcode,tier) {

	var mandrill_key = (content.settings.notifications.mandrill_api_key || settings.notifications.mandrill_api_key);
	var subject = (content.settings.notifications.subject || settings.notifications.subject);
	var from_name = (content.settings.notifications.from_name || settings.notifications.from_name);
	var from_email = (content.settings.notifications.from_email || settings.notifications.from_email);

	if (mandrill_key) {

		// Mandrill Setup
		var mandrill_client = new mandrill.Mandrill(mandrill_key);

		app.render('notification', {amount:amountPledged, qrcode:qrcode, walletAddress:walletAddress}, function(err, html){
			
			// console.log(html);
			
			var message = {
			    "html": html,
			    /* "text": "Example text content", */
			    "subject": subject,
			    "from_email": from_email,
			    "from_name": from_name,
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
			        /*
			    "merge_vars": [{
			            "rcpt": "recipient.email@example.com",
			            "vars": [{
			                    "name": "merge2",
			                    "content": "merge2 content"
			                }]
			        }],
			        */
			    "tags": [
			        "pledges"
			    ],
		        "images": [
		            {
		                "type": "image/gif",
		                "name": "QRCODE",
		                "content": qrcode.replace("data:image/gif;base64,","")
		            }
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