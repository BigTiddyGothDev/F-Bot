const db = require(`./logger.js`).db;
const winston = require('./logger.js').winston;
var client = require('./client.js');
var zlib = require('zlib');

// Stuff to make the eval command useful
var auth = require('./auth.json');

var ConsoleCommands = { // commands defined just for CLI usage, primarily for debug and development
  "test1": function (){
        console.log('works...\n fine!');
    },
  "eval": async function (line, command, args){
        try{
            console.log(eval(line.trim().slice(command.length +1)));
        } catch(err){
            console.log(err);
        }
    },
  "commands": function (){
        console.log(client.commands);
    },
  "commandreload": require('./bot.js').resetcommands,
  "test": function (line, command, args){

        var auth = require("./auth.json");
        var fetch = require("node-fetch");

        const { URLSearchParams } = require('url');
        const params = new URLSearchParams();
        params.append('account', auth.user);
        params.append('password', auth.password);

        fetch('https://www.f-list.net/json/getApiTicket.php', { method: 'POST', body: params })
            .then(res => res.json()) // expecting a json response
            .then(json => console.log(json));
    },
  "test2": function (){
		var auth = require("./auth.json");
        client.api.getProfile(auth.character).then(o =>{
            console.log(typeof o);
            console.log(o);
            // Object.keys(o).forEach(k=>{
            //     console.log(k +""+ o[k]);
            //     db.set("TestObject."+k, o[k]).write();
            // });
        });
    }
}


// stuff needed to pretent messages came via Discord to use those commands aswell(where possible)
async function SendMsg(msg){
  console.log("response: " + msg);
  return;
};

var msg = {
  'author':{'username':'server','id':'0000'},
  'member':{},
  'guild': {'channels':[], 'id':'0000'},
  'content':'',//is edited when passed
  'channel':{'send':SendMsg},
  'reply':SendMsg
};
//msg.member.roles = [{name:'REDACTED'}, {name:'Admin'}, {name:'Server'}];


const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt:''
});
rl.on('line', (line) => {
  try {
    winston.info(`CLI input: "${line}"`); // just in case something breaks, will be logged in the files
    var args = line.trim().split(/ +/g);
    var command = args.shift().toLowerCase();
    if (ConsoleCommands[command] != null) {
      ConsoleCommands[command](line, command, args);
    } else {
      // standard commandhandler
      msg.content = client.prefix + line.trim(); //update
      let ListedCommand = client.commands.get(command) || client.commands.get(client.aliases.get(command)) || client.aliases.get(command);
      if (ListedCommand) {
        if (!ListedCommand.run) {
          console.log(ListedCommand);
          console.log("command couldn't be run, run() not defined");
          return;
        }
        if (ListedCommand.cli == false) {
          console.log('This command was intentionally deactivated for the CLI');
          return;
        }
        winston.info(`running \`${ListedCommand.name}\` from CLI`);
        ListedCommand.run(client, msg, args, command, db).catch(err => winston.error(err));
      }
    }

  } catch (err) {
    winston.error(err);
  }
  rl.prompt();
});
