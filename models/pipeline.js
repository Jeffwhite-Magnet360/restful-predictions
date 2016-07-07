//pipeline.js
//input: 
	//SF instance and SF accessToken

module.exports = Pipeline

function Pipeline(instance, accessToken) {
	this.accessToken = accessToken
	this.path = 'https://' + instance + '/services/data/v35.0/analytics/reports/00Oa00000093sCD'
} 

Pipeline.prototype.getPipeline = function(client, oauth2, callback) {

	projectSizes = {}
	var projectSizesQuery = client.query("SELECT sizeid,pricehigh FROM project_size")
	projectSizesQuery.on("row", function (row, result) {
		result.addRow(row)
	})
	projectSizesQuery.on("end", function (result) {
		for (var entry in result.rows){
			projectSizes[result.rows[entry].sizeid] = {
				"priceHigh": result.rows[entry].pricehigh
			}
		}
	})

	smallProject = 'smallProject'
	mediumProject = 'mediumProject'
	largeProject = 'largeProject'

	parameters = {
		access_token: this.accessToken
	}

	addedOpportunities = {}
	var opportunitiesQuery = client.query("SELECT * from sales_pipeline")
	opportunitiesQuery.on("row", function (row, result) {
		result.addRow(row)
	})
	opportunitiesQuery.on("end", function (result) {
		for (var entry in result.rows){
			addedOpportunities[result.rows[entry].opportunity] = {
				"STAGE": result.rows[entry].stage,
				"PROBABILITY": result.rows[entry].probability,
				"TYPE": result.rows[entry].type,
				"START_DATE": result.rows[entry].start_date,
				"PROJECT_SIZE": result.rows[entry].project_size
			}
		}
	})

	omitData = {}
	var omitQuery = client.query("SELECT * from omit")
	omitQuery.on("row", function (row, result) {
		result.addRow(row)
	})
	omitQuery.on("end", function (result) {
		for (var entry in result.rows){
			omitData[result.rows[entry].opportunity] = {}
		}
	})

	oauth2.api('GET', this.path, parameters, function (err, data) {
	    if (err)
	        console.log('GET Error: ', JSON.stringify(err)) 
	    
	    var factMap 				= data.factMap,
	    	groupingsDown 			= data.groupingsDown.groupings,
	    	returnData				= [],
	    	newRow					= [],
	    	stageIndex				= 0,
	    	opportunityIndex		= 1,
	    	typeIndex				= 2,
	    	closeDateIndex			= 5,
	    	startDateIndex			= 7,
	    	probabilityIndex		= 9,
	    	exp_amountIndex			= 4,
	    	week					= 7,
	    	rowData,
	    	stageKey,
	    	curStage,
	    	curRow,
	    	curCell,
	    	curOpportunity,
	    	curProjectSize

	    returnData.push(["STAGE",
	    					"OPPORTUNITY_NAME",
      						"TYPE",
							"LEAD_SOURCE",
							"AMOUNT",
							"EXP_AMOUNT",
							"CLOSE_DATE",
							"START_DATE",
							"NEXT_STEP",
							"PROBABILITY",
							"FISCAL_QUARTER",
							"AGE",
							"CREATED_DATE",
							"FULL_NAME",
							"ROLLUP_DESCRIPTION",
							"ACCOUNT_NAME",
							"ROLE",
							"PROJECT_SIZE"
						])

	    for (var stage in factMap) {

		    stageKey = stage.split('!')[stageIndex]
		    curStage = factMap[stage]
			

			if (stageKey != "T"){
				for (var row in curStage.rows){
					curRow = curStage.rows[row]
					curOpportunity = curRow.dataCells[opportunityIndex-1].label
					if (!(omitData[curOpportunity])){
						rowData = []
						rowData.push(groupingsDown[stageKey].label)
						for (var cell in curRow.dataCells){
							curCell = curRow.dataCells[cell]
							rowData.push(curCell.label)
							if (cell == closeDateIndex)
								rowData.push(calculateStartDate(curCell.label, week))
							else if (cell == exp_amountIndex){
								curProjectSize = getProjectSize(curCell.label)
								testFunction(curCell.label)
							}
						}
						if(addedOpportunities[curOpportunity]){
							rowData[stageIndex] = addedOpportunities[curOpportunity].STAGE
							rowData[probabilityIndex] = (addedOpportunities[curOpportunity].PROBABILITY * 100) + "%"
							rowData[typeIndex] = addedOpportunities[curOpportunity].TYPE
							rowData[startDateIndex] = calculateStartDate(addedOpportunities[curOpportunity].START_DATE,0)
							curProjectSize = addedOpportunities[curOpportunity].PROJECT_SIZE
							delete addedOpportunities[curOpportunity]
						}
						rowData = assignRoles(rowData,curProjectSize)
						// console.log(rowData)
						for (var each in rowData)
							returnData.push(rowData[each])
					}
				}
			}
		}
		for (var key in addedOpportunities){
			if (!(omitData[key])){
				newRow = []
				newRow.push(addedOpportunities[key].STAGE,
									key,
									addedOpportunities[key].TYPE,
									"",
									"",
									"",
									"",
									calculateStartDate(addedOpportunities[key].START_DATE,0),
									"",
									addedOpportunities[key].PROBABILITY,
									"",
									"",
									"",
									"",
									"",
									""
								)
				newRow = assignRoles(newRow,addedOpportunities[key].PROJECT_SIZE)
				for (var each in newRow)
					returnData.push(newRow[each])
			}
		}
	    callback(returnData)
	})  
}

function calculateStartDate(closeDate, dateIncrement){
	var date = new Date(closeDate)
	var returnDate = new Date(date.setDate(date.getDate() + dateIncrement))
	returnDate = JSON.stringify(returnDate).split('T')[0].split('-')
	return returnDate[1]+'/'+returnDate[2]+'/'+returnDate[0].replace('"','')
}

function getProjectSize(expectedAmount){

	expectedAmount = expectedAmount.replace('USD ', '').replace(/,/g,'')
	//console.log(expectedAmount)
	if (parseInt(expectedAmount) <= 150000)
		return smallProject
	else if(parseInt(expectedAmount)<=500000)
		return mediumProject
	else
		return largeProject
}

function assignRoles(row,projectSize){
	var tempRow 	= [],
		returnData	= [],
		roleIndex	= 16,
		roles

	if (projectSize == smallProject)
		roles = ['BC','QA','PC']
	else if (projectSize == mediumProject)
		roles = ['PL','ETA','PC','BC']
	else if (projectSize == largeProject)
		roles = ['PL','ETA','PC','BC','QA Lead','OS QA','OS DEV','DEV']
	else
		roles = ['NONE']
	
	for (var each in roles){
		tempRow = []
		for (var col in row){
			tempRow.push(row[col])
		}
		tempRow.push(roles[each])
		tempRow.push(projectSize)
		returnData.push(tempRow)
	}


	return returnData
}


function testFunction(expectedAmount){
	for (var each in projectSizes){
		if (expectedAmount <= projectSizes[each].priceHigh){
			console.log(projectSizes[each])
			break
		}
	}
}



