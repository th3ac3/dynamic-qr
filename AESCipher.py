import base64
from Crypto.Cipher import AES
from Crypto import Random

class AESCipher:
    def __init__(self, key):
        self.key = key
        self.BS = 16

    def pad(self, string):
        n = len(string)
        pad_size = self.BS - (n % self.BS)
        return string.ljust(n + pad_size, chr(pad_size))

    def unpad(self, string):
        n = len(string)
        pad_size = string[-1]
        if (pad_size > self.BS):
            raise ValueError('Input is not padded or padding is corrupt')
        return string[:n - pad_size]

    def generate_iv(self, size=None):
        size = size if size else self.BS
        return Random.get_random_bytes(size)

    def encrypt(self, raw):
        raw = self.pad(raw)
        iv = self.generate_iv()
        cipher = AES.new(self.key, AES.MODE_CFB, iv, segment_size=128)
        return base64.b64encode(iv + cipher.encrypt(raw))

    def decrypt(self, enc):
        enc = base64.b64decode(enc)
        iv = enc[:16]
        cipher = AES.new(self.key, AES.MODE_CFB, iv, segment_size=128)
        data = cipher.decrypt(enc[16:])
        return self.unpad(data)


