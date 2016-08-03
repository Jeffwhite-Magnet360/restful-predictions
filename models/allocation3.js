/**
* Allocation
* @module Allocation
* @desc The allocation module is responsible for querying SalesForce for a Allocation report.
The allocation data is organized into a 2D array and passed down to Google Sheets.
Role, week date, name, contact id, project, allocated hrs /role/week, and allocated hrs /role are grabbed.
*/
module.exports = Allocation3

// module level variables
var async = require('async')
var sf = require('node-salesforce');
var allocationData = []

function Allocation3(instance, accessToken) {
	this.accessToken = accessToken
	this.path = 'https://' + instance + '/services/data/v35.0/analytics/reports/00Oa00000093vVN'
} 

/**
* Queries SalesForce for allocation report, determines all roles in the report, and passes a list of
roles to the getRoleData method. getRoleData is executed asyncronously on every role.
* @function getReportData
* @param oauth2 - oauth2 instance
* @param cache - node-cache instance
* @param callback - callback function to return final array
*/
Allocation2.prototype.getReportData = function(accessToken, path, callback) {
	var conn = new sf.Connection({
	  instanceUrl: path,
	  accessToken: accessToken
	})

	conn.query("SELECT Resource.ContactID_18__c, Resource.Name, Project.Name, Resource.pse__Resource_Role__c, pse__Estimated_Hours__c, pse__Start_Date__c FROM pse__Est_Vs_Actuals__c")
  	.on("record", function(record) {
    	allocationData.push(record);
		})
	.on("end", function(query) {
		console.log(allocationData)
		console.log("total in database : " + query.totalSize);
		console.log("total fetched : " + query.totalFetched);
		process.nextTick(function() {callback(null, allocationData)})
		})
	.on("error", function(err) {
		console.error(err);
		})
	.run({ autoFetch : true, maxFetch : 4000 });
}














