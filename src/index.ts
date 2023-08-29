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
    IPluginDockTab,
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

    private sytermDock: { config: IPluginDockTab; model: IModel; };
    private isMobile: boolean;

    onload() {
        this.data[STORAGE_NAME] = {readonlyText: "Readonly"};

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        // 图标的制作参见帮助文档
        this.addIcons(cst.diyIcon.searchPeople);
        this.addIcons(cst.diyIcon.syterm);

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

        this.sytermDock = this.addDock({
            config: {
                position: "BottomLeft",
                size: {width:0, height:300},
                icon: "syTerm",
                title: this.i18n.syterm
            },
            data: {
                text: "SyTerm"
            },
            type: DOCK_TYPE,
            init() {
                this.element.innerHTML = `
<div class="fn__flex-1 fn__flex-column syterm">
  <div class="composite title">
    <div class="composite-bar panel-switcher-container">
      <div class="action-bar">
        <ul class="actions-container" role="tablist">
          <li class="action-item" role="tab" draggable="true" aria-label="" aria-expanded="true" aria-selected="true" tabindex="0">终端</li>
          <li class="action-item" role="tab" draggable="true" aria-label="" aria-expanded="true" aria-selected="true" tabindex="0">Sython</li>
          <li class="action-item" role="tab" draggable="true" aria-label="" aria-expanded="true" aria-selected="true" tabindex="0">设置</li>
        </ul>
      </div>
    </div>
    <div class="title-actions"></div>
    <div class="global-actiions"></div>
  </div>

  <div class="content" style="padding-left:18px; padding-right:18px;">
    <div id="terminal"></div>
  </div>
</div>`;
                terminal.initXterm();
            },
            destroy() {
                debug("destroy tab:", TAB_TYPE);
            }
        })

        // this.addCommand({
        //     langKey: this.i18n.showTerminal,
        //     hotkey: "⇧⌘\`",
        //     callback: () => {
        //         this.showTab();
        //     }
        // });

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
}