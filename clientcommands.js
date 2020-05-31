var client = require('./client.js');
var {winston, db} = require('./logger.js');

client.getChannels = async function(){

}

client.sendMessage = async function(recipient, message){
    client.send("PRI", {recipient, message});
};

client.setStatus = async function(statusmsg, status){
    client.send("STA", {
        "status": status || "online", //"online", "looking", "busy", "dnd", "idle", "away", and "crown"(don't use!)
        "statusmsg": statusmsg || "",
        "character": client.user.character
    });
};

client.joinRoom = async function(room) {
	client.send("JCH", {
		"channel": room
	});
}

client.sendPublic = async function(room, message) {
	winston.info(message);
	client.send("MSG", {
		"channel": room,
		"message": message
	});
}

client.joinRoom("ADH-a2cf260506fca7bff216") // Mystery Magic
client.setStatus("I am a bot for [session=Mystery Magic (Vore, Transformation)]adh-a2cf260506fca7bff216[/session], please ignore me!", "busy")
