import sys
import subprocess
import importlib.util
import asyncio
import time
# import pty
# import os

welcome_str = '$$ Sython Console Backend $$'
welcome_bar = '$' * len(welcome_str)
print(f'\n\n{welcome_bar}\n{welcome_str}\n{welcome_bar}\n')
sys.stdout.flush()

# check if websocket is installed
ws = 'websockets'
if ws in sys.modules:
    print(f"{ws!r} already in sys.modules")
    sys.stdout.flush()
elif (spec := importlib.util.find_spec(ws)) is not None:
    # If you choose to perform the actual import ...
    module = importlib.util.module_from_spec(spec)
    sys.modules[ws] = module
    spec.loader.exec_module(module)
    print(f"{ws!r} has been imported")
    sys.stdout.flush()
else:
    print(f"can't find the {ws!r} module, try to install")
    sys.stdout.flush()
    p = subprocess.Popen([sys.executable, "-m", "pip", "install", "websockets", "-i", "https://pypi.tuna.tsinghua.edu.cn/simple"],
                          stdout=subprocess.PIPE,
                          stderr=subprocess.STDOUT)
    for line in iter(p.stdout.readline, b''):
        print(">>> " + line.decode('utf-8').rstrip())
        sys.stdout.flush()


if ws in sys.modules:
    # lanuch the websocket server
    from websockets.server import serve

    async def shell(websocket):
        async for message in websocket:
            # message = await websocket.recv()
            print("[py] websockets: " +message)
            sys.stdout.flush()

            if message == "exit":
                sys.exit()

    async def main():
        port_num = 8765

        stop = asyncio.Future()
        async with serve(shell, "localhost", port_num):
            print(f'Launch local server at [localhost:{port_num}]')
            sys.stdout.flush()
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
        print(f'[Error] The port seems been taken: {e}')