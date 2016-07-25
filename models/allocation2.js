module.exports = Allocation2
var async = require('async')
var factMap, groupingsDown, allocationData

function Allocation2(instance, accessToken) {
	this.accessToken = accessToken
	this.path = 'https://' + instance + '/services/data/v35.0/analytics/reports/00Oa00000093vVN'
} 

Allocation2.prototype.getReport = function(oauth2, async, cache, callback) {
	var instance = this
	var parameters = {
		access_token: instance.accessToken
	}
	oauth2.api('GET', instance.path, parameters, function (err, data) {
		if(err) {
			console.log('OAuth2.api GET Error: ', JSON.stringify(err)) 
		} else {
			groupingsDown = data.groupingsDown
			factMap = data.factMap

			// Populate role list
			var roleList = {}
			for(var role in groupingsDown.groupings) {
				var currentRole = groupingsDown.groupings[role]
				roleList[currentRole.key] = currentRole.label
			}
			//mapValues getRoleData
			async.mapValues(roleList, getRoleData, function(err, results) {
				console.log(results)
			})
		}
	})
	//callback(allocationData)
}

//concat each ret 
function getRoleData(role, roleKey) {
	// Role is in form {key: label} E.G {2: Developer}
	var roleDateData = []

	for(var date in groupingsDown.groupings[roleKey].groupings) {
		// temp array to hold data for unique role/date combination
		var temp = []
		// get date information and define keys for remaining data
		var currentDateKey = groupingsDown.groupings[roleKey].groupings[date].key, 
			currentDate    = groupingsDown.groupings[roleKey].groupings[date].label,
			datecellsKey,
			aggregatesKey
		
		datacellsKey   = currentDateKey + '!T'
		aggregatesKey  = roleKey + '!T'
	
		// get remaining data for specific role and date
		var contact_id = factMap[datacellsKey].rows[0].dataCells[0].label, 
			name 	   = factMap[datacellsKey].rows[1].dataCells[1].label,
			project    = factMap[datacellsKey].rows[2].dataCells[2].label,
			sum 	   = factMap[aggregatesKey].aggregates[0].label

		// push the data to 1D array
		temp.push(role, currentDate, name, contact_id, sum)
		roleDateData.push(temp)
	}
	console.log(roleDateData)
}
