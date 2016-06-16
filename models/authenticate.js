//Authenticate.js
//Private
var oauth2 = require('simple-oauth2')

var credentials = {
        clientID: '3MVG9uudbyLbNPZMn2emQiwwmoqmcudnURvLui8uICaepT6Egs.LFsHRMAnD00FSog.OXsLKpODzE.jxi.Ffu',
        clientSecret: '625133588109438640',
        site: 'https://login.salesforce.com',
        authorizationPath: '/services/oauth2/authorize',
        tokenPath: '/services/oauth2/token',
        revokePath: '/services/oauth2/revoke'
    }

// Initialize the OAuth2 Library
var oauth2 = oauth2(credentials)

//Public
module.exports = Authenticate

function Authenticate(username, password, id) {
    this.token;
    this.id = id;
    this.hostURL;
    this.path = '/services/data/v35.0/analytics/reports/';
    this.tokenConfig = {
        grant_type: 'password',
        username: username,
        password: password + 'NOOqUkbXD7QbkL17jsWG1RXu',
        client_id: credentials.clientID,
        client_secret: credentials.clientSecret
    }
}

Authenticate.prototype.getToken = function() {
    oauth2.password.getToken(this.tokenConfig, function saveToken(error, result) {
        if (error) { 
            console.log('Access Token Error', JSON.stringify(error)) 
        }
        else {
            this.token = oauth2.accessToken.create(result)
            this.hostURL = this.token.token.instance_url.replace('https://', '')
            //console.log(this.token.token)
            return this.token
        }   
    })
}

Authenticate.prototype.getData = function() {
    console.log(this.token.token.access_token)
    oauth2.api('GET', this.hostURL + this.path + this.id, {
        'Authorization': 'Bearer ' + this.token.token.access_token,
        'Content-Type' : 'application/json'
        }, function (err, data) {
            console.log(data)
    })
}














