DOGESTARTER
===========

DOGESTARTER is a Node.JS app for crowdfunding your project using the crypto-currency [Dogecoin](http://dogecoin.com).

Preview and support us us on [DOGESTARTER.co](http://www.dogestarter.co).

Also check out a [LIVE PROJECT](http://duelyst.dogestarter.co) here from the [DUELYST](http://kck.st/NLR937) team.

Getting Started
---------------

After cloning DOGESTARTER from github, install all of the required libraries by running:

```
npm install
```

From here you will need to set up the database, notifications, dogecoin api, and your content by modifying the following 3 setup files: `database.json`, `settings.js`, and `content.json`.

### Step 1: Database Setup

DOGESTARTER uses a Postgres SQL database as a back-end. We recommend using [PostgressApp](http://postgresapp.com/) for local development.

After setting up a local database, edit the `database.json` file and provide your dev and or production DB urls:

```
{
	"dev": "postgres://..."
	"prod": "postgres://...",
}
```

The `database.json` file is used by the migration tool that generates the schema.

Once you've set up a database, execute the database migrations (based on the **db-migrate** library) by running:

```
db-migrate
```

This will create two tables: *pledges* and *wallets*.

**HEROKU note:** If you are using Heroku, you should not need to provide a prod database url in `database.json` at all. I believe the **db-migrate** library will automatically pick it up.

### Step 2: DogeAPI setup

You will also need a **DogeAPI** account, which is a wallet service. [Sign up for DogeAPI](https://www.dogeapi.com)
Once you have a DogeAPI API Key, enter it into `content.json`:

```
{
	"settings": {
		...
		"doge_api_key": "<key>"
		...
	}
}
```

Content and Settings
--------------------

In addition to the basic setup, you can enable email notifications, set up custo content (DUH), and run validation and wallet generation scripts.

### Campaign Setup

You can set your campaign parameters by modifying the the `content.json` file:

```
{
	"project": {
		"start_date": "March 14, 2014",
		"duration_days": 30,
		"campaign_goal": 100000,
	},
	"tiers": [
		{
			"name":"Supporter Shibe",
			"amount": 250,
			"backer_limit": 1000,
			"description": "Such tier. Much reward. Wow! Support now plz. So amaze.",
			"fine_print":"Estimated delivery: Dec 2014"
		},
		{
			"name":"Honored Doge",
			"amount": 500,
			"backer_limit": 500,
			"description": "Such tier. Much reward. Wow! Support now plz. So amaze.",
			"fine_print":"Estimated delivery: Dec 2014"
		}
	]
}
```

### Email Notifications Setup

If you wan to enable email notifications, you will need a **Mandrill** account, which is an email delivery service from Mailchimp. [Sign up for Mandrill](https://mandrillapp.com/)

Once you have a Madrill API Key, enter it into `content.json` along with other notification setup params:

```
{
	"settings": {
		"notifications": {
			"mandrill_api_key":"<key>",
			"from_email": "info@dogestarter.co",
			"from_name": "DOGESTARTER",
			"subject": "Thank you for your DOGECOIN Pledge"
		}
	}
}
```

You can modify the notification email template HTML in `./views/notification.ejs`.

### DISQUS Comments

Comments are powered by [DISQUS](//disqus.com). In order to activate comments for your campaign, you will need to [register for DISQUS](//disqus.com), then edit `content.json` to include your DISQUS shortname here:

```
{
	"settings": {
		"disqus_shortname": "<your shortname>"
	}
}
```

### Scripts and Validation

#### Pre-generate wallets

Because DogeAPI might not be super reliable as a "live" service, you may want to pre-generate your wallet addresses by running:

```
node ./scripts/generate_wallets.js
```

Each time you run this script, you will generate 50 wallet addresses and store them to your local database for use with pledges later. Doing so will greatly increase performance.

#### Validation

To validate backer pledges you can run the task:

```
node ./scripts/validator.js
```

This script will grab all of the not yet checked pledges, and using DogeAPI validate that your wallets have received the pledge amount that backer claims to have sent.


Administration
--------------

You can enable and review the list of all pledges so far on the `\pledges` URL. This URL has to be enabled and is secured by basic auth configured in `settings.js`

```javascript
var settings = {

	admin_pages_enabled: false,
	http_auth: {
		username:"doge",
		password:"suchwow"
	}
}

module.exports = settings;
```


Copyright (c) 2013 Emil Anticevic, released under the MIT license
