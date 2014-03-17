var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {

	db.createTable('pledges', {
		id: { type: 'int', primaryKey: true, autoIncrement: true },
		email: 'string',
		amount: 'real',
		tier: 'int',
		tier_description: 'string',
		wallet_address: 'string',
		validated: {type:'boolean', defaultValue:false},
		validated_wallet_amount: 'real',
		created_at: 'datetime'
	}, createWallets);

	function createWallets(err) {
		
		if (err) { callback(err); return; }

		db.createTable('wallets', {
			id: { type: 'int', primaryKey: true, autoIncrement: true },
			label: 'string',
			wallet_address: 'string',
			claimed: {type:'boolean', defaultValue:false},
			pledge_id: 'int',
			updated_at: 'datetime',
			created_at: 'datetime'
		}, callback);
	}

};

exports.down = function(db, callback) {
	
	db.dropTable('pledges', dropWallets);

	function dropWallets(err) {
		if (err) { callback(err); return; }
		db.dropTable('wallets', callback);
	}
	
};