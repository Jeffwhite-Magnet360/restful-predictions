/**
* Pipeline
* @module Pipeline
* @desc The pipeline module is responsible for querying SalesForce for a Sales Pipeline report.
The report is converted into a 2D array, synced with the database, and then passed down to Google Sheets to
be displayed.
*/

function queryPipeline(accessToken, path, callback) {
	var sf = require('node-salesforce')
	var moment = require('moment')
	// Set up the sheet headers
	var pipelineData = [['Stage',
							'Name',
							'Amount',
							'Expected Revenue',
							'Close Date',
							'Probability',
							'Created Date',
							'Account Nama']]

	// Connect to SF
	var conn = new sf.Connection({
	  instanceUrl: "https://" + path,
	  accessToken: accessToken
	})

	// Execute SOQL query to populate allocationData
	conn.query("SELECT StageName, Name, Amount, ExpectedRevenue, CloseDate, Probability, CreatedDate, Account.Name from Opportunity")
  	.on("record", function(record) {
  		var recordData = []
  		// Format the date with Moment library for sheet consistency
    	recordData.push(
    		record.stageName,
			record.name,
			record.amount,
			record.expetedRevenue,
			moment(new Date(record.closeDate)).format("MM/DD/YYYY"),
			record.probability,
			moment(new Date(record.createdDate)).format("MM/DD/YYYY"),
			record.accountName,
		)
    	pipelineData.push(recordData)
		})
	.on("end", function(query) {
		console.log("total in database : " + query.totalSize);
		console.log("total fetched : " + query.totalFetched);
		process.nextTick(function() {callback(pipelineData)})
		})
	.on("error", function(err) {
		console.error(err);
		})
	.run({ autoFetch : true, maxFetch : 4000 });
}

module.exports.queryPipeline = queryPipeline
