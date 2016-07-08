'use strict';

class Msg {
  constructor(){

  }

  *recv(args, ctx){
    console.log(args);
  }

  *send(args){

  }
}

module.exports = new Msg();
