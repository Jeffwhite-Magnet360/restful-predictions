/**
* @module Parser
* @desc Scrapes estimated forecasted hours for each role and week from
ESTIMATE xlsx file.
*/

var xlsx = require('xlsx')
var moment = require('moment')
/**
* @function parseExcelSheet
* @desc Returns a JSON formatted object of estimated forecasted hours for role/
week combinations from a base64 encoded string. The base64 string is converted into a 
xlsx workbook object for parsing using the xlsx library.
* @param {string} - b64String - base64 encoded string from SalesForce
* @returns JSON format object of estimated forecasted hours for each role/week
*/
var parseExcelSheet = function(b64String, callback) {
	// Create xlsx objects and determine indexes
	var workbook = xlsx.read(b64String, {type: 'base64'})	
	var sheet 	 = workbook.Sheets[workbook.SheetNames[2]]
	// Template indexes are hardcoded here
	// Top row/col refers to upper left cell B18
	// Bottom row/col refers to lower right cell I61
	var indexes = {
		dataRowStart: 18,
		dataColStart: 28,
		topRow: 17,
		topCol: 1,
		bottomRow: 0,
		bottomCol: 8,
		flagRow: 3,
		flagCol: 0
	}
	var temp = getBottomRow(sheet, indexes)
	indexes.bottomRow = temp

	// Parse the sheet if valid
	if(!sheetIsValidFormat(workbook, sheet, indexes)) {
		callback(undefined)
	} else {
		var sheetData = {}
		var colEnd = getColumnLimit(sheet, indexes.bottomRow, indexes.dataColStart, 3)
		//var initialDate = getCellValue(sheet, indexes.topRow, indexes.dataColStart, 'w')
		// Iterate over the roles column until subtotal is reached
		//	* For each role, grab each estimated hour for each week date
		//  * If a role, date, or hour is empty, do nothing
		while(getCellValue(sheet, indexes.dataRowStart, 1, 'v') != 'Subtotal') {
			var role = getCellValue(sheet, indexes.dataRowStart, 1, 'v')
			if(role != '') {
				sheetData[role] = {}
				for(var i = indexes.dataColStart; i < colEnd; i++) {
					var date = moment(new Date(getCellValue(sheet, indexes.topRow, i, 'w')))
							   .format('MM/DD/YYYY')
					if(date != '') {
						var hours = getCellValue(sheet, indexes.dataRowStart, i, 'v')
						if(hours != '') {
							sheetData[role][date] = hours
						}
					}
				}
			}
			indexes.dataRowStart += 1
		}
		callback(sheetData)
	}
}

/**
* @function getCellValue
* @desc Return the value of cell (row, col) in the sheet.
* @param {worksheet} sheet - xlsx sheet object
* @param {int} row - row of cell
* @param {int} col - column of cell
* @param {string} type - type of data returned E.G v (raw) or w (formatted)
* @returns Value of cell of (row, col)
*/
function getCellValue(sheet, row, col, type) {
	if(sheet[xlsx.utils.encode_cell({r:row,c:col})] != undefined) {
		return sheet[xlsx.utils.encode_cell({r:row,c:col})][type]
	} else {
		return ''
	}
}

/**
* @function getColumnLimit
* @desc Determines the stop point for each row iteration by scanning for
n consecutive 0.00 values in the subtotal row.
* @param {worksheet} sheet - xlsx sheet object
* @param {int} bottomRow - numeric index of the row for subtotals
* @param {int} dataColStart - numeric index of column where subtotal data begins
* @param {int} n - number of consecutive 0.00 values before stop
* @returns {int} colEnd - numeric index of last column of row data
*/
function getColumnLimit(sheet, bottomRow, dataColStart, n) {	
	var colEnd
	var currentCol = dataColStart
	var done = false
	var consecutiveCheck = true
	while(!done) {
		for(var i = currentCol; i < currentCol + n; i++) {
			consecutiveCheck = consecutiveCheck && (getCellValue(sheet, bottomRow, i, 'v') == 0.00)
		}
		// When consecutiveCheck == false, there exists at least 1 nonzero value
		if(!consecutiveCheck) {
			currentCol += n
			consecutiveCheck = true
		} else {
			done = true
			colEnd = currentCol
		}
	}
	return colEnd
}

/**
* @function getbottomRow
* @desc Finds numeric row index of cell with value 'Subtotal'.
* @param {worksheet} sheet - xlsx worksheet object
* @param indexes - JSON formatted object of numeric indexes of key rows/cols
* @returns numeric row index of cell containing 'Subtotal'
*/
function getBottomRow(sheet, indexes) {
	var bottomRow = indexes.topRow
		max = 75
	while(bottomRow < max) {
		if(getCellValue(sheet, bottomRow, indexes.topCol, 'v') == 'Subtotal') {
			return bottomRow
		} else {
			bottomRow++
		}
	}
	return 0
}

/**
* @function sheetIsValidFormat
* @desc Validates the sheet format.
* @param {workbook} workbook - xlsx workbook object
* @param {worksheet} sheet - xlsx worksheet object
* @param indexes - JSON formatted object of numeric indexes of key rows/cols
* @returns true/false sheet valid status
*/
function sheetIsValidFormat(workbook, sheet, indexes) {
	var valid = true
	// Validate sheet at index 2 is 'Estimate'
	if(workbook.Props.SheetNames[2] != 'Estimate') {
		console.log('invalid tab check')
		valid = false
	}

	// Check top row headers
	if(getCellValue(sheet, indexes.topRow, indexes.topCol, 'v') != 'Role*') {
		console.log('invalid role check')
		valid = false
	}
	if(getCellValue(sheet, indexes.topRow, indexes.topCol + 1, 'v') != 'Responsibilities') {
		console.log('invalid responsibilities check')
		valid = false
	}

	// Check bottom row labels
	if(getCellValue(sheet, indexes.bottomRow + 1, indexes.bottomCol, 'v') != 'Total Cost') {
		console.log('invalid total cost check')
		valid = false
	}
	if(getCellValue(sheet, indexes.bottomRow + 2, indexes.bottomCol, 'v') != 'Total Billable') {
		console.log('invalid total billable check')
		valid = false
	}

	// Verify subtotal cell
	if(getCellValue(sheet, indexes.bottomRow, indexes.topCol, 'v') != 'Subtotal') {
		console.log('invalid subtotal check')
		valid = false
	}

	// Check if DO NOT UPDATE flag
	if(getCellValue(sheet, indexes.flagRow, indexes.flagCol, 'v').toUpperCase() == 'DO NOT UPDATE') {
		console.log('flag set do no update')
		valid = false
	}
	return valid
}

module.exports.parseExcelSheet = parseExcelSheet





