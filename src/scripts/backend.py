import sys
import subprocess
import importlib.util
import asyncio
import time
# import pty
# import os

def wsprint(*args):
    print(*args)
    sys.stdout.flush()

welcome_str = '$$ Sython Console Backend $$'
welcome_bar = '$' * len(welcome_str)
wsprint(f'\n\n{welcome_bar}\n{welcome_str}\n{welcome_bar}\n')

# check if websocket is installed
ws = 'websockets'
if ws in sys.modules:
    wsprint(f"{ws!r} already in sys.modules")
elif (spec := importlib.util.find_spec(ws)) is not None:
    # If you choose to perform the actual import ...
    module = importlib.util.module_from_spec(spec)
    sys.modules[ws] = module
    spec.loader.exec_module(module)
    wsprint(f"{ws!r} has been imported")
else:
    wsprint(f"can't find the {ws!r} module, try to install")
    p = subprocess.Popen([sys.executable, "-m", "pip", "install", "websockets", "-i", "https://pypi.tuna.tsinghua.edu.cn/simple"],
                          stdout=subprocess.PIPE,
                          stderr=subprocess.STDOUT)
    for line in iter(p.stdout.readline, b''):
        wsprint(">>> " + line.decode('utf-8').rstrip())


if ws in sys.modules:
    # lanuch the websocket server
    from websockets.server import serve

    async def shell(websocket):
        async for message in websocket:
            # message = await websocket.recv()
            wsprint("[py] websockets: " +message)

            if message == "exit":
                sys.exit()

    async def main():
        port_num = 8765

        stop = asyncio.Future()
        async with serve(shell, "localhost", port_num):
            wsprint(f'Launch local server at [localhost:{port_num}]')
            # await asyncio.Future()  # run forever

            # while True:
            #     with open(f'C:/Users/hwang/Desktop/loops.txt', 'w') as f:
            #         f.writelines(str(time.time()))
                # 每隔1秒运行writeAA()函数
                # await asyncio.sleep(1)

            await stop
            await shell.close()

    try:
        asyncio.run(main())
    except Exception as e:
        wsprint(f'[Error] The port seems been taken: {e}')