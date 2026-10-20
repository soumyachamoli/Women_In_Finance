(function (root) {
  var enc = new TextEncoder();
  var dec = new TextDecoder();

  function toB64(buf) {
    var bytes = new Uint8Array(buf), s = "";
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }

  function fromB64(s) {
    return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); });
  }

  function supported() {
    return !!(root.crypto && root.crypto.subtle);
  }

  async function deriveKey(pin, salt) {
    var base = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: fromB64(salt), iterations: 310000, hash: "SHA-256" },
      base,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function encrypt(key, value) {
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var data = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc.encode(JSON.stringify(value)));
    return { iv: toB64(iv), data: toB64(data) };
  }

  async function decrypt(key, box) {
    var plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(box.iv) }, key, fromB64(box.data));
    return JSON.parse(dec.decode(plain));
  }

  async function create(pin) {
    var salt = toB64(crypto.getRandomValues(new Uint8Array(16)));
    var key = await deriveKey(pin, salt);
    var check = await encrypt(key, "ok");
    return { key: key, vault: { salt: salt, check: check, items: [] } };
  }

  async function unlock(pin, vault) {
    var key = await deriveKey(pin, vault.salt);
    try {
      return (await decrypt(key, vault.check)) === "ok" ? key : null;
    } catch (e) {
      return null;
    }
  }

  root.Vault = { supported: supported, encrypt: encrypt, decrypt: decrypt, create: create, unlock: unlock };
})(this);
