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
import download from 'download';

import * as cst from './constants'

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
                console.log("before destroy tab:", TAB_TYPE);
            },
            destroy() {
                console.log("destroy tab:", TAB_TYPE);
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

        console.log(this.i18n.helloPlugin);
    }

    async onLayoutReady() {
        this.loadData(STORAGE_NAME);
        console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);

        // download python 
        const os = (window as any).require('os');
        var osinfo = getBackend();
        var arch = os.arch();

        console.log(osinfo, arch);

        var downURL = undefined;

        var key:string = `${osinfo}_${arch}`
        if (cst.pyURL.hasOwnProperty(key)) {
            downURL = cst.pyURL[key];
        } else {
            console.log(`No python version available for ${key}`);
        }

        // 下载链接存在
        if (downURL) {
            // download with progress
            const fs  = (window as any).require('fs');
            const https = (window as any).require('https');
            const path = (window as any).require('path');

            const filePath = path.join(cst.pyDownDir, 'python.zip');

            console.log(downURL, filePath);

            const downloadFile = (url: string, dest: string) => {
                return new Promise<void>((resolve, reject) => {
                  const file = fs.createWriteStream(dest);
              
                  const options = {
                    followRedirect: true,
                  };
              
                  https.get(url, options, (response) => {
                    if (response.statusCode === 200) {
                      response.pipe(file);
              
                      file.on('finish', () => {
                        file.close();
                        resolve();
                      });
                    } else if (response.statusCode === 302) {
                      const redirectUrl = response.headers.location;
                      console.log('重定向链接:', redirectUrl);
              
                      downloadFile(redirectUrl, dest)
                        .then(resolve)
                        .catch(reject);
                    } else {
                      reject(new Error(`下载失败，状态码：${response.statusCode}`));
                    }
                  }).on('error', (err) => {
                    fs.unlink(dest, () => {
                      reject(err);
                    });
                  });
                });
              };
              
              (async () => {
                try {
                  await downloadFile(downURL, filePath);
                  console.log('文件下载完成');
                } catch (err) {
                  console.error('文件下载失败:', err);
                }
              })();
        }
    }

    onunload() {
        console.log(this.i18n.byePlugin);
    }

    private eventBusLog({detail}: any) {
        console.log(detail);
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
        console.log(tab);
    }
}