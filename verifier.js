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
function getVerifier(proofs, proofUrl, fingerprint) {
    var _loop_1 = function (proof) {
        var matches = proofUrl.match(new RegExp(proof.matcher));
        if (!matches)
            return "continue";
        var bound = Object.entries(proof.variables).map(function (_a) {
            var key = _a[0], value = _a[1];
            return [key, matches[value || 0]];
        }).reduce(function (previous, current) { previous[current[0]] = current[1]; return previous; }, { FINGERPRINT: fingerprint });
        var profile = proof.profile.replace(/\{([A-Z]+)\}/g, function (_, name) { return bound[name]; });
        var proofJson = proof.proof.replace(/\{([A-Z]+)\}/g, function (_, name) { return bound[name]; });
        var username = proof.username.replace(/\{([A-Z]+)\}/g, function (_, name) { return bound[name]; });
        return { value: {
                profile: profile,
                proofUrl: proofUrl,
                proofJson: proofJson,
                username: username,
                service: proof.service,
                checks: (proof.checks || []).map(function (check) { return ({
                    relation: check.relation,
                    proof: check.proof,
                    claim: check.claim.replace(/\{([A-Z]+)\}/g, function (_, name) { return bound[name]; })
                }); })
            } };
    };
    for (var _i = 0, proofs_1 = proofs; _i < proofs_1.length; _i++) {
        var proof = proofs_1[_i];
        var state_1 = _loop_1(proof);
        if (typeof state_1 === "object")
            return state_1.value;
    }
    return null;
}
exports.getVerifier = getVerifier;
/*
*/
function verify(json, checks) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, checks_1, check, proofValue, claimValue;
        return __generator(this, function (_a) {
            for (_i = 0, checks_1 = checks; _i < checks_1.length; _i++) {
                check = checks_1[_i];
                proofValue = check.proof.reduce(function (previous, current) {
                    if (current == null || previous == null)
                        return null;
                    if (Array.isArray(previous) && typeof current === 'string') {
                        return previous.map(function (value) { return value[current]; });
                    }
                    return previous[current];
                }, json);
                claimValue = check.claim;
                if (check.relation === 'eq') {
                    if (proofValue !== claimValue) {
                        throw new Error("Proof value " + proofValue + " !== claim value " + claimValue);
                    }
                }
                else if (check.relation === 'contains') {
                    if (!proofValue || proofValue.indexOf(claimValue) === -1) {
                        throw new Error("Proof value " + proofValue + " does not contain claim value " + claimValue);
                    }
                }
                else if (check.relation === 'oneOf') {
                    if (!proofValue || proofValue.indexOf(claimValue) === -1) {
                        throw new Error("Proof value " + proofValue + " does not contain claim value " + claimValue);
                    }
                }
            }
            return [2 /*return*/];
        });
    });
}
exports.verify = verify;
