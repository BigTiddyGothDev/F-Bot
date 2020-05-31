var winston = require('winston');
const Transport = require('winston-transport');
var auth = require('./auth.json');
// var OPs = require('./dbs/OPs.json');
const fs = require("fs");


winston.format.combine(
  winston.format.colorize(),
  winston.format.json()
);
winston.remove(winston.transports.Console);
let moment = require('moment');
winston.add( new winston.transports.File({ filename: `logs/${moment().format('YY.MM.DD')}.log`, level: 'debug', format:     winston.format.combine(
  winston.format.timestamp(),
  // winston.format.simple(),
  winston.format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`),
)}));
winston.add(new winston.transports.Console({level: 'silly',
  format : winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    // winston.format.simple(),
    winston.format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`),
  )
}), {
  // colorize: true,
  // level: 'silly'
});
// winston.level = 'info';
  // new winston.transports.File({ filename: 'error.log', level: 'error' });
  // new winston.transports.File({ filename: 'combined.log' });
// var client = require('./client.js');
// client.on('ready', () => {
//   class CustomTransport extends Transport {
//     constructor(opts) {
//       super(opts);
//       // Consume any custom options here. e.g.:
//       // - Connection information for databases
//       // - Authentication information for APIs (e.g. loggly, papertrail,
//       //   logentries, etc.).
//     }
//     log(info, callback) {
//       // Perform the writing to the remote service
//       // var message = `${info.level}: ${info.message}`;
//       //
//       // var VWG = client.guilds.get('388765646554398734');
//       // var jacksID = '274303955314409472';
//       // OPs.RealAdmins.forEach(async (admin) => {
//       //   client.fetchUser(admin).then(user => {
//       //
//       //     if (info.level == 'error') {
//       //
//       //       if ( VWG.presences.has(jacksID) || user.id == jacksID) { //if i'm online, annoy me only
//       //         message = `${user.toString()} ` + message;
//       //       }
//       //     }
//       //
//       //     user.send(message);
//       //   });
//       // });
//       callback();
//     }
//   }
//   // const transport = new CustomTransport();
//
//   // winston.add( new CustomTransport);
//   winston.add( new CustomTransport());
// });


// DataBase
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');


function abortRestart(){
  if (client.rebooting.timer != undefined || client.rebooting) {
    clearTimeout(client.rebooting.timer);
    var remainingtime= client.rebooting.timeleft();
    delete client.rebooting;
    winston.info('scheduled restart aborted');
    winston.info(`with ${remainingtime/1000}s left`);
  } else {
    winston.info('No restart scheduled, nothing happened');
  }
}

async function restart(reason, timeout){
  // var client = require('./client.js');
  if (client.rebooting != undefined) {
    winston.info(`a restart is already scheduled`);
    return false;
  }
  if (timeout == undefined || typeof timeout != 'number') {
    timeout = 30*1000; //30 sec
  }

  //Tell the world you're restarting
  // clearInterval(client.events.get("ActivityUpdate").runtime);
  // client.user.setPresence({status: 'dnd',
  //   game: {
  //     name: `to my process shutting down ${(timeout ==0)?'':` in ${timeout/1000} seconds`}`,
  //     type: "LISTENING" }
  // })
  // .then(winston.verbose('updated bot status')).catch(winston.error);
  // client.user.setStatus('afk');

  winston.info(`RESTARTING BOT${(timeout ==0)?'':` in ${timeout/1000} seconds`}, reason:` + (reason != undefined)?reason:'no reason given');

  if (false) {//notify all voiceChannel users with a short message
    var broadcast = client.createVoiceBroadcast();
    await client.voiceConnections.forEach(async (connection) =>{
      connection.playBroadcast(broadcast);
    });
    broadcast.playFile(`Sounds/`);
  }

  if (timeout > 0) {
    client.rebooting = {
        'abort': abortRestart,
        'timer':setTimeout(rebootBot, timeout),
        'reason': reason,
        'timestamp': new Date,
        'timeout': timeout,
        'timeleft': function(){
            return (new Date).getTime() - (this.timestamp).getTime();
        }
  };
  } else {
    // rebootBot();
    console.log("bot tried to restart without timeout");
    console.log("timeout defined: " + timeout)
  }
  return true;
}

function rebootBot(){
  const { spawn } = require('child_process');
  const subprocess = spawn(process.argv[0], [`../bot.js`], {
    detached: true,
    // stdout: process.stdout,
    // stdio: 'inherit'
    stdio: ['ignore', 'ignore', 'ignore']
  });
  if (subprocess == undefined) {
    winston.info("Couldn't restart bot");
    return;
  }
  if (subprocess.connected) {
    winston.info('disconnecting subprocess');
    subprocess.disconnect();
  }
  subprocess.unref();
  process.exit();
}

module.exports = {
  "winston": winston,
  "restart": restart,
  "abortrestart": abortRestart,
};
