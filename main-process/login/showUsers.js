const {ipcMain} = require('electron')
const loki = require("lokijs");
const path = require('path');
const database = require(path.resolve(__dirname, "../../database"));

ipcMain.on('readAllUsers',(event,args)=>{
  var users = database.readAllUsers();
  if(users.length==0){
    event.sender.send('foundUsers',null)
  }else{
    event.sender.send('foundUsers',users);
  }
  console.log(args)
  /*var sql = "SELECT * FROM `users`";
  var nams = [];
  var permis = [];
  connection.query(
    sql, 
    function(err, rows){
      if(rows === undefined){
        event.sender.send('foundUsers',null)
      }else{
        for(i = 0; i < rows.length; i++){
          nams[i] = rows[i].username;
          permis[i] = rows[i].admin;
        }
        var packet = {nams,permis}
        event.sender.send('foundUsers',packet);
      }
    }
  );*/
})
