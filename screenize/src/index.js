const { app, BrowserWindow,Tray, Menu } = require('electron');
const path = require('path');  
const notifier = require('node-notifier');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Screen Recorder',
    webPreferences:{
      nodeIntegration:true,
      devTools: false
    },
    icon: path.join(__dirname, 'sm-logo.png')
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
 
  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
  

  const tray = new Tray(path.join(__dirname, 'sm-logo.png'));
 
  mainWindow.on('minimize',function(event){
    event.preventDefault();
    notifier.notify({
      title:'Notification', 
      message: 'Recroding screen in background',
      icon: path.join(__dirname, 'sm-logo.png'),  // Absolute path 
      sound: true,  // Only Notification Center or Windows Toasters
      wait: true  
    }, (err, response) => {
      // Response is response from notification
   });
    mainWindow.hide(); 

    tray.on('click', () =>{
      mainWindow.show();
    }); 
tray.setTitle('Screen Recorder app'); 
});


};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});



// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
