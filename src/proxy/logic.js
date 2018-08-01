const electron = window.require('electron');

export const isPortAvailable = port => new Promise((resolve, reject) => {
  resolve(true);
  // fetch(`http://localhost:${port}`).then(() => resolve(false)).catch(() => resolve(true));
});

export const startProxy = ({ commands, port, onStdout, onStderr, onClose }) => {
  const { spawn } = electron.remote.require('child_process');
  
  const commandArgs = commands || {comman: 'python', args: ['gesher', '-c', port]};
  const proxy = spawn(commandArgs.command, commandArgs.args);

  proxy.stdout.on('data', onStdout);
  proxy.stderr.on('data', onStderr);
  proxy.on('close', onClose);

  return proxy;
}

/*
 * @param {String} gesherDirectoryPath optional - ABSOLUTE Path to gesher dir
 */
export const searchForGesher = gesherDirectoryPath => {
  const process = electron.remote.require('process');
  const fs = electron.remote.require('fs');
  const path = electron.remote.require('path');
  const SERVER_FILES = ['ServerEcho.py', 'ServerEcho.pyc'];

  // If a path was specified, check
  if (gesherDirectoryPath) {
    try {
      fs.readdirSync(gesherDirectoryPath).find(f => SERVER_FILES.includes(f));
      return gesherDirectoryPath;
    } catch (e) {
      throw new Error('Specified gesher path does not exist');
    }
  }

  const files = [];

  // Paths to look for Gesher in
  const paths = [
    process.cwd(),
    path.join(process.cwd(), '..'),
    path.join(process.cwd(), '..', 'virtual-gesher-plada'),
  ];
  
  for (const curPath of paths) {
    if (!fs.existsSync(curPath)) {
      continue;
    }

    fs.readdirSync(curPath).forEach(file => {
      files.push({curPath, filePath: path.join(curPath, file)});
    })
  }

  const serverFilePath = files.find(file => !!SERVER_FILES.find(wantedFile => file.filePath.includes(wantedFile))); 

  if (!serverFilePath) {
    throw new Error('Could not find Gesher directory. Try specifying a path to ServerEcho.pyc');
  }

  return serverFilePath.curPath;
}

export const searchForProxyConf = gesherDirectoryPath => {
  const path = electron.remote.require('path');
  
  // Called when gesher was found
  const proxyConfPath = path.join(gesherDirectoryPath, 'conf');

  try {
    return search(gesherDirectoryPath, proxyConfPath, 'proxy_conf.json');
  } catch (e) {
    throw new Error('Could not find Proxy conf file.');
  }
}

export const uploadProxyConf = gesherDirectory => {
  const {dialog} = electron.remote;  
  const path = electron.remote.require('path');
  
  // the user's selected file
  const file = dialog.showOpenDialog({ properties: ['openFile'], filters: [{name: '', extensions: ['json']}] });

  if (!file) return;

  const confDir = path.join(gesherDirectory, 'conf');

  // copy selected json schema to directory, renaming to json_schema.json
  copyAndReplace(file, confDir, 'proxy_conf.json'); 
}

export const searchForHttp = gesherDirectoryPath => {
  const path = electron.remote.require('path');
  
  // Called when gesher was found
  const httpPath = path.join(gesherDirectoryPath, 'conf', 'http_configs');

  try {
    // Simply search for http conf files. If it does not exist, an error will be thrown
    search(gesherDirectoryPath, httpPath);
  } catch (e) {
    throw new Error('Could not find configuration files.');
  }
}

export const uploadHttp = gesherDirectory => {
  const {dialog} = electron.remote;  
  const path = electron.remote.require('path');
  
  // the user's selected files
  const files = dialog.showOpenDialog({ properties: ['multiSelections', 'openFile'], filters: [{name: '', extensions: ['txt']}] });

  if (!files) return;

  // copy selected files from source to target 
  copyAndReplace(files, path.join(gesherDirectory, 'conf', 'http_configs'));
}

/*
 * @param {String} the root backend directory
 */
export const searchForXsd = gesherDirectoryPath => {
  const path = electron.remote.require('path');
  
  // Called when gesher was found
  const xmlPath = path.join(gesherDirectoryPath, 'env', 'xml', 'schemas');

  try {
    return search(gesherDirectoryPath, xmlPath, 'proxy.xsd');
  } catch (e) {
    throw new Error('Could not find proxy.xsd');
  }
}

export const uploadXsd = gesherDirectory => {
  const {dialog} = electron.remote;  
  const path = electron.remote.require('path');
  
  // the user's selected files
  const files = dialog.showOpenDialog({ properties: ['multiSelections', 'openFile'], filters: [{name: '', extensions: ['xsd']}] });

  if (!files) return;

  const schemasDir = path.join(gesherDirectory, 'env', 'xml', 'schemas');
  
  // TODO: Deleting the folder every time might not be best.. Consult about this
  deleteFolderContent(schemasDir).then(paths => {
    if (!paths) {
      throw new Error('Could not delete folder content');
    }

    // copy selected files from source to target 
    copyAndReplace(files, path.join(gesherDirectory, 'env', 'xml', 'schemas'));
  });
}

export const uploadJson = gesherDirectory => {
  const {dialog} = electron.remote;  
  const path = electron.remote.require('path');
  
  // the user's selected file
  const file = dialog.showOpenDialog({ properties: ['openFile'], filters: [{name: '', extensions: ['json']}] });

  if (!file) return;

  const schemasDir = path.join(gesherDirectory, 'env', 'json', 'schemas');

  deleteFolderContent(schemasDir).then(paths => {
    if (!paths) {
      throw new Error('Could not delete folder content');
    }
    
    // copy selected json schema to directory, renaming to json_schema.json
    copyAndReplace(file, schemasDir, 'json_schema.json'); 
  });
}

const deleteFolderContent = folderToDelete => {
  const del = electron.remote.require('del');
  const path = electron.remote.require('path');

  return del([path.join(folderToDelete, '*')], {force: true});
}

export const searchForJson = (gesherDirectoryPath) => {
  const path = electron.remote.require('path');
  
  // Called when gesher was found
  const jsonPath = path.join(gesherDirectoryPath, 'env', 'json', 'schemas');

  try {
    return search(gesherDirectoryPath, jsonPath, 'json_schema.json');
  } catch (e) {
    throw new Error('Could not find json_schema.json');
  }
}

const search = (gesherDirectoryPath, pathToSearch, fileToFind) => {
  const fs = electron.remote.require('fs');
  const path = electron.remote.require('path');

  if (!gesherDirectoryPath) {
    throw new Error('Missing gesher path');
  }
  const files = fs.readdirSync(pathToSearch);

  // If a specific file was requested, return the path
  if (fileToFind) {
    const file = files.find(f => f.includes(fileToFind));
    return path.join(gesherDirectoryPath, file);
  }

  // Otherwise, all files in folder
  return files.map(f => path.join(gesherDirectoryPath, f))
}

const copyAndReplace = (filesToCopy, target, optionalTargetFileName) => {
  const fs = electron.remote.require('fs');
  const path = electron.remote.require('path');


  for (const file of filesToCopy) {
    // parse file name
    const filename = file.split('/')[file.split('/').length - 1];
    // copy
    fs.createReadStream(file).pipe(fs.createWriteStream(path.join(target, optionalTargetFileName || filename)));
  }
}

export const openFileDialog = cb => () => {
  const {dialog} = electron.remote;  

  dialog.showOpenDialog({
    properties: ['openDirectory']
  }, cb)
}

export const createMarkup = (gesherDirectory) => {
  const fs = electron.remote.require('fs');
  const path = electron.remote.require('path');
  
  try {
    const logsPath = path.join(gesherDirectory, 'logs', 'log.html');
    const logsFile = fs.readFileSync(logsPath, {encoding: 'utf8'});      
    return {__html: `<table>${logsFile}</table>`}
  } catch (e) {
    throw new Error('Could not read log.html file.');
  }
}

export const initWatcher = (gesherDir, onFileChange) => {
  const chokidar = electron.remote.require('chokidar');
  const path = electron.remote.require('path');

  // prepare log path
  const logPath = path.join(gesherDir, 'logs', 'log.html');
  
  const watcher = chokidar.watch(logPath);
  watcher.on('change', onFileChange);
}