const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const magicAdapter = new FileSync('./dbs/magic.json');  //Note this got changed haha
const magicdb = low(magicAdapter);

const combAdapter = new FileSync('./dbs/combinations.json');
const combdb = low(combAdapter);

var magicDBkeys = magicdb.keys().value();
var combDBkeys = combdb.keys().value();

module.exports = {
    "CommandArray":[
		{
            "name":"addmagic",
            "desc":"adds magic to the given category",
			"adminOnly":true,
            "private":true,
            "run": async function run(client, msg, args){
				if (!args[0] || !args[1]) {
					client.sendMessage(msg.character, "Usage: !addmagic <category> <text>");
					return;
				}
				var category = args.shift();
				var newidea = args.join(' ');
				magicdb.get(category).push(newidea).write();
				client.sendMessage(msg.character, `Successfully added "${newidea}" to the collection of suggestions in ${category}. There are now ${magicdb.get(category).size()} entries in there!`);
            }
        },
		{
			"name": "help",
			"desc": "describes usage of the bot",
			"public": true,
			"run": async function run(client, msg, args) {
				client.sendPublic(msg.channel, "Say !magic <adjective> to drink a random magical potion! The adjective's descriptions are on this bot's profile.");
			}
		},
		{
			"name": "magic",
			"desc": "gives back a random magical effect",
			"public": true,
			"run": async function run(client, msg, args) {
				if (args.length === 0) {
					client.sendPublic(msg.channel, "usage: !magic <adjective>, where adjective is one of these: " + magicDBkeys.join(', '));
					return;
				}
				if (args[0] === "cocktail") {
					args = magicDBkeys;
				}
				let options = [];
				let badArgs = [];
				args.forEach(function(adjective) { 
					if (adjective.trim().length === 0)
						return;
					adjective = adjective.toLowerCase();
					if (!magicDBkeys.includes(adjective)) {
						badArgs.push(adjective);
						return;
					}
					if (combDBkeys.includes(adjective)) {
						combdb.get(adjective).keys().value().forEach(function (otherAdj) {
							if (args.includes(otherAdj)) {
								options.push(...combdb.get(adjective).get(otherAdj).value());
							}
						});
					}
					options.push(...magicdb.get(adjective).value())
				});
				if (badArgs.length) {
					let prefix = (badArgs.length === 1) ? " is not a valid adjective, " : " are not valid adjectives, ";
					client.sendPublic(msg.channel, badArgs.join(', ') + prefix + "please try one of these available ones: " + magicDBkeys.join(', '));
					return;
				}
				client.sendPublic(msg.channel, "You drink the " + args.join(' ') + " potion: " + options[Math.floor(Math.random() * options.length)]);
			}
		}
    ]
}
