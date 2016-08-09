/**
* @module Pipeline
* @desc 
*/

var async = require('async')
var helpers = require('./helpers')
var moment = require('moment')

// Define global indexes dictated by query to SF
var indexes = {
	STAGE: 0,
	OPPORTUNITY_NAME: 1,
	AMOUNT: 2,
	EXP_AMOUNT: 3,
	CLOSE_DATE: 4,
	START_DATE: 5,
	PROBABILITY: 6,
	CREATED_DATE: 7,
	ACCOUNT_NAME: 8
}
/**
* @function updateDatabase
* @desc Update sales_pipeline database with SF.
* @param {string} accessToken - oauth2 access token
* @param {string} path - Salesforce server url
* @param callback - callback function to handle google sheet sync
*/
var updateDatabase = function(accessToken, path, callback) {
	queryPipeline(accessToken, path, function handlePipelineData(pipelineData) {
		var today = moment().format("YYYY-MM-DD")
		var deleteQuery = "DELETE FROM sales_pipeline WHERE protected = FALSE OR start_date < " 
						+ "'" + today + "'"
		helpers.query(deleteQuery, null, function() {
			console.log('in the query cb')
			// For each row in pipelineData, insert accordingly
			console.log('PIPELINEDATA IS ' + pipelineData)
			async.map(pipelineData, insertRows, function insertionCallback() {
				console.log('all rows inserted or err')
				callback()
			})
		})
	})
}

/**
* @function insertRows
* @desc Inserts rows into sales_pipeline for a specific opportunity.
* @param row - 1D array of opportunity data
*/
function insertRows(row, callback) {
	helpers.query(
		"SELECT EXISTS (SELECT opportunity FROM sales_pipeline WHERE opportunity=$1)",
		[row[indexes.OPPORTUNITY_NAME]],
		function(results) {
			// If exists, the opportunity is protected, only update empty fields
			console.log("EXISTS IS " + JSON.stringify(results))
			if(results[0].exists) {
				var updateQuery = "UPDATE sales_pipeline SET stage = $1, amount = $2, "
								+ "expected_revenue = $3, close_date = $4, start_date = $5, "
								+ "probability = $6, created_date = $7, account_name = $8 " 
								+ "WHERE opportunity = $9"

				var values = [
					row[indexes.STAGE], 
					row[indexes.AMOUNT], 
					row[indexes.EXP_AMOUNT],
					row[indexes.CLOSE_DATE], 
					row[indexes.START_DATE], 
					row[indexes.PROBABILITY],
					row[indexes.CREATED_DATE], 
					row[indexes.ACCOUNT_NAME], 
					row[indexes.OPPORTUNITY_NAME]
				]
				helpers.query(updateQuery, values, function() {
					callback(null, null)
				})
			} else {
			// The opportunity needs to be inserted for every role in the default project size
				//the real work here
				console.log('in the else')
				callback(null,null)
			}
		}
	)
}

/**
* @function queryPipeline
* @params {string} accessToken - oauth2 access token
* @params {string} path - salesforce server url
* @params callback - callback function to handle pipeline data
*/
function queryPipeline(accessToken, path, callback) {
	var sf = require('node-salesforce')
	var moment = require('moment')
	// Set up the sheet headers
	var pipelineData = []

	// Connect to SF
	var conn = new sf.Connection({
	instanceUrl: "https://" + path,
	accessToken: accessToken
	})

	// Execute SOQL query to populate allocationData
	conn.query("SELECT StageName, Name, Amount, ExpectedRevenue, CloseDate, Probability, CreatedDate, Account.Name FROM Opportunity WHERE CloseDate>=2016-08-03")
		.on("record", function(record) {
			var recordData = []
			// Format the date with Moment library for sheet consistency
			recordData.push(
			record.StageName,
			record.Name,
			record.Amount,
			record.ExpectedRevenue,
			moment(new Date(record.CloseDate)).format("MM/DD/YYYY"),
			moment(new Date(record.CloseDate)).day(6).format("MM/DD/YYYY"),
			record.Probability,
			moment(new Date(record.CreatedDate)).format("MM/DD/YYYY"),
			record.Account.Name
			)
			pipelineData.push(recordData)
		})
		.on("end", function(query) {
			console.log("total in database : " + query.totalSize);
			console.log("total fetched : " + query.totalFetched);
			process.nextTick(function() {callback(pipelineData)})
		})
		.on("error", function(err) {
			console.log(err);
		})
		.run({ autoFetch : true, maxFetch : 4000 });
}

module.exports.updateDatabase = updateDatabase