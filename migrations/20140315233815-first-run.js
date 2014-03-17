var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
	db.createTable('pledges', {
		id: { type: 'int', primaryKey: true, autoIncrement: true },
		email: 'string',
		amount: 'real',
		tier: 'int',
		wallet_address: 'string',
		validated: {type:'boolean', defaultValue:false},
		validated_wallet_amount: 'real',
		created_at: 'date'
	}, callback);
};

exports.down = function(db, callback) {
	db.dropTable('pledges', callback);
};