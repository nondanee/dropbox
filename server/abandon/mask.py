# import binascii, base64
KEY = "dropbox!"

# from Crypto.Cipher import AES

# pad = lambda s: s + (16 - len(s) % 16) * chr(16 - len(s) % 16)
# unpad = lambda s : s[0:-(s[-1])]

# def cipher(key):
#     key = pad(key)
#     return AES.new(key,AES.MODE_CBC,key)

# def encrypt(message,key=KEY):
#     key = str(key).zfill(8)
#     message = pad(message)
#     raw = cipher(key).encrypt(message)
#     raw_int = int_from_bytes(raw)
#     return base62_encode(raw_int)

# def decrypt(string,key=KEY):
#     key = str(key).zfill(8)
#     raw_int = base62_decode(string)
#     raw = int_to_bytes(raw_int)
#     try: message = cipher(key).decrypt(raw)
#     except: return 
#     message = unpad(message)
#     return bytes.decode(message)

from cryptography.hazmat.primitives import padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

def pad(data):
    if not isinstance(data, bytes): data = data.encode()
    padder = padding.PKCS7(algorithms.AES.block_size).padder()
    padded_data = padder.update(data) + padder.finalize()
    return padded_data

def unpad(padded_data):
    unpadder = padding.PKCS7(algorithms.AES.block_size).unpadder()
    data = unpadder.update(padded_data)
    try: uppadded_data = data + unpadder.finalize()
    except: return None
    else: return uppadded_data

def cipher(key):
    key = pad(key)
    return Cipher(algorithms.AES(key),modes.CBC(key),backend=default_backend())

def encrypt(message,key=KEY):
    key = str(key).zfill(8)
    encryptor = cipher(key).encryptor()
    raw = encryptor.update(pad(message))
    raw_int = int_from_bytes(raw)
    return base62_encode(raw_int)

def decrypt(string,key=KEY):
    key = str(key).zfill(8)
    raw_int = base62_decode(string)
    raw = int_to_bytes(raw_int)
    decryptor = cipher(key).decryptor()
    try: message = decryptor.update(raw)
    except: return
    message = unpad(message)
    try: return bytes.decode(message)
    except: return

def generate(uid,md5,extension,key=None):
    message = "{}:{}:{}".format(str(uid).zfill(8),md5,extension)
    if key == None: key = uid
    return encrypt(message,key)

def verify(key,string):
    message = decrypt(string,key)
    if not message: return None, None, None
    message = message.split(":")
    if len(message) != 3: return None, None, None
    return int(message[0]), message[1], message[2]



# https://stackoverflow.com/questions/21017698/converting-int-to-bytes-in-python-3
def int_to_bytes(x):
    return x.to_bytes((x.bit_length()+7)//8,'big')

def int_from_bytes(xbytes):
    return int.from_bytes(xbytes,'big')

# https://stackoverflow.com/questions/1119722/base-62-conversion
BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

def base62_encode(num, alphabet=BASE62):
    if num == 0:
        return alphabet[0]
    arr = []
    base = len(alphabet)
    while num:
        num, rem = divmod(num, base)
        arr.append(alphabet[rem])
    arr.reverse()
    return ''.join(arr)

def base62_decode(string, alphabet=BASE62):
    base = len(alphabet)
    strlen = len(string)
    num = 0
    idx = 0
    for char in string:
        power = (strlen - (idx + 1))
        num += alphabet.index(char) * (base ** power)
        idx += 1
    return num


# print(encrypt(str(1100),key=KEY))
# print(decrypt('6wm5AISlGU6jY1wmBOFxea',key=KEY))
