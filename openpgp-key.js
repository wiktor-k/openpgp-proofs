"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var renderer = require("./renderer");
function getLatestSignature(signatures, date) {
    if (date === void 0) { date = new Date(); }
    var signature = signatures[0];
    for (var i = 1; i < signatures.length; i++) {
        if (signatures[i].created >= signature.created &&
            (signatures[i].created <= date || date === null)) {
            signature = signatures[i];
        }
    }
    return signature;
}
window.onload = window.onhashchange = function () {
    if (this.location.hash.length > 1) {
        lookupKey(location.hash.substring(1));
    }
};
function lookupKey(query) {
    return __awaiter(this, void 0, void 0, function () {
        var result, hkp, key, keys;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    result = document.getElementById('result');
                    result.innerHTML = renderer.render(<span>Looking up {query}...</span>);
                    hkp = new openpgp.HKP('https://keyserver.ubuntu.com/');
                    return [4 /*yield*/, hkp.lookup({
                            query: query
                        })];
                case 1:
                    key = _a.sent();
                    return [4 /*yield*/, openpgp.key.readArmored(key)];
                case 2:
                    keys = (_a.sent()).keys;
                    if (keys.length > 0) {
                        loadKeys(keys).catch(function (e) {
                            result.innerHTML = renderer.render(<span>Could not display this key: {String(e)}</span>);
                        });
                    }
                    else {
                        result.innerHTML = renderer.render(<span>{query}: not found</span>);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function loadKeys(_keys) {
    return __awaiter(this, void 0, void 0, function () {
        var key, primaryUser, i, e_1, _i, _a, user, _b, lastPrimarySig, keys, _c, _d, _e, subKey, lastSig, _f, _g, _h, info;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    key = _keys[0];
                    window.key = key;
                    return [4 /*yield*/, key.getPrimaryUser()];
                case 1:
                    primaryUser = _j.sent();
                    i = key.users.length - 1;
                    _j.label = 2;
                case 2:
                    if (!(i >= 0)) return [3 /*break*/, 8];
                    _j.label = 3;
                case 3:
                    _j.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, key.users[i].verify(key.primaryKey)];
                case 4:
                    if ((_j.sent()) === openpgp.enums.keyStatus.valid) {
                        return [3 /*break*/, 7];
                    }
                    return [3 /*break*/, 6];
                case 5:
                    e_1 = _j.sent();
                    console.error('User verification error:', e_1);
                    return [3 /*break*/, 6];
                case 6:
                    key.users.splice(i, 1);
                    _j.label = 7;
                case 7:
                    i--;
                    return [3 /*break*/, 2];
                case 8:
                    _i = 0, _a = key.users;
                    _j.label = 9;
                case 9:
                    if (!(_i < _a.length)) return [3 /*break*/, 12];
                    user = _a[_i];
                    _b = user;
                    return [4 /*yield*/, user.isRevoked()];
                case 10:
                    _b.revoked = _j.sent();
                    _j.label = 11;
                case 11:
                    _i++;
                    return [3 /*break*/, 9];
                case 12:
                    lastPrimarySig = primaryUser.selfCertification;
                    _c = {
                        fingerprint: key.primaryKey.getFingerprint()
                    };
                    return [4 /*yield*/, key.verifyPrimaryKey()];
                case 13:
                    keys = [(_c.status = _j.sent(),
                            _c.keyFlags = lastPrimarySig.keyFlags,
                            _c.created = key.primaryKey.created,
                            _c.algorithmInfo = key.primaryKey.getAlgorithmInfo(),
                            _c.expirationTime = lastPrimarySig.getExpirationTime(),
                            _c)];
                    _d = 0, _e = key.subKeys;
                    _j.label = 14;
                case 14:
                    if (!(_d < _e.length)) return [3 /*break*/, 17];
                    subKey = _e[_d];
                    lastSig = getLatestSignature(subKey.bindingSignatures);
                    _g = (_f = keys).push;
                    _h = {
                        fingerprint: subKey.subKey.getFingerprint()
                    };
                    return [4 /*yield*/, subKey.verify(key.primaryKey)];
                case 15:
                    _g.apply(_f, [(_h.status = _j.sent(),
                            _h.keyFlags = lastSig.keyFlags,
                            _h.created = lastSig.created,
                            _h.algorithmInfo = subKey.subKey.getAlgorithmInfo(),
                            _h.expirationTime = subKey.getExpirationTime(),
                            _h)]);
                    _j.label = 16;
                case 16:
                    _d++;
                    return [3 /*break*/, 14];
                case 17:
                    key.users.splice(primaryUser.index, 1);
                    info = <div>
        <h2>{key.primaryKey.getFingerprint()}</h2>
        <h3>{primaryUser.user.userId.userid}</h3>
        {key.users.length > 0 ? <div>
        <p>Other identities:</p>
        <ul>{key.users.map(function (user) {
                        return <li>
            {user.revoked ? "❌" : null}
            {(user.userId) ?
                            user.userId.userid
                            :
                                formatAttribute(user.userAttribute)}
        </li>;
                    })}
        </ul>
        </div> : null}
        <p>Subkeys:</p>
        <ul>{keys.map(function (subKey) {
                        return <li>
            <div>{getStatus(subKey.status)} {getIcon(subKey.keyFlags)} <code>{subKey.fingerprint}</code> {formatAlgorithm(subKey.algorithmInfo.algorithm)} ({subKey.algorithmInfo.bits})</div>
            <div>created: {formatDate(subKey.created)}, expires: {formatDate(subKey.expirationTime)}</div>
            </li>;
                    })}</ul>
    </div>;
                    document.getElementById('result').innerHTML = renderer.render(info);
                    return [2 /*return*/];
            }
        });
    });
}
;
function formatAttribute(userAttribute) {
    if (userAttribute.attributes[0][0] === String.fromCharCode(1)) {
        return <img src={"data:image/jpeg;base64," + btoa(userAttribute.attributes[0].substring(17))}/>;
    }
    if (userAttribute.attributes[0][0] === 'e') {
        var url = userAttribute.attributes[0].substring(userAttribute.attributes[0].indexOf('@') + 1);
        return <a href={url} rel="noopener nofollow">{url}</a>;
    }
    return 'unknown attribute';
}
function formatAlgorithm(name) {
    if (name === 'rsa_encrypt_sign')
        return "RSA";
    return name;
}
function formatDate(date) {
    if (date === Infinity)
        return "never";
    if (typeof date === 'number')
        return 'x';
    return date.toISOString();
}
function getStatus(status) {
    if (status === openpgp.enums.keyStatus.invalid) {
        return "❌";
    }
    if (status === openpgp.enums.keyStatus.expired) {
        return "⏰";
    }
    if (status === openpgp.enums.keyStatus.revoked) {
        return "❌";
    }
    if (status === openpgp.enums.keyStatus.valid) {
        return "✅";
    }
    if (status === openpgp.enums.keyStatus.no_self_cert) {
        return "no_self_cert";
    }
    return "unknown:" + status;
}
function getIcon(keyFlags) {
    if (!keyFlags || !keyFlags[0]) {
        return "";
    }
    var flags = "";
    if ((keyFlags[0] & openpgp.enums.keyFlags.certify_keys) !== 0) {
        flags += "🏵️";
    }
    if ((keyFlags[0] & openpgp.enums.keyFlags.sign_data) !== 0) {
        flags += " 🖋";
    }
    if (((keyFlags[0] & openpgp.enums.keyFlags.encrypt_communication) !== 0) ||
        ((keyFlags[0] & openpgp.enums.keyFlags.encrypt_storage) !== 0)) {
        flags += " 🔒";
    }
    if ((keyFlags[0] & openpgp.enums.keyFlags.authentication) !== 0) {
        flags += " 💳";
    }
    return flags.trim();
}
