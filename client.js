var socket = require('socket.io-client')('https://lit-chat-v0.herokuapp.com/'); // or http://localhost:3000/ for local use but we have already hosted server side on heruko
const repl = require('repl')
const tr = require("googletrans").default;
const chalk = require('chalk');
var username = null;
var room = null;
var language = null;
var emoji = require('node-emoji')
const Audic = require("audic")
const showBanner = require('node-banner')
var sound = true;
socket.on('disconnect', function () {
    socket.emit('disconnect')
});

socket.on('connect', () => {
    process.stdout.write(chalk.cyanBright("Enter Username :")+" ");
})

socket.on('message', (data) => {
    const { text, user } = data
    if(user.toLowerCase()==="admin"){
        tr("Admin" + ':' + text.split('\n')[0], language)
        .then(function (result) {
            if(sound) {
                new Audic("admin_notification.mp3").play()
            }
            console.log(chalk.keyword('orange').bold.italic(result.text.split(':')[0])+" : "+chalk.rgb(234, 242, 248 ).italic(result.text.split(':')[1]));
        })
    } else {  
        tr(user, language)
        .then(function (userResult) {
            tr(text, language)
            .then(function (msgResult) {
                if(sound){
                    new Audic("msg_notification.mp3").play()
                }
                console.log(chalk.cyanBright.bold.italic(userResult.text)+" : "+chalk.rgb(234, 242, 248 ).italic(msgResult.text));
            })
        })
    }
})


socket.on('roomData', (data) => {
    const { users } = data
    var userList = [];
    users.map((user)=>{userList.push({'Users' : user.name})});
    tr("Participants in this room", language)
        .then(function (result) {
            console.log("\n"+chalk.cyanBright.bold(result.text));
            console.table(userList);
        })

    
})

socket.on('error', (data) => {
    tr(data.error, language)
        .then(function (result) {
            console.log(chalk.redBright.bold(result.text));
            process.exit(1);
        })
})

showBanner('< L . I . T . Chat >', "\tWhere language isn't a barrier in your communication!  \n\t      --- Made with ❤️  by Sumit and Alkesh --- \n",'red', 'blue')

repl.start({
    prompt: '',
    eval: (text) => {
        if(username==null){
            username = text;
            if(username.trim().toLowerCase()==="admin"){
                console.log(chalk.redBright.bold(emoji.emojify(":warning: Sorry,this username is not allowed!")));
                process.exit(1);
            }
            if(username.trim().toLowerCase()===""){
                console.log(chalk.redBright.bold(emoji.emojify(":warning:  Please enter a username first!!")));
                process.exit(1);
            }
            process.stdout.write(chalk.cyanBright("Enter Room ID :")+" ")
        }else if(room==null){
            room = ""+text;
            if(room.trim().toLowerCase()===""){
                console.log(chalk.redBright.bold(emoji.emojify(":warning: Please enter a room id first!")));
                process.exit(1);
            }
            process.stdout.write(chalk.cyanBright("Enter Your Preffered Language :")+" ")
        }else if(language==null){
            language = text.trim();
            socket.emit('join',{name:username, room:room})
            tr(emoji.emojify("\n:star: ~~~ start your communication ~~~ :star:\n"), language)
                .then(function (result, err) {
                    console.log(chalk.rgb(240, 178, 122)(result.text));
                }).catch(function (error) {
                        console.log(chalk.redBright.bold(emoji.emojify(":warning: Sorry,this language is invalid!")));
                        process.exit(1);
                  });
        }else if(text.trim().toLowerCase()==="show users"){
            socket.emit('getRoomData');     
        }else if(text.trim().toLowerCase()==="exit chat"){
            tr("Have a good day!", language)
            .then(function (result) {
                console.log(chalk.cyanBright.bold(result.text));
                process.exit(1);
            })
        }else if(text.trim().toLowerCase()==="toggle sound"){
            sound = !sound; 
            if(sound){
                tr("\nSound is turned on!", language)
                .then(function (result) {
                    console.log(chalk.greenBright(result.text));
                })
            } else {
                tr("\nSound is turned off!", language)
                .then(function (result) {
                    console.log(chalk.redBright(result.text));
                })
            }
        }
        else {
            socket.emit('sendMessage', emoji.emojify(text));
        }
    }
})
