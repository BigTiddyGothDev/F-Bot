var {winston, db} =  require("./logger.js"); // lol
const fetch = require("node-fetch");
var auth = require("./auth.json");

var config = {
    api:{
        "apiBaseUrl":"https://www.f-list.net/json/",
        "endpoints":{
            "getApiTicket":"getApiTicket.php",
            "kinklist":"kink-list.php",
            "infolist":"info-list.php",
            "addbookmark":"api/bookmark-add.php",
            "listbookmark":"api/bookmark-list.php",
            "removebookmark":"api/bookmark-remove.php",
            "profile":"api/character-data.php"
        }
    },
    fchat:{
        options:{
            // "debug":true,
            "joinOnInvite":false,
            "autoPing":true
        },
        client:{
            "name":auth.botname
        },
        // url:"wss://chat.f-list.net:9722" //unencrypted actual chat
        // url:"wss://chat.f-list.net:9799" //TLS encrypted actual
        // url:"wss://chat.f-list.net:8799" //TLS encrypted dev
        // url:"wss://chat.f-list.net:8722" //unencrypted dev
        url:"wss://chat.f-list.net/chat2"
    }
};
var auth = require("./auth.json");

const Fchat = require("lib-fchat/lib/Fchat");
var client = new Fchat(config);
client.version="1.0.0";

client.onOpen(ticket => {
    winston.info(`Websocket connection opened. Identifying with ticket: ${ticket}`);
});

client.on("IDN", () => {
    winston.info(`Identification as ${client.user.character} Successful!`);
});

const { URLSearchParams } = require('url');
async function sendApiRequest(url, body){
    const params = new URLSearchParams();
    Object.keys(body).forEach(k=>{
        params.append(k, body[k]);
    });
    return await fetch(client.config.api.apiBaseUrl + url, {method:"POST", body: params});
}

async function acquireTicket(){

    const params = new URLSearchParams();
    params.append('account', auth.user);
    params.append('password', auth.password);
    params.append('no_bookmarks', true);
    params.append('no_characters', true);
    params.append('no_friends', true);
    try{
        return await fetch('https://www.f-list.net/json/getApiTicket.php', { method: 'POST', body: params })
            .then(res => res.json()) // expecting a json response
            .then(json => {
                console.log(json);
                if(json.ticket) return json.ticket;
                // winston.silly(json);
            });
    } catch(err){
        winston.log(err);
    }
    winston.error("Ticket acquisition unsuccessful");
    return;
}



client.ticket={
    "timestamp":0,
    "current": undefined,
    "get": async function get(){
        if(client.ticket.current == undefined){
            winston.info("Getting first ticket");
            //pass other if to update ticket
        }else if(new Date - client.ticket.timestamp < 1500000) { // is valid for 30min, but updated after 25min
            winston.info("Ticket still up to date");
            return client.ticket.current;
        }

        winston.info("Getting new Ticket");
        client.ticket.current = undefined;
        client.ticket.current = await acquireTicket();
        // if(client.ticket.current == undefined){
        //     while(true){
        //         winston.debug("trying for new Ticket...");
        //         await setTimeout(async ()=>{
        //             client.ticket.current = await acquireTicket().then();
        //         }, 5000);
        //     }
        // }

        client.ticket.timestamp = new Date;
        return client.ticket.current;
    }
};


var zlib = require('zlib');
const gzip = zlib.createGzip();
const through2 = require('through2');

const toJSON = (objs) => {
    // let objs = [];
    return through2.obj(function(data, enc, cb) {
        objs.push(data);
        cb(null, null);
    }, function(cb) {
        console.log(this.toString());
        this.push(JSON.stringify(objs));
        cb();
    });
};

client.api={
    "getProfile": async function getProfile(name){
        return sendApiRequest(client.config.api.endpoints.profile, {"name": name}).then(r=>{
            if(r && r.body.readable){
                // Buffer.from(r.body)

                var final=[];
                try{ //.pipe(toJSON(final))
                    console.log(r.body.pipe(gunzip));
                    // .once("end", ()=>{
                    //     final.toString(console.log());
                    //     return final.toString();
                    // });
                } catch(err){console.log(err)}
            } else winston.error("Couldn't read response");
        });
    }
};

client.reconnect = async function(){
    try {
        winston.debug("Trying to connect");
        client.ticket.get().then( t=> {
            console.log(
                client.connect(auth.user, auth.password, auth.character, t)
            )
        });
    }
    catch(err){
        console.log(err);
    }
    client.setStatus("I am a bot, please ignore me!", "busy");
};

client.prefix = '!';
client.privateDisabled = true;

module.exports = client;
require('./clientcommands.js'); //takes the exported client and adds commands to it.
