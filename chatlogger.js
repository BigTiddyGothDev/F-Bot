const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('./dbs/chatlog.json');
const chatlog = low(adapter);


var numOfDaysToKeep = 3;
// set a timer to delete all logs that are older than 2 days
function deleteOld(){
    var today = new Date().getDate();
}

deleteOld();
setInterval(deleteOld(), 24*60*60*1000); //delete old logs after a day
