import { nodepkg, Response } from "./constants";
import * as cst from "./constants";
import { debug, error } from "./notice";

export const downloadFile = (url: string, dest: string) => {
    // chatgpt 生成的，能跑但是不知道为什么能跑
    return new Promise<void>((resolve, reject) => {
        // 进度条变量
        let downloadedBytes = 0;
        let totalBytes = 0;

        // 文件IO
        const file = nodepkg.fs.createWriteStream(dest);

        // 允许重定向设置
        const options = {
            followRedirect: true,
        };
  
        // 开始解析URL
        nodepkg.https.get(url, options, (response: Response) => {
            // 需要重定向
            if (response.statusCode === 302) {
                const redirectUrl = response.headers.location;
                console.log('重定向链接:', redirectUrl);
        
                downloadFile(redirectUrl, dest)
                    .then(resolve)
                    .catch(reject);

            // 有其他的状态码报错
            } else if (response.statusCode !== 200) {
                reject(new Error(`下载失败，状态码：${response.statusCode}`));
                
            // 状态码为正常200， 开始下载
            } else {
                // 获取文件最大长度
                totalBytes = parseInt(response.headers['content-length'], 10);

                // 大文件流式传输
                response.pipe(file);

                // 如果有数据进来，则更新进度条
                response.on('data', (chunk: string | any[]) => {
                    downloadedBytes += chunk.length;
          
                    const progress = (downloadedBytes  / totalBytes) * 100;
                    console.log(`下载进度：${progress.toFixed(2)}%`);
          
                    // 更新进度条元素的数值
                    // 例如：document.getElementById('progress-bar').value = progress;
                });
        
                // 结束的时候，解除文件锁
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            }
        }).on('error', (err: any) => {
            nodepkg.fs.unlink(dest, () => {
                reject(err);
                error(err)
            });
        });
    });
};

// 解压缩文件
export async function unzipFile(zipFilePath: string, extractToPath: string) {

    async function readFileAsBlob(filePath: string): Promise<Blob> {
        try {
            // macos linux path = /user/... -> 
            // siyuan try to fetch http://127.0.0.1:50454/user/...
            // 需要转换为相对位置（但由于env没有挂在到siyuan的路径下，所以改成相对路径也不管用）
            // chatgpt 给的建议是转成file协议：`file://${path.resolve()}`
            filePath = "file://" + filePath;
            
            debug(`[unzipFile][readFileAsBlob] filePath = ${filePath}`);
            const response = await fetch(filePath);
            if (response.ok) {
                return await response.blob();
            } else {
                throw new Error(`读取文件时出错，状态码: ${response.status}`);
            }
        } catch (err) {
            throw new Error(`读取文件时出错: ${err}`);
        }
    }

    /**
     *  The code inspired from:
     *  https://github.com/leolee9086/themeEditor/blob/02c22e8651b52478fbf79e12ed1059e407ec52cf/polyfills/package.js#L34-L51
     */
    let writeFileDirectly = async (file:File, path:string) => {
        let data = new FormData();
        data.append("path", path);
        data.append("file", file);
        data.append("isDir", 'false');
        data.append("modTime", file.lastModified.toString());
        // console.log(`API put file: ${file.name}, ${path}, ${file.size}`)
        let res = await fetch("/api/file/putFile", {
            method: "POST",
            body: data,
        });
        return await res.json();
    };

    /**
     * The code inspired from:
     * https://github.com/leolee9086/themeEditor/blob/02c22e8651b52478fbf79e12ed1059e407ec52cf/polyfills/package.js#L86-L100
     */
    function flatten(filesObj: cst.zipFile[]): cst.zipFile[] {
        let flatList: cst.zipFile[] = [];
        let flat = (subObj) => {
          Object.getOwnPropertyNames(subObj).forEach((name) => {
            if (subObj[name] && subObj[name]._path) {
              flatList.push(subObj[name]);
            } else {
              flat(subObj[name]);
            }
          });
        };
        flat(filesObj);
        debug(flatList);
        return flatList;
    }

    let fileBlob = await readFileAsBlob(zipFilePath);
    let archive = await nodepkg.Archive.open(fileBlob as File);
    
    let filesObj = await archive.getFilesObject();
    debug(filesObj);

    // extract all files by fs.writeFile
    let fileArray = flatten(filesObj);
    window.fileArray = fileArray;
    debug(fileArray);

    for (let i = 0; i < fileArray.length; i++) {
        let fIdx = fileArray[i]
        // 这里可以用i来更新一下解压的进度条
        let fpath = nodepkg.path.join(extractToPath, fIdx._path);
        let apipath = turn2apiPath(fpath);

        // js package not d.ts annotation
        let file = await fIdx.extract(); 
        // console.log(file.name, fpath, apipath, file.size);

        // siyuan api to write
        let jsreturn = await writeFileDirectly(file, apipath);
        if (jsreturn.code !== 0) {
            debug(`Got problem when zipping file to ${apipath}, error code:`, jsreturn);
        }

        const progress = (i  / fileArray.length) * 100;     
        debug(`解压进度：${progress.toFixed(2)} % | API put file [${i}]: ${file.name}, ${apipath}, ${file.size}`); 
    }

};

export function turn2apiPath (fullPath: string, nodataheader:boolean=false) {
    let apipath = fullPath.replace(cst.dataDir, '')

    if (nodataheader) {
        apipath = apipath.replaceAll('\\', '/');
    } else {
        apipath = '/data' + apipath.replaceAll('\\', '/');
    }

    return apipath;
}