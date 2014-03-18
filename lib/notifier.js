var settings = require('../settings.js');

exports.sendNotification = function(app,email,amountPledged,walletAddress,qrcode,tier) {

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