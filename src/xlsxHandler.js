//*************************************
/**
* @module xlsx
* @desc Handles forecasted opportunity data from xlsx parser.
*/
//*************************************
var helpers = require('./helpers')
var async     = require('async')
//*************************************
/**
* @function updateDatabaseFromXlsx
* @desc Update the opportunity stored in Heroku database.
* @param opportunityData - JSON format object of opportunity name and xlsx data
* @param callback - callback to handle status
*/
var updateDatabaseFromXlsx = function(opportunityData, callback) {
	helpers.opportunityCheck(opportunityData.opportunityName, function callback(exists) {
		if(exists) {
			helpers.deleteOpportunities([opportunityData.opportunityName], function callback() {
				updateOpportunityFromXlsx(opportunityData, function() {
					process.nextTick(callback)
				})
			})
		} else {
			updateOpportunityFromXlsx(opportunityData, function() {
				process.nextTick(callback)
			})
		}
	})
}

module.exports.updateDatabaseFromXlsx = updateDatabaseFromXlsx
//*************************************

/**
* @function updateOpportunityFromXlsx
* @desc Updates sales_pipeline database with opportunity xlsx data.
* @param opportunityData - JSON format object of xlsx data and opportunity name
* @param callback - callback function to handle status
*/
function updateOpportunityFromXlsx(opportunityData, callback) {
	var sheetData = opportunityData.sheetData
	var opportunityName = opportunityData.opportunityName
	async.eachOfSeries(sheetData, function insertRole(role, roleKey, callback) {
		//for(var number in role) {
		async.eachSeries(role, function(weekAllocations, callback){
			helpers.query(
				"INSERT INTO sales_pipeline(opportunity, role, week_allocations, protected) values($1, $2, $3, $4)",
				[opportunityName, roleKey, weekAllocations, true],
				function() { process.nextTick(callback) }
			)
		}, function(){ process.nextTick(callback) })
	}, function() { 
		process.nextTick(function(){ callback(null)})
	})
}
//*************************************






