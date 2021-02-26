
const { ipcRenderer } = require('electron');
const user_table = document.getElementById('users-table-list').getElementsByTagName('TBODY')[0];
const loki = require("lokijs");
const path = require('path');
const database = require(path.resolve(__dirname, "../../database"));

const loadUsersMsgBtn = document.getElementById('loadUsers-msg')

loadUsersMsgBtn.addEventListener('click', () => {
  ipcRenderer.send('readAllUsers',user_table)
});

ipcRenderer.on('foundUsers',(event,args)=>{
  if(args==null){
  }else{
    delete_table_values();
    fill_table_users(args,user_table)
    /*var nams = args.nams;
    var permis = args.permis;
    for(var i=0; i<nams.length; i++){
      var table_row = user_table.insertRow(i);
      var cell = table_row.insertCell(0);
      cell.innerHTML = nams[i];
      var cell = table_row.insertCell(1);
      if(permis[i]==1){
        cell.innerHTML = "yes";
      }else{
        cell.innerHTML = "no";
      }
    }*/
  }
})

function delete_table_values() {
  try {
    if (user_table !== null) {
       var table_rows_length = user_table.getElementsByTagName("tr").length;
        r = 0;
        while (table_rows_length != 0) {
          user_table.deleteRow(r);
          table_rows_length = table_rows_length - 1;
        }
     }
  } catch (error) {
    console.log(error.message);
  }
}

function fill_table_users(user_list, specific_table) {
    console.log('status: ' + database.getStatus());
    try {
        if (!user_list) {
            console.log('The returned list of participants is empty');
            console.log('updated ' + user_list.length);
        } else {
            console.log("Number of patients: " + user_list.length);
            for (var i = 0; i < user_list.length; i++) {
                //data
                var table_row = specific_table.insertRow(i);
                var cell = table_row.insertCell(0);
                cell.innerHTML = user_list[i].username;
                var cell = table_row.insertCell(1);
                cell.innerHTML = user_list[i].admin;
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}
