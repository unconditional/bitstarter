var express = require('express');
var fs = require('fs');

var index_page = "index.html"


var app = express.createServer(express.logger());

app.get('/', function(request, response) {
  ret_html = fs.readFileSync(index_page, 'utf-8');
  response.send(ret_html);
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
