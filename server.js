var http = require('http');
var url = require('url');
var fs = require('fs');
var teamSize;
var ip = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var appName = 'TeamTracker';
var team = {};
var teamId = '';
var loginData = '';
var route = {
	'login'	: 'public/login.htm',
	'main'		: 'public/main.js',
	'app'		: 'public/app.htm'
};

var urldecode = function(data) {
	return data
		.replace(/%3A/gi, ':')
		.replace(/%2F/gi, '/')
		.replace(/\+/g, ' ')
		.replace(/%3D/gi, '=')
		.replace(/%3F/gi, '?')
		.replace(/%26/g, '&');
}

var getTeamId = function(post) {
	return (post.teamname + '_' + post.password).replace(/ /g, '_');
}

var getPost = function(body) {
	var rows = body.split('&');
	var data = {};
	for (i = 0; i < rows.length; i++) {
		var pair = rows[i].split('=');
		data[pair[0]] = urldecode(pair[1]);
	}
	return data;
}

http.createServer(function(request, response) {
	var path = url.parse(request.url).pathname.substr(1,999);
	var body = '';
	request.on('data', function (chunk) {
		body += chunk;
	});

	request.on('end', function () {
		if (body.length > 0) {
			if (path === 'app') {
				loginData = '<script type="text/javascript">';
				var pairs = body.split('&');
				for (i = 0; i < pairs.length; i++) {
					var pair = pairs[i].split('=');
					// urldecode the value
					loginData += 'var ' + pair[0] +	' = ' +	'"' + urldecode(pair[1]) +'";' + "\n";
				}
				loginData += '</script>' + "\n";
			}
			if (path === 'update') {
				var post = getPost(body);
				teamId = getTeamId(post);

				// create team if teamname/password pair isn't set
				if (team[teamId] === undefined) {
					team[teamId] = {};
				}
				// update user 
				team[teamId][post.userid] = {
					lat: parseFloat(post.lat),
					lng: parseFloat(post.lng),
					name: post.name + ' (' + post.teamname + ')',
					timestamp: new Date().getTime()
				};

				// remove expired users
				teamSize = 0;
				for(var memberId in team[teamId]) {
					var now = new Date().getTime();
					var lastUpdate = now - team[teamId][memberId].timestamp;
					if(lastUpdate > 30000) {
						delete team[teamId][memberId];
					} else {
						teamSize++;
					}
				}
			}
		} else {
			loginData = '';
		}
	});

	if (path === 'update') {
		response.writeHead(200, {'Content-Type': 'text/json' });
		if(team[teamId] === undefined) {
			response.end();
		} else {
			console.log('serving team ' + teamId + ', ' + teamSize + ' members');
			response.end(JSON.stringify(team[teamId]));
		}
	} else {
		var filename = (route[path] === undefined) ? route['login']: route[path];
		fs.readFile(filename, 'utf-8', function read(err, content) {
			if (err) throw err;
			console.log('requesting "' + path + '", serving "' + filename + '"');
			response.writeHead(200, {'Content-Type': 'text/html' });
			if(loginData.length > 0) {
				content = content.replace('<script type="text/javascript">document.location="/";</script>', loginData);
			}
			response.end(content);
		});
	}
}).listen(port, ip);
 
console.log(appName + ' running on port ' + port);