// server.js

// Initialize dependencies
var	newRelic		= require('newrelic')

var	allocation 		= require('./src/allocation'),
	async			= require('async'),
	bodyParser 		= require('body-parser'),
	capacity        = require('./src/capacity'),
	express			= require('express'),
	Forecast 		= require('./src/forecast'),
	Omit 			= require('./src/omit'),
	Opportunity 	= require('./src/opportunity'),
	parser          = require('./src/parser'),
	pg 				= require('pg'),
	pipeline 		= require('./src/pipeline'),
	ProjectSize 	= require('./src/projectSize'),
	utilities		= require('./src/utilities'),
	xlsxHandler   	= require('./src/xlsxHandler')

var app = express()
var router = express.Router()

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({limit: '1gb', extended: true }))
app.use('/api', router)

pg.defaults.ssl = true
pg.defaults.poolSize = 10

var port = process.env.PORT || 5000

// Define routes
router.route('/query')
	.post(function(req, res) {
		utilities.query(req.body.query, null, function(results) {
			res.json(results)
		})
	})

// Import allocation/sales_pipeline/capacity/forecast
router.route('/:instance/DATA_Allocation/:accessToken')
	.get(function(req, res) {
		var accessToken = req.params.accessToken,
			instance    = req.params.instance
		allocation.queryAllocation(accessToken, instance, function(allocationData) {
			res.json(allocationData)
		})
	})
	   
router.route('/:instance/DATA_Sales_Pipeline/:accessToken')
	.get(function(req, res) {
		var accessToken = req.params.accessToken,
			instance    = req.params.instance
		pipeline.queryPipeline(accessToken, instance, function(pipelineData) {
			pipeline.applyDB(pipelineData,function(result){
				async.each(result, function(row){
					if (row.length != 12)
						console.log(row)
				})
				console.log(result)
				res.json(result)
			})
		})
	})

router.route('/:instance/DATA_Capacity/:accessToken')
	.get(function(req, res) {
		var accessToken = req.params.accessToken,
			instance    = req.params.instance
		capacity.queryCapacity(accessToken, instance, function(capacityData) {
			res.json(capacityData)
		})
	})

router.route('/DATA_Forecast')
	.post(function(req, res) {
		forecast = new Forecast(pg, req.body, function() {
			forecast.create(function() {
				res.json(forecast.returnData)
				// async.each(forecast.returnData, function(row){
				// })
				delete forecast
			})
		})
	})

// Add/update/remove opportunities
router.route('/addOpportunity')
	.post(function(req,res) {
		console.log('addOpportunity')
		opportunity = new Opportunity(req.body)
		opportunity.add(async, pg, function(err) {
			if (err)
				res.send(err)
			else
				res.json({message: 'Success!'})
			delete opportunity
		})
	})

router.route('/updateOpportunity')
	.post(function(req, res) {
		opportunity = new Opportunity(req.body)
		opportunity.update(pg, function(err) {
			if(err) 
				res.send(err)
			else
				res.json({message: 'Success!'})
			delete opportunity
		})
	})

router.route('/removeOpportunity')
	.post(function(req,res) {
		opportunity = new Opportunity(req.body)
		opportunity.remove(async, pg,function(err) {
			if (err)
				res.send(err)
			else
				res.json({message: 'Success!'})
			delete opportunity
		})
	})

// Add/remove ommited opportunities
router.route('/addOmit')
	.post(function(req,res) {
		omit = new Omit(req.body)
		omit.add(pg,function(err) {
			if (err)
				res.send(err)
			else
				res.json({message: 'Success!'})
			delete omit
		})
	})

router.route('/removeOmit')
	.post(function(req,res){
		omit = new Omit(req.body)
		omit.remove(pg,function(err) {
			if (err)
				res.send(err)
			else
				res.json({message: 'Success!'})
			delete omit
		})
	})



router.route('/addProjectSize')
	.post(function(req,res){
		projectSize = new ProjectSize(req.body, function() {
			projectSize.add(pg,function(err) {
				if (err)
					res.send(err)
				else
					res.json({message: 'Success!'})
				delete projectSize
			})
		})
	})

router.route('/updateProjectSize')
.post(function(req,res) {
	projectSize = new ProjectSize(req.body, function() { 
		projectSize.update(pg,function(err) {
			if (err)
				res.send(err)
			else
				res.json({message: 'Success!'})
			delete projectSize
		})
	})
})

router.route('/editProjectSize')
	.post(function(req,res) {
		projectSize = new ProjectSize(req.body, function() {
			console.log(projectSize.data)
			projectSize.edit(pg,function(err,response) {
				if (err)
					res.send(err)
				else
					res.json(response)
				delete projectSize
			})
		})	
	})

router.route('/removeProjectSize')
	.post(function(req,res){
		projectSize = new ProjectSize(req.body, function() {
			projectSize.remove(pg,function(err) {
				if (err)
					res.send(err)
				else
					res.json({message: 'Success!'})
				delete projectSize
			})
		})
	})

// Update capacity
router.route('/updateCapacity')
	.post(function(req, res) {
		var capacity = new Capacity(null, null, req.body)
		capacity.updateDB(pg, function() {
			console.log('deleting capacity obj')
			delete capacity
		})
		res.json({message: 'Success!'})
	})

// Debug routes
router.route('/clearDB')
	.post(function(req,res) {
		pg.connect(process.env.DATABASE_URL, function(err, client) {
			client.query('delete from sales_pipeline *')
			client.query('delete from omit *')
		})
		res.json({message: 'Success!'})
	})

// Updates project sizes database with data from SF opportunity attachment
router.route('/importProjectSize')
	.post(function(req, res) {
		parser.parseExcelSheet(req.body, function(opportunityData) {
			if(opportunityData != undefined) {
				//console.log(opportunityData.sheetData)
				xlsxHandler.updateDatabase(opportunityData, function(status) {
					//console.log("Status is: " + JSON.stringify(status))
					res.json({message: status})
				})
			}		
		})
	})



// Catch timeouts
// app.use(function(req, res, next) {
//     res.setTimeout(5000, function() {
//             res.sendStatus(408);
//         });
//     next();
// });

//Start server
app.listen(port)
console.log('Heroku station is operational on port ' + port)
