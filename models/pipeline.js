module.exports = Pipeline

function Pipeline(instance, accessToken) {
	this.accessToken = accessToken
	this.path = 'https://' + instance + '/services/data/v35.0/analytics/reports/00Oa00000093sCD'
} 

Pipeline.prototype.getPipeline = function(client, oauth2, callback) {

	parameters = {
		access_token: this.accessToken
	}
	var dbData,
		query = client.query("SELECT * from opportunity_pipeline");
	query.on("row", function (row, result) {
		result.addRow(row)
	});
	query.on("end", function (result) {
		dbData = result
		console.log(JSON.stringify(dbData.rows, null, "    "));
		client.end()
	});

	// oauth2.api('GET', this.path, parameters, function (err, data) {
	//     if (err)
	//         console.log('GET Error: ', JSON.stringify(err)) 
	    
	//     var factMap 				= data.factMap,
	//     	groupingsDown 			= data.groupingsDown.groupings,
	//     	returnData				= [],
	//     	rowData,
	//     	stageKey

	//     returnData.push(["STAGE",
	//     					"OPPORTUNITY_NAME",
 //      						"TYPE",
	// 						"LEAD_SOURCE",
	// 						"AMOUNT",
	// 						"EXP_AMOUNT",
	// 						"CLOSE_DATE",
	// 						"NEXT_STEP",
	// 						"PROBABILITY",
	// 						"FISCAL_QUARTER",
	// 						"AGE",
	// 						"CREATED_DATE",
	// 						"FULL_NAME",
	// 						"ROLLUP_DESCRIPTION",
	// 						"ACCOUNT_NAME"
	// 					])

	//     for (var stage in factMap) {

	// 	    stageKey = stage.split('!')[0];
			

	// 		if (stageKey != "T"){
	// 			for (var row in factMap[stage].rows){
	// 				rowData = []
	// 				rowData.push(groupingsDown[stageKey].label)
	// 				for (var cell in factMap[stage].rows[row].dataCells){
	// 					rowData.push(factMap[stage].rows[row].dataCells[cell].label)
	// 				}
	// 				returnData.push(rowData)
	// 			}
	// 		}
	// 	}
	// 	console.log(returnData)
	//     callback(returnData)
	// })  
}