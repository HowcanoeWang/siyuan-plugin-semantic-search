import sys
import subprocess
import time
import importlib.util
import asyncio

print("Current Python path: ", sys.executable)
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

    async def echo(websocket):
        async for message in websocket:
            await websocket.send(message)

    async def handler(websocket):
        while True:
            message = await websocket.recv()
            print("[py] websockets: " +message)
            sys.stdout.flush()

    async def main():
        async with serve(handler, "localhost", 8765):
            print('Launch local server at [localhost:8765]')
            sys.stdout.flush()
            await asyncio.Future()  # run forever

    asyncio.run(main())