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
exports.__esModule = true;
var openpgp = require("openpgp");
var verifier_1 = require("./verifier");
var fetch = require("node-fetch");
function readStdinToBuffer() {
    return new Promise(function (resolve, reject) {
        var data = [];
        process.stdin.on('readable', function () {
            var chunk = process.stdin.read();
            if (chunk !== null) {
                data.push(chunk);
            }
        });
        process.stdin.on('end', function () {
            resolve(Buffer.concat(data));
        });
        process.stdin.on('error', function (e) { return reject(e); });
    });
}
;
function getJson(url) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch(url, {
                        headers: {
                            Accept: 'application/json'
                        },
                        credentials: 'omit'
                    })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Response failed: ' + response.status);
                    }
                    return [2 /*return*/, response.json()];
            }
        });
    });
}
function parseKey(buffer) {
    return __awaiter(this, void 0, void 0, function () {
        var key, fingerprint, primaryUser, lastPrimarySig, p, notations, proofs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, openpgp.key.read(buffer)];
                case 1:
                    key = (_a.sent()).keys[0];
                    fingerprint = key.primaryKey.getFingerprint();
                    return [4 /*yield*/, key.getPrimaryUser()];
                case 2:
                    primaryUser = _a.sent();
                    lastPrimarySig = primaryUser.selfCertification;
                    p = require('./proofs.json').proofs;
                    notations = lastPrimarySig.notations || [];
                    proofs = notations
                        .filter(function (notation) { return notation[0] === 'proof@metacode.biz' && typeof notation[1] === 'string'; })
                        .map(function (notation) { return notation[1]; })
                        .map(function (proofUrl) { return verifier_1.getVerifier(p, proofUrl, key.primaryKey.getFingerprint()); })
                        .filter(function (verifier) { return verifier; });
                    console.log('Key : openpgp4fpr:' + fingerprint);
                    console.log('User: ' + primaryUser.user.userId.userid);
                    return [2 /*return*/, { fingerprint: fingerprint, proofs: proofs }];
            }
        });
    });
}
function verifyIdentifies() {
    return __awaiter(this, void 0, void 0, function () {
        var good, bad, key, things, allPassed, _i, _a, proof, json, passed, error, e_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    good = '\x1b[32;1m✓\x1b[0m';
                    bad = '\x1b[31;1m✗\x1b[0m';
                    return [4 /*yield*/, readStdinToBuffer()];
                case 1:
                    key = _b.sent();
                    return [4 /*yield*/, parseKey(key)];
                case 2:
                    things = _b.sent();
                    console.log();
                    if (things.proofs.length == 0) {
                        console.log('No proofs to check. Try key 653909a2f0e37c106f5faf546c8857e0d8e8f074.');
                    }
                    allPassed = true;
                    _i = 0, _a = things.proofs;
                    _b.label = 3;
                case 3:
                    if (!(_i < _a.length)) return [3 /*break*/, 10];
                    proof = _a[_i];
                    return [4 /*yield*/, getJson(proof.proofJson)];
                case 4:
                    json = _b.sent();
                    passed = false, error = null;
                    _b.label = 5;
                case 5:
                    _b.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, verifier_1.verify(json, proof.checks)];
                case 6:
                    _b.sent();
                    passed = true;
                    return [3 /*break*/, 8];
                case 7:
                    e_1 = _b.sent();
                    error = e_1;
                    return [3 /*break*/, 8];
                case 8:
                    allPassed = allPassed && passed;
                    console.log("  " + (passed ? good : bad) + " " + proof.service + ":" + proof.username + "\n    URL: " + proof.profile + "\n    Proof: " + proof.proofUrl + "\n");
                    _b.label = 9;
                case 9:
                    _i++;
                    return [3 /*break*/, 3];
                case 10:
                    if (things.proofs.length > 0 && allPassed) {
                        console.log('If this is a person you were looking for you can locally sign the key:\n  gpg --quick-lsign ' + things.fingerprint);
                        console.log();
                    }
                    return [2 /*return*/];
            }
        });
    });
}
verifyIdentifies()["catch"](console.error.bind(console));
