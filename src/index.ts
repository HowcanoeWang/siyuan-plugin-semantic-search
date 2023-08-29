import {
    Plugin,
    showMessage,
    confirm,
    Dialog,
    Menu,
    openTab,
    adaptHotkey,
    getFrontend,
    getBackend,
    IModel,
    Setting,
    fetchPost,
    Protyle
} from "siyuan";
import "./index.scss";

import * as cst from './constants'
import { nodepkg } from "./constants";

import * as fileTool from "./fileTool";
import { debug } from "./notice";
import * as terminal from "./terminal";
import * as websocket from "./websocket";

const STORAGE_NAME = "menu-config";
const TAB_TYPE = "custom_tab";
const DOCK_TYPE = "dock_tab";

window.sython = {
};

export default class Sython extends Plugin {

    private customTab: () => IModel;
    private isMobile: boolean;

    onload() {
        // todo: add /envs/ to syncignore file
        for (var folder of [cst.pyDownDir, cst.sythonLogDir]) {
            if (!nodepkg.fs.existsSync(folder)) {
                nodepkg.fs.mkdirSync(folder, { recursive: true });
                debug(`已创建文件夹：${folder}`);
            } else {
                debug(`文件夹已存在：${folder}`);
            }
        }

        terminal.loadXterm();

        websocket.keepConnected();

        this.data[STORAGE_NAME] = {readonlyText: "Readonly"};

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        // 图标的制作参见帮助文档
        this.addIcons(cst.diyIcon.searchPeople);

        this.customTab = this.addTab({
            type: TAB_TYPE,
            init() {
                this.element.innerHTML = `
<div class="plugin-sample__custom-tab" style="flex-direction: column">
    <h1 style="margin-bottom: 30px;">Press Shift + Alt + F to open this tab</h1>
    <div id="terminal"></div>
</div>`;
                terminal.initXterm();
            },
            beforeDestroy() {
                debug("before destroy tab:", TAB_TYPE);
            },
            destroy() {
                debug("destroy tab:", TAB_TYPE);
            }
        });

        this.addCommand({
            langKey: "showTermainal",
            hotkey: "⇧⌘\`",
            callback: () => {
                this.showTab();
            }
        });

        debug(this.i18n.helloPlugin);

        // 可以把windown.siyuan.python.path 也添加到环境变量里
    }

    async onLayoutReady() {
        this.loadData(STORAGE_NAME);
        debug(`frontend: ${getFrontend()}; backend: ${getBackend()}`);

        // download python 
        var osinfo = getBackend();
        var arch = nodepkg.os.arch();

        debug(osinfo, arch);

        var downURL = undefined;

        var key:string = `${osinfo}_${arch}`
        if (cst.pyURL.hasOwnProperty(key)) {
            downURL = cst.pyURL[key];
        } else {
            debug(`No python version available for ${key}`);
        }

        const zipFilePath = nodepkg.path.join(cst.pyDownDir, 'python.zip')
        // 下载链接存在 且 zip不存在
        if (downURL && !nodepkg.fs.existsSync(zipFilePath)) {
            // download with progress
            debug(downURL, zipFilePath);

            try {
                await fileTool.downloadFile(downURL, zipFilePath);
                debug('文件下载完成');
            } catch (err) {
                console.error('文件下载失败:', err);
            }
        }

        var extract2Path: string;

        if (cst.pluginName === 'sython') {
            extract2Path = nodepkg.path.join(cst.pyDownDir, 'base');
        } else {
            extract2Path = nodepkg.path.join(cst.pyDownDir, cst.pluginName);
        }
        
        // zip 文件存在
        if (nodepkg.fs.existsSync(zipFilePath) && !nodepkg.fs.existsSync(extract2Path)) {
            // 则使用zlib进行解压缩
            const outjs = await fileTool.unzipFile(zipFilePath, extract2Path+'/');
            debug(`[unzip] unzip '${zipFilePath}' to '${extract2Path}', code: ${outjs.code}, msg: ${outjs.msg}`);
        }

        // 尝试运行子进程
        const envDir = `${cst.dataDir}/storage/envs/base`;
        const cwd = `${cst.dataDir}/`
        const backendPy = `${cst.dataDir}/plugins/sython/scripts/backend.py`;

        let python_prefix: string = '';

        if (getBackend() === 'windows') {
            python_prefix = `${envDir}/python.exe`;
        } else {
            python_prefix = `cd ${envDir} && source ./activate.sh && chmod +x ./bin/python3.10 && cd ${cwd} && python3.10`;
        }

        // 运行websocket
        // if (window.sython.ws.readyState !== 1) {
        const todayStr = fileTool.getToday();
        var [stdout, stderr] = terminal.shellRun(
            `${python_prefix} ${backendPy}`, // command
            cwd, // cwd,
            true, // shell
            true, // detached
            false, // windowsHide
            `${cst.sythonLogDir}${todayStr}.log`// logfile
        );
        // }

    }

    onunload() {
        debug(this.i18n.byePlugin);
        // close socket
        window.sython.ws.send('exit');
    }

    private eventBusLog({detail}: any) {
        debug(detail);
    }

    private showTab() {
        const tab = openTab({
            app: this.app,
            custom: {
                icon: "searchPeople",
                title: "Semantic Search",
                // id: this.name + TAB_TYPE
                fn: this.customTab
            },
        });
        debug(tab);
    }
}