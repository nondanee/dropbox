import asyncio
import aiohttp


def hello()
    @aiohttp.streamer
    def file_sender(writer, file_name=None):
        with open(file_name, 'rb') as f:
            chunk = f.read(2**16)
            while chunk:
                yield from writer.write(chunk)
                chunk = f.read(2**16)

    # Then you can use `file_sender` as a data provider:

    async with session.post('http://httpbin.org/post',
                            data=file_sender(file_name='huge_file')) as resp:
        print(await resp.text())


def main():
    yield from hello()