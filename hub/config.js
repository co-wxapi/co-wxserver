var path = require('path');
var fs = require('fs');
var findPaths;
if ( process.argv.length > 2 ) {
  findPaths = [process.argv[2]];
}
else {
  findPaths = ['.wxrc', path.join(__dirname, '../.wxrc'), path.join(__dirname, '../etc/wxrc'), '/etc/wxrc'];
}
var config = null;
for ( var i = 0; i < findPaths.length; ++ i ) {
  var findPath = findPaths[i];
  try {
    var data = fs.readFileSync(findPath);
    config = eval("("+data+")")//JSON.parse(data);
    console.info('Server started with configuration file - '+findPath);
    break;
  }
  catch(err) {
    //console.warn('Can not loading wechat configuration - '+findPath);
  }
}

if ( config == null ) {
  console.error('Can not load configuration files from '+findPaths.join(','));
  process.exit(1);
}

module.exports = config;
