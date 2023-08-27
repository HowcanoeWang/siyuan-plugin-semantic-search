import { Terminal } from 'xterm';
import { pluginName } from './constants';
import { debug } from './notice';

export function loadXterm() {
    // 添加<link>
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `./plugins/${pluginName}/xterm.js/xterm.css`;
    document.head.appendChild(link);

    // 添加<script>
    const script = document.createElement('script');
    script.src = `./plugins/${pluginName}/xterm.js/xterm.js`;
    document.head.appendChild(script);
}

export function initXterm() {
    var term = new Terminal({
        cursorBlink: true,
    });
    term.open(document.getElementById('terminal'));
    term.writeln('SiYuan XTerm [Ver 0.0.1]');
    term.write('SY \x1B[1;3;31m~\x1B[0m $ ');

    const socket = new WebSocket("ws://localhost:8765");

    socket.onmessage = (event) => {
        term.write(event.data);
    }

    var cmd = ''
    term.onKey(e =>{
        let code = e.domEvent.code;
        if (code === 'Enter'){
            console.log('cmd:',cmd);
            socket.send(cmd);
            cmd = '';
            term.write(e.key + '\nSY \x1B[1;3;31m~\x1B[0m $ ');
        }else if (code === 'Backspace') {
            term.write('\b \b');
            cmd = cmd.substring(0, cmd.length-1);
        } else{
            cmd = cmd + e.key;
            term.write(e.key);
        }
    }) 
}

export function shellRun(command: string, cwd: string, shell: boolean = true) {
    const {spawn}  = (window as any).require('child_process');
    let spawnObj;

    debug(`[shellRun] ${command} @ ${cwd}`);

    spawnObj = spawn(command, {cwd: cwd, shell: shell});

    let stdout: string = '';
    let stderr: string = '';
    
    spawnObj.stdout.on('data', function(data: any) {
        let outStr = data.toString()
        stdout += `\n${outStr}`
        debug(`[Shell][Info]${outStr}`);
    });
    spawnObj.stderr.on('data', (data: any) => {
        let outStr = data.toString()
        stderr += `\n${outStr}`
        debug(`[Shell][Error]${outStr}`);
    });
    spawnObj.on('close', function(code: string) {
        console.log('close code : ' + code);
    })
    spawnObj.on('exit', (code: any) => {
        console.log(`child process exited with code ${code}`);
    });

    return [stdout, stderr];
}