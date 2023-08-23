import {Terminal} from "./xterm.js/xterm.js"

export function loadXterm() {
    // 添加<link>
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = "./plugins/siyuan-plugin-semantic-search/xterm.js/xterm.css";
    document.head.appendChild(link);

    // 添加<script>
    // const script = document.createElement('script');
    // script.src = "./plugins/siyuan-plugin-semantic-search/xterm.js/xterm.js";
    // document.head.appendChild(script);
}

export function initXterm() {
    var term = new Terminal({
        cursorBlink: true,
    });
    term.open(document.getElementById('terminal'));
    term.writeln('SiYuan XTerm [Ver 0.0.1]')
    term.write('SY \x1B[1;3;31m~\x1B[0m $ ')
}