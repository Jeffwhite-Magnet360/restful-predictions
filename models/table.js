//table.js
//input: 
	//csv obj
	
module.exports = Table

function Table(data, pg) {
	this.json 		= data.json
	this.id 		= data.id
	this.dataBase 	= pg
} 

Table.prototype.saveTable = function(callback) {
	var id = this.id
	var json = this.json
	this.dataBase.connect(process.env.DATABASE_URL, function(err, client, id, json) {
		if (err) throw err;
		//console.log('Connected to postgres! Getting schemas...');
		//client.query('SELECT table_schema,table_name FROM information_schema.tables;')
		//client.query("CREATE TABLE IF NOT EXISTS emps(firstname varchar(64), lastname varchar(64))");
		// client.query("INSERT INTO emps(firstname, lastname) values($1, $2)", ['Ronald', 'McDonald']);
		// client.query("INSERT INTO emps(firstname, lastname) values($1, $2)", ['Mayor', 'McCheese']);
		// var query = client.query("SELECT firstname, lastname FROM emps ORDER BY lastname, firstname");
		// query.on("row", function (row, result) {
		// 	result.addRow(row);
		// });
		// query.on("end", function (result) {
		// 	console.log(JSON.stringify(result.rows, null, "    "));
		// 	client.end();
		// });

		console.log(this.id)
		console.log(this.json[2506])


		client.query("INSERT INTO allocation_reports(id, json) values($1, $2)", [this.id, this.json]);
	});

	callback()

}