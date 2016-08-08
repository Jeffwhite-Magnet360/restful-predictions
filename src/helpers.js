/**
* @module helpers
* @desc Contains varias frequently used helper methods.
*/

var pg = require('pg')
pg.defaults.ssl = true
pg.defaults.poolSize = 10
/**
* @function query
* @desc Send a query with optional values to the Heroku database.
* @params {string} - query - query formatted as string
* @params values - array of values
* @params callback - callback function to handle query response
* @returns result of query
*/
var query = function query(query, values, callback) {
	q = query
	v = values
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		console.log("query is: " + q + ' with values ' + v)
		var query
		if(v != null) {
			query = client.query(q, v, function(error) {
				if(error) {
					done()
					process.nextTick(callback)
				}
			})
		} else {
			console.log('in else')
			query = client.query(q, function(error) {
				if(error) {
					done()
					process.nextTick(callback)
				} 
			})
		}
		query.on("row", function (row, result) {
			console.log('row is ' + JSON.stringify(row))
			result.addRow(row)
		})
		query.on("end", function (result) {
			process.nextTick(function() {callback(result.rows)})
			done()
		})	
	})
}

module.exports.query = query