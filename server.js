//*************************************
/** 
* @file server.js
* @desc Initiates Heroku app, defines express middleware routes.
*/
//*************************************
// Define dependencies
var	allocation 		= require('./src/allocation'),
	bodyParser 		= require('body-parser'),
	capacity        = require('./src/capacity'),
	express			= require('express'),
	Forecast 		= require('./src/forecast'),
	helpers			= require('./src/helpers'),
	parser          = require('./src/parser'),
	pipeline 		= require('./src/pipeline'),
	xlsxHandler   	= require('./src/xlsxHandler')

var app = express()
var router = express.Router()
var port = process.env.PORT || 5000

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({limit: '1gb', extended: true }))
app.use('/api', router)

// Define routes:
// General query route for Google Sheets to pull from Heroku postgres DB
router.route('/query')
	.post(function(req, res) {
		helpers.query(req.body.query, req.body.values, function queryCallback(results) {
			res.json(results)
		})
	})

// Get current allocation data from salesforce and export to Google Sheets
router.route('/:instance/DATA_Allocation/:accessToken')
	.get(function(req, res) {
		var accessToken = req.params.accessToken,
			instance    = req.params.instance
		allocation.queryAllocation(accessToken, instance, function queryAllocationCallback(allocationData) {
			res.json(allocationData)
		})
	})
	   
// Get current sales pipeline data from salesforce, update pipeline table, and export to Google Sheets
router.route('/:instance/DATA_Sales_Pipeline/:accessToken')
	.get(function(req, res) {
		var accessToken = req.params.accessToken,
			instance    = req.params.instance
		pipeline.syncPipelineWithSalesforce(accessToken, instance, function syncPipelineWithSalesforceCallback() {
			console.log("DATABASE UPDATE DONE")
			pipeline.exportToSheets(function exportToSheetsCallback(pipelineData) {
				console.log("EXPORT DONE")
				res.json(pipelineData)
			})
		})
	})

// Get current capacity data from salesforce and export to Google Sheets
router.route('/:instance/DATA_Capacity/:accessToken')
	.get(function(req, res) {
		var accessToken = req.params.accessToken,
			instance    = req.params.instance
		capacity.queryCapacity(accessToken, instance, function queryCapacityCallback(capacityData) {
			res.json(capacityData)
		})
	})

// Create forecast data from allocation/pipeline data (@param req.body) and roles_capacities table,
// and export to Google Sheets
router.route('/DATA_Forecast')
	.post(function(req, res) {
		forecast = new Forecast(req.body, function() {
			forecast.create(function() {
				res.json(forecast.returnData)
				delete forecast
			})
		})
	})

// Main route for Google Sheet buttons
// Add, update opportunities in sales_pipeline table
// Update opportunities in table when project sizes are changed or added
router.route('/updatePipelineTable')
	.post(function(req, res) {
		switch(req.body.type) {
			case 'add':
				pipeline.insertWithDefaultSize(req.body.opportunityData, function insertWithDefaultSizeCallback() {
					helpers.setProtectedStatus(req.body.opportunityData[1], true, function setProtectedStatusCallback() {
						pipeline.exportToSheets(function exportToSheetsCallback(pipelineData) {
							res.json(pipelineData)
						})			
					})
		
				})
				break
			case 'update':
				helpers.appendOpportunityData(req.body.opportunityData, function appendOpportunityDataCallback(opportunityData) {
					helpers.deleteOpportunity(opportunityData[1], function deleteOpportunityCallback() {
							pipeline.insertWithDefaultSize(opportunityData, function insertWithDefaultSizeCallback() {
								pipeline.exportToSheets(function exportToSheetsCallback(pipelineData) {
									console.log(pipelineData)
									res.json(pipelineData)
								})
							})
						}
					)
				})
				break
		}
	})

// Update a specific opportunity in the sales_pipeline table from
// an xlsx sheet attached to an opportunity object in salesforce
router.route('/trigger')
	.post(function(req, res) {
		parser.parseExcelSheet(req.body, function parseExcelSheetCallback(opportunityData) {
			if(opportunityData != undefined) {
				console.log('before updateDatabaseFromXlsx')
				xlsxHandler.updateDatabaseFromXlsx(opportunityData, function updateDatabaseFromXlsxCallback() {
					console.log('after updateDatabaseFromXlsx')
					res.json({message: "Done."})
				})
			}		
		})
	})

// Start server
app.listen(port)
console.log('Heroku station is operational on port ' + port)
