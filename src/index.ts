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

import * as internet from "./internet";
import { debug } from "./utils";

const STORAGE_NAME = "menu-config";
const TAB_TYPE = "custom_tab";
const DOCK_TYPE = "dock_tab";

export default class PluginSample extends Plugin {

    private customTab: () => IModel;
    private isMobile: boolean;

    onload() {
        this.data[STORAGE_NAME] = {readonlyText: "Readonly"};

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        // 图标的制作参见帮助文档
        this.addIcons(cst.diyIcon.iconLogo);

        this.customTab = this.addTab({
            type: TAB_TYPE,
            init() {
                this.element.innerHTML = `
<div class="plugin-sample__custom-tab">
    <p>Press Shift + Alt + F to open this tab</p>
</div>`;
            },
            beforeDestroy() {
                debug("before destroy tab:", TAB_TYPE);
            },
            destroy() {
                debug("destroy tab:", TAB_TYPE);
            }
        });

        this.addCommand({
            langKey: "showDialog",
            hotkey: "⇧⌥M",
            callback: () => {
                // this.showDialog();
                this.showTab();
            }
        });

        debug(this.i18n.helloPlugin);
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

        // 下载链接存在
        if (downURL) {
            // download with progress
            const filePath = nodepkg.path.join(cst.pyDownDir, 'python.zip');

            debug(downURL, filePath);

            try {
                await internet.downloadFile(downURL, filePath);
                debug('文件下载完成');
            } catch (err) {
                console.error('文件下载失败:', err);
            }
        }
    }

    onunload() {
        debug(this.i18n.byePlugin);
    }

    private eventBusLog({detail}: any) {
        debug(detail);
    }

    private showTab() {
        const tab = openTab({
            app: this.app,
            custom: {
                icon: "iconLogo",
                title: "Semantic Search",
                // id: this.name + TAB_TYPE
                fn: this.customTab
            },
        });
        debug(tab);
    }
}