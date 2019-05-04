'use strict';

var server = require('./server/index.js');
var port = process.env.PORT || 9000;

server.listen(port, function () {
  console.log('Server running on port %d', port);
});
