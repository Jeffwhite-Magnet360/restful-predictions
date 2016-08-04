var moment 	= require('moment'),
	async 	= require('async'),
	pg 		= require('pg'),
	config 	= {
  				user: 'xbpryclwbfnfai',
  				database: 'dfsg9e1bp9k04n',
  				password: 'ukM2hdXDV3wMx6J0_2ue3yj1fJ',
  				port: 5432, 
  				max: 10,
  				idleTimeoutMillis: 30000,
	}

var pool = new pg.Pool(config);

pg.defaults.ssl = true

function getDefaultProjectSizes(callback){
	pool.connect(function(err, client, done) {
  		if(err) {
    		return console.error('error fetching client from pool', err);
  		}
		var defaultProjectSizes,
			defaultProjectSizesQuery = client.query("SELECT sizeid, pricehigh, roles_allocations, numweeks FROM project_size ORDER BY pricehigh ASC")
		defaultProjectSizesQuery.on("row", function (row, result) {
			result.addRow(row)
		})
		defaultProjectSizesQuery.on("end", function (result) {
			defaultProjectSizes = {}
			//for (var entry in result.rows){
			async.each(result.rows, function(row, callback){
				defaultProjectSizes[row.sizeid] = {
					"priceHigh": 			row.pricehigh,
					"roles_allocations": 	row.roles_allocations,
					"numWeeks": 			row.numweeks
				}
				process.nextTick(callback)
			}, function(){
				done();
				process.nextTick(function(){callback(null, defaultProjectSizes)})
			})
		})
	})
}

function getOmittedOpportunities(callback){
	pool.connect(function(err, client, done) {
  		if(err) {
    		return console.error('error fetching client from pool', err);
  		}
		var omittedOpportunities,
			omittedOpportunitiesQuery = client.query("SELECT * from omit")
		omittedOpportunitiesQuery.on("row", function (row, result) {
			result.addRow(row)
		})
		omittedOpportunitiesQuery.on("end", function (result) {
			omittedOpportunities = {}
			//for (var entry in result.rows){
			async.each(result.rows, function(row, callback){
				omittedOpportunities[row.opportunity] = {}
				process.nextTick(callback)
			}, function(){
				done();
				process.nextTick(function(){callback(null, omittedOpportunities)})
			})
		})
	})
}

function getAddedOpportunities(callback){
	pool.connect(function(err, client, done) {
  		if(err) {
    		return console.error('error fetching client from pool', err);
  		}
		var addedOpportunities,
			addedOpportunitiesQuery = client.query("SELECT * from sales_pipeline")
		addedOpportunitiesQuery.on("row", function (row, result) {
			result.addRow(row)
		})
		addedOpportunitiesQuery.on("end", function (result) {
			addedOpportunities = {}
			//for (var entry in result.rows){
			async.each(result.rows, function(row, callback){
				addedOpportunities[row.opportunity] = {
					"STAGE": row.stage,
					"AMOUNT": row.amount,
					"EXPECTED_AMOUNT": row.expected_amount,
					"CLOSE_DATE": row.close_date,
					"START_DATE": row.start_date,
					"PROBABILITY": row.probability,
					"AGE": row.age,
					"CREATED_DATE": row.create_date,
					"ACCOUNT_NAME": row.account_name,
					"PROJECT_SIZE": row.project_size
				}
				process.nextTick(callback)
			}, function(){
				done();
				process.nextTick(function(){callback(null, addedOpportunities)})
			})
		})
	})
}


module.exports.getAddedOpportunities 	= getAddedOpportunities
module.exports.getOmittedOpportunities 	= getOmittedOpportunities
module.exports.getDefaultProjectSizes 	= getDefaultProjectSizes