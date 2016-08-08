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
					callback(error)
				} else {
					query.on("row", function (row, result) {
					console.log('row is ' + JSON.stringify(row))
					result.addRow(row)
					})
					query.on("end", function (result) {
					done()
					console.log('results.rows is ' + JSON.stringify(result.rows) + " coutn is " + result.rowCount)
					callback(result.rows)
					})	
				}
			})
		} else {
			console.log('in else')
			query = client.query(q, function(error) {
				if(error) {
					done()
					callback(error)
				} else {
					query.on("row", function (row, result) {
					console.log('row is ' + JSON.stringify(row))
					result.addRow(row)
					})
					query.on("end", function (result) {
					done()
					console.log('results.rows is ' + JSON.stringify(result.rows) + " coutn is " + result.rowCount)
					callback(result.rows)
					})	
				} 
			})
		}
		
	})
}

module.exports.query = query