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
	if (opportunityData == undefined) {
		process.nextTick(function(){ callback(new Error('xlsx was invalid')) })
	}
	helpers.opportunityCheck(opportunityData.opportunityName, function(exists) {
		if(exists) {
			helpers.deleteOpportunities([opportunityData.opportunityName], function(error) {
				if (error) { throw error }
				updateOpportunityFromXlsx(opportunityData, function(error) {
					if (error) { throw error }
					process.nextTick(callback)
				})
			})
		} else {
			updateOpportunityFromXlsx(opportunityData, function(error) {
				if (error) { throw error }
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
	var startDate = opportunityData.startDate
	async.eachOfSeries(sheetData, function(role, roleKey, callback) {
		async.eachSeries(role, function(weekOffset, callback){
			helpers.query(
				"INSERT INTO sales_pipeline(opportunity, start_date, role, offset_allocation, attachment, project_size) values($1, $2, $3, $4, $5, $6)",
				[opportunityName, startDate, roleKey, weekOffset, true, null],
				function(error) { 
					if (error) { throw error }
					process.nextTick(callback)
				})
		}, function(error){
			if (error) { throw error }
			process.nextTick(callback)
		})
	}, function(error) { 
		if (error) { throw errror}
		process.nextTick(function(){ callback(null)})
	})
}
//*************************************






