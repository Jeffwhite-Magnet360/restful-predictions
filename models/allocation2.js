module.exports = Allocation2
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
			async.mapValues(roleList, getRoleData)
		}
	})
	//callback(allocationData)
}

function getRoleData(role, roleKey) {
	// Role is in form {key: label} E.G {2: Developer}
	var roleDateData = []
	roleDateData.push(role)

	for(var date in groupingsDown.groupings[roleKey].groupings) {
		var currentDateKey = groupingsDown.groupings[roleKey].groupings[date].key, 
			currentDate = groupingsDown.groupings[roleKey].groupings[date].label,
			datecellsKey,
			aggregatesKey
		
		datacellsKey = currentDateKey + '!T'
		aggregatesKey = roleKey + '!T'
		
		roleDateData.push(currentDate)
		// get project name, name, cid for a specific role and date
		roleDateData.push(factMap[datacellsKey].rows[2].label)

		// get sum of allocation hrs for a specific role
		//roleDateData[role].SUM = factMap[aggregatesKey].aggregates




	}
	console.log(roleDateData)
}
