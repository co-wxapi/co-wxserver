'use strict';

var debugEnabled = false;

function debug(){
  if ( debugEnabled ){
    console.log.apply(console.log, arguments);
  }
}

debug.enable = function(enabled){
  debugEnabled = enabled;
}

module.exports = debug;
