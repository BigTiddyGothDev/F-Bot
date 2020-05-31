'use strict';
process.title = "F-Chat Bot";
var auth = require('./auth.json');
var {winston, db, restart, abortRestart} = require("./logger.js");
const fs = require("fs");
winston.silly("Logger initialized");

var client = require("./client.js");
client.restart = restart;
client.abortrestart = abortRestart;

require("./consoleinput");

const OPs = require('./OPs.json');



async function loadCommands(extensiveLogging){

    // preparing collections for commands (this is how they are accessible later)
    client.commands = {
		"private": new Map(), 
		"public": new Map(), 
		"channel": new Map()
	};

    var commandlocations = ['./commands/', './commands private/'];

    var commandsloaded = 0; // for show and debugging purposes
    var locationsloaded = 0;
    await commandlocations.forEach(comloc => {
        if (fs.existsSync(comloc)) 
			fs.readdir(comloc, (err, files) => {
            if (extensiveLogging) 
				console.log(`-------------- Reading files from ${comloc}`);
            if (err) 
				winston.log(err);
            let jsfile = files.filter(f => f.split(".").pop() === "js");
            if (jsfile.length <= 0) {
              if(extensiveLogging) 
				  console.log("Commands Folder empy, no commands found");
              return;
            }

            jsfile.forEach((f, i) => {
              if (!f.endsWith(".js")) 
				  return;
              let commandfile = require(comloc+f);
              if (extensiveLogging) 
				  console.log(`${f} found`);

              if (commandfile.CommandArray) {
                if (extensiveLogging) 
					console.log("  installing multiple:");
                commandfile.CommandArray.forEach(element => {
                  if (!element.name || !(element.private || element.public)) 
					  return;
                  if (extensiveLogging) 
					  console.log(`      - ${element.name} ${element.private?"private":""}${element.public?"public":""}`);
                  if (element.private) {
                      client.commands.private.set(element.name, element);
                  }
                  if (element.public) {
					client.commands.public.set(element.name, element);
                  }

                  commandsloaded += 1;
                });
              }
            });
            locationsloaded=+1;
            winston.info(`successfully loaded ${commandsloaded} commands from ${locationsloaded + "/" + commandlocations.length} locations`);
        });
    });
    return commandsloaded;
}

function resetCommands(){
  winston.info('reloading all bot commands');
  delete client.commands, client.aliases, client.triggers, client.events;
  loadCommands(false);
}
loadCommands(true); 




client.onMessage((msg)=>{
    // winston.verbose(msg);
    var code = msg.slice(0, 3);
    var obj = msg.length >3? JSON.parse(msg.slice(4)):{};

    if (code==="PRI") { //private message
		winston.verbose(obj);
		if (client.privateDisabled && !OPs.admins.includes(obj.character)) {
			client.sendMessage(obj.character, "Hi, I'm a bot! I currently don't respond to private messages. Please direct your questions to [user]" + OPs.admins[0] + "[/user] instead!");
		}
		else {
			if (obj && obj.message.startsWith(client.prefix)) {
				//actually go through the client.command.private set
				var args =  obj.message.slice(client.prefix.length).split(' ');
				var command = args.shift();
				var cmd=client.commands.private.get(command);
				if (!cmd) {
					client.sendMessage(obj.character, "I'm sorry, I don't know that command");
					return;
				}
				if (cmd.adminOnly && !OPs.admins.includes(obj.character)) {
					client.sendMessage(obj.character, "You are not allowed to use that command, I'm sorry.");
					return;
				}
				cmd.run(client, obj, args);
				//client.commands.aliases? Should think about that
			} else {
				client.sendMessage(obj.character, "I'm sorry, I don't understand");
			}
		}
    }
    if (code==="MSG") { //public message
	winston.verbose(`Public message in channel ${obj.channel}: (${obj.character$}) ${obj.message}`);
		if (obj.message.startsWith(client.prefix)) {
			var args = obj.message.slice(client.prefix.length).split(' ');
			var command = args.shift();
			var cmd = client.commands.public.get(command);
			if(cmd !== undefined) {
				if (!cmd.adminOnly || OPs.admins.includes(obj.character)) {
					cmd.run(client, obj, args);
				}
			}
		}
    }
	if(code==="CIU") { // Invite
		winston.verbose("Invited to room " + obj.title + " with ID " + obj.name + " by " + obj.sender);
		// Only join rooms if the inviter is an OP.
		if (OPs.admins.includes(obj.sender)) {
			client.joinRoom(obj.name);
		}
	}
});
client.onError(err=>{
    winston.error(err);
    // console.log(err);
});



console.log(client);
client.reconnect(); // actually connects it
