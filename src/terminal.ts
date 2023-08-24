import { Terminal } from 'xterm';
import { pluginName } from './constants';

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

    term.onKey(e =>{
        /*
            esc = 27
            回车 = 13
            上下左右 = 37,38,39,40
        */
        var cmd = ''
        let code = e.domEvent.code;
        // console.log(code, typeof code)
        if (code === 'Enter'){
            term.write(e.key + '\n')
            console.log('cmd:',cmd)
            cmd = ''
        }else if (code === 'Backspace') {
            term.write('\b \b')
            cmd = cmd.substring(0,cmd.length-1)
        } else{
            cmd = cmd + e.key
            term.write(e.key)
        }
    }) 
}