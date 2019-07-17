System.register("verifier", [], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    function getVerifier(proofs, proofUrl, fingerprint) {
        for (const proof of proofs) {
            const matches = proofUrl.match(new RegExp(proof.matcher));
            if (!matches)
                continue;
            const bound = Object.entries(proof.variables).map(([key, value]) => [key, matches[value || 0]]).reduce((previous, current) => { previous[current[0]] = current[1]; return previous; }, { FINGERPRINT: fingerprint });
            const profile = proof.profile.replace(/\{([A-Z]+)\}/g, (_, name) => bound[name]);
            const proofJson = proof.proof.replace(/\{([A-Z]+)\}/g, (_, name) => bound[name]);
            const username = proof.username.replace(/\{([A-Z]+)\}/g, (_, name) => bound[name]);
            return {
                profile,
                proofUrl,
                proofJson,
                username,
                service: proof.service,
                checks: (proof.checks || []).map((check) => ({
                    relation: check.relation,
                    proof: check.proof,
                    claim: check.claim.replace(/\{([A-Z]+)\}/g, (_, name) => bound[name])
                }))
            };
        }
        return null;
    }
    exports_1("getVerifier", getVerifier);
    async function verify(json, checks) {
        for (const check of checks) {
            const proofValue = check.proof.reduce((previous, current) => {
                if (current == null || previous == null)
                    return null;
                if (Array.isArray(previous) && typeof current === 'string') {
                    return previous.map(value => value[current]);
                }
                return previous[current];
            }, json);
            const claimValue = check.claim;
            if (check.relation === 'eq') {
                if (proofValue !== claimValue) {
                    throw new Error(`Proof value ${proofValue} !== claim value ${claimValue}`);
                }
            }
            else if (check.relation === 'contains') {
                if (!proofValue || proofValue.indexOf(claimValue) === -1) {
                    throw new Error(`Proof value ${proofValue} does not contain claim value ${claimValue}`);
                }
            }
            else if (check.relation === 'oneOf') {
                if (!proofValue || proofValue.indexOf(claimValue) === -1) {
                    throw new Error(`Proof value ${proofValue} does not contain claim value ${claimValue}`);
                }
            }
        }
    }
    exports_1("verify", verify);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("index", ["openpgp", "verifier", "node-fetch"], function (exports_2, context_2) {
    "use strict";
    var openpgp, verifier_1, fetch;
    var __moduleName = context_2 && context_2.id;
    function readStdinToBuffer() {
        return new Promise((resolve, reject) => {
            const data = [];
            process.stdin.on('readable', () => {
                const chunk = process.stdin.read();
                if (chunk !== null) {
                    data.push(chunk);
                }
            });
            process.stdin.on('end', () => {
                resolve(Buffer.concat(data));
            });
            process.stdin.on('error', e => reject(e));
        });
    }
    async function getJson(url) {
        const response = await fetch(url, {
            headers: {
                Accept: 'application/json'
            },
            credentials: 'omit'
        });
        if (!response.ok) {
            throw new Error('Response failed: ' + response.status);
        }
        return response.json();
    }
    async function parseKey(buffer) {
        const key = (await openpgp.key.read(buffer)).keys[0];
        const fingerprint = key.primaryKey.getFingerprint();
        const primaryUser = await key.getPrimaryUser();
        const lastPrimarySig = primaryUser.selfCertification;
        const p = require('./proofs.json').proofs;
        const notations = lastPrimarySig.notations || [];
        const proofs = notations
            .filter(notation => notation[0] === 'proof@metacode.biz' && typeof notation[1] === 'string')
            .map(notation => notation[1])
            .map(proofUrl => verifier_1.getVerifier(p, proofUrl, key.primaryKey.getFingerprint()))
            .filter(verifier => verifier);
        console.log('Key : openpgp4fpr:' + fingerprint);
        console.log('User: ' + primaryUser.user.userId.userid);
        return { fingerprint, proofs };
    }
    async function verifyIdentifies() {
        const good = '\x1b[32;1m✓\x1b[0m';
        const bad = '\x1b[31;1m✗\x1b[0m';
        const key = await readStdinToBuffer();
        const things = await parseKey(key);
        console.log();
        if (things.proofs.length == 0) {
            console.log('No proofs to check. Try key 653909a2f0e37c106f5faf546c8857e0d8e8f074.');
        }
        let allPassed = true;
        for (const proof of things.proofs) {
            const json = await getJson(proof.proofJson);
            let passed = false, error = null;
            try {
                await verifier_1.verify(json, proof.checks);
                passed = true;
            }
            catch (e) {
                error = e;
            }
            allPassed = allPassed && passed;
            console.log(`  ${passed ? good : bad} ${proof.service}:${proof.username}\n    URL: ${proof.profile}\n    Proof: ${proof.proofUrl}\n`);
        }
        if (things.proofs.length > 0 && allPassed) {
            console.log('If this is a person you were looking for you can locally sign the key:\n  gpg --quick-lsign ' + things.fingerprint);
            console.log();
        }
    }
    return {
        setters: [
            function (openpgp_1) {
                openpgp = openpgp_1;
            },
            function (verifier_1_1) {
                verifier_1 = verifier_1_1;
            },
            function (fetch_1) {
                fetch = fetch_1;
            }
        ],
        execute: function () {
            ;
            verifyIdentifies().catch(console.error.bind(console));
        }
    };
});
System.register("local", [], function (exports_3, context_3) {
    "use strict";
    var __moduleName = context_3 && context_3.id;
    function createElement(name, attributes, ...children) {
        return {
            name,
            attributes: attributes || {},
            children: Array.prototype.concat(...(children || []))
        };
    }
    exports_3("createElement", createElement);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("renderer", [], function (exports_4, context_4) {
    "use strict";
    var __moduleName = context_4 && context_4.id;
    function render(element) {
        if (element == null)
            return '';
        if (typeof element !== "object")
            element = String(element);
        if (typeof element === "string")
            return element.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        //if (element instanceof Raw) return element.html;
        console.assert(!!element.attributes, 'Element attributes must be defined:\n' + JSON.stringify(element));
        const elementAttributes = element.attributes;
        let attributes = Object.keys(elementAttributes).filter(key => {
            const value = elementAttributes[key];
            return value != null;
        }).map(key => {
            const value = elementAttributes[key];
            if (value === true) {
                return key;
            }
            return `${key}="${String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}"`;
        }).join(' ');
        if (attributes.length > 0) {
            attributes = ' ' + attributes;
        }
        const children = element.children.length > 0 ? `>${element.children.map(child => render(child)).join('')}` : '>';
        return `<${element.name}${attributes}${children}</${element.name}>`;
    }
    exports_4("render", render);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("ui", ["local", "openpgp"], function (exports_5, context_5) {
    "use strict";
    var local, openpgp, dateFormat;
    var __moduleName = context_5 && context_5.id;
    function formatAlgorithm(name) {
        if (name === 'rsa_encrypt_sign')
            return "RSA";
        return name;
    }
    function formatDate(date) {
        if (date === Infinity)
            return "never";
        return dateFormat.format(date);
    }
    exports_5("formatDate", formatDate);
    function getStatus(status, details) {
        if (status === openpgp.enums.keyStatus.invalid) {
            return local.createElement("span", { title: "Invalid key" }, "\u274C");
        }
        if (status === openpgp.enums.keyStatus.expired) {
            return local.createElement("span", { title: "Key expired" }, "\u23F0");
        }
        if (status === openpgp.enums.keyStatus.revoked) {
            return local.createElement("span", { title: "Key revoked: " + details }, "\u274C");
        }
        if (status === openpgp.enums.keyStatus.valid) {
            return local.createElement("span", { title: "Valid key" }, "\u2705");
        }
        if (status === openpgp.enums.keyStatus.no_self_cert) {
            return local.createElement("span", { title: "Key not certified" }, "\u274C");
        }
        return "unknown:" + status;
    }
    function getIcon(keyFlags) {
        if (!keyFlags || !keyFlags[0]) {
            return "";
        }
        let flags = [];
        if ((keyFlags[0] & openpgp.enums.keyFlags.certify_keys) !== 0) {
            flags.push(local.createElement("span", { title: "Certyfing key" }, "\uD83C\uDFF5\uFE0F"));
        }
        if ((keyFlags[0] & openpgp.enums.keyFlags.sign_data) !== 0) {
            flags.push(local.createElement("span", { title: 'Signing key' }, "\uD83D\uDD8B"));
        }
        if (((keyFlags[0] & openpgp.enums.keyFlags.encrypt_communication) !== 0) ||
            ((keyFlags[0] & openpgp.enums.keyFlags.encrypt_storage) !== 0)) {
            flags.push(local.createElement("span", { title: 'Encryption key' }, "\uD83D\uDD12"));
        }
        if ((keyFlags[0] & openpgp.enums.keyFlags.authentication) !== 0) {
            flags.push(local.createElement("span", { title: 'Authentication key' }, "\uD83D\uDCB3"));
        }
        return flags;
    }
    function serviceToClassName(service) {
        if (service === 'github') {
            return 'fab fa-github';
        }
        else if (service === 'reddit') {
            return 'fab fa-reddit';
        }
        else if (service === 'hackernews') {
            return 'fab fa-hacker-news';
        }
        else if (service === 'mastodon') {
            return 'fab fa-mastodon';
        }
        else if (service === 'dns') {
            return 'fas fa-globe';
        }
        else {
            return '';
        }
    }
    function renderInfo(keyUrl, name, emails, profileHash, fingerprint, subKeys, proofs) {
        const now = new Date();
        return local.createElement("div", null,
            local.createElement("div", { class: "wrapper" },
                local.createElement("div", { class: "bio" },
                    local.createElement("img", { class: "avatar", src: "https://seccdn.libravatar.org/avatar/" + profileHash + "?s=148&d=" + encodeURIComponent("https://www.gravatar.com/avatar/" + profileHash + "?s=148&d=mm") }),
                    local.createElement("h2", null, name)),
                local.createElement("div", null,
                    local.createElement("ul", { class: "props" },
                        local.createElement("li", { title: fingerprint },
                            local.createElement("a", { href: keyUrl, target: "_blank", rel: "nofollow noopener" },
                                "\uD83D\uDD11\u00A0",
                                local.createElement("code", null, fingerprint))),
                        emails.map(email => local.createElement("li", null,
                            local.createElement("a", { href: "mailto:" + email },
                                "\uD83D\uDCE7 ",
                                email))),
                        proofs.map(proof => local.createElement("li", null,
                            local.createElement("a", { rel: "me noopener nofollow", target: "_blank", href: proof.profile },
                                local.createElement("i", { class: serviceToClassName(proof.service) }),
                                proof.username),
                            local.createElement("a", { rel: "noopener nofollow", target: "_blank", href: proof.proofUrl, class: "proof", "data-proof-json": proof.proofJson, "data-checks": JSON.stringify(proof.checks) },
                                local.createElement("i", { class: "fas fa-certificate" }),
                                "proof")))))),
            local.createElement("details", null,
                local.createElement("summary", null, "\uD83D\uDD12 Encrypt"),
                local.createElement("textarea", { placeholder: "Message to encrypt...", id: "message" }),
                local.createElement("input", { type: "button", value: "Encrypt", id: "encrypt" }),
                ' ',
                local.createElement("input", { type: "button", id: "send", "data-recipient": emails[0], value: "Send to " + emails[0] })),
            local.createElement("details", null,
                local.createElement("summary", null, "\uD83D\uDD8B Verify"),
                local.createElement("textarea", { placeholder: "Clearsigned message to verify...", id: "signed" }),
                local.createElement("input", { type: "button", value: "Verify", id: "verify" })),
            local.createElement("details", null,
                local.createElement("summary", null, "\uD83D\uDD11 Key details"),
                local.createElement("p", null, "Subkeys:"),
                local.createElement("ul", null, subKeys.map((subKey) => local.createElement("li", null,
                    local.createElement("div", null,
                        getStatus(subKey.status, subKey.reasonForRevocation),
                        " ",
                        getIcon(subKey.keyFlags),
                        " ",
                        local.createElement("code", null, subKey.fingerprint.substring(24).match(/.{4}/g).join(" ")),
                        " ",
                        formatAlgorithm(subKey.algorithmInfo.algorithm),
                        " (",
                        subKey.algorithmInfo.bits,
                        ")"),
                    local.createElement("div", null,
                        "created: ",
                        formatDate(subKey.created),
                        ", expire",
                        now > subKey.expirationTime ? "d" : "s",
                        ": ",
                        formatDate(subKey.expirationTime)))))));
    }
    exports_5("renderInfo", renderInfo);
    return {
        setters: [
            function (local_1) {
                local = local_1;
            },
            function (openpgp_2) {
                openpgp = openpgp_2;
            }
        ],
        execute: function () {
            dateFormat = new Intl.DateTimeFormat(undefined, {
                year: 'numeric', month: 'numeric', day: 'numeric',
                hour: 'numeric', minute: 'numeric'
            });
        }
    };
});
/*
    Copyright 2019 Wiktor Kwapisiewicz

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       https://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/
System.register("openpgp-key", ["local", "renderer", "verifier", "openpgp", "ui"], function (exports_6, context_6) {
    "use strict";
    var local, renderer, verifier_2, openpgp, ui;
    var __moduleName = context_6 && context_6.id;
    function getLatestSignature(signatures, date = new Date()) {
        let signature = signatures[0];
        for (let i = 1; i < signatures.length; i++) {
            if (signatures[i].created >= signature.created &&
                (signatures[i].created <= date || date === null)) {
                signature = signatures[i];
            }
        }
        return signature;
    }
    async function lookupKey(query) {
        const result = document.getElementById('result');
        result.innerHTML = renderer.render(local.createElement("span", null,
            "Looking up ",
            query,
            "..."));
        let keys, keyUrl;
        const keyLink = document.querySelector('[rel="pgpkey"]');
        if (!keyLink) {
            const keyserver = document.querySelector('meta[name="keyserver"]').content;
            keyUrl = `https://${keyserver}/pks/lookup?op=get&options=mr&search=${query}`;
            const response = await fetch(keyUrl);
            const key = await response.text();
            keys = (await openpgp.key.readArmored(key)).keys;
        }
        else {
            keyUrl = keyLink.href;
            const response = await fetch(keyUrl);
            const key = await response.arrayBuffer();
            keys = (await openpgp.key.read(new Uint8Array(key))).keys;
        }
        if (keys.length > 0) {
            loadKeys(keyUrl, keys).catch(e => {
                result.innerHTML = renderer.render(local.createElement("span", null,
                    "Could not display this key: ",
                    String(e)));
            });
        }
        else {
            result.innerHTML = renderer.render(local.createElement("span", null,
                query,
                ": not found"));
        }
    }
    async function loadKeys(keyUrl, _keys) {
        const key = _keys[0];
        window.key = key;
        const primaryUser = await key.getPrimaryUser();
        const users = [];
        for (const user of key.users) {
            try {
                if (await user.verify(key.primaryKey) === openpgp.enums.keyStatus.valid && user.userId) {
                    users.push(user);
                }
            }
            catch (e) {
                console.error('User verification error:', e);
            }
        }
        for (const user of key.users) {
            user.revoked = await user.isRevoked();
        }
        const lastPrimarySig = primaryUser.selfCertification;
        const keys = [{
                fingerprint: key.primaryKey.getFingerprint(),
                status: await key.verifyPrimaryKey(),
                keyFlags: lastPrimarySig.keyFlags,
                created: key.primaryKey.created,
                algorithmInfo: key.primaryKey.getAlgorithmInfo(),
                expirationTime: lastPrimarySig.getExpirationTime()
            }];
        const p = (await (await fetch('proofs.json')).json()).proofs;
        const notations = lastPrimarySig.notations || [];
        const proofs = notations
            .filter(notation => notation[0] === 'proof@metacode.biz' && typeof notation[1] === 'string')
            .map(notation => notation[1])
            .map(proofUrl => verifier_2.getVerifier(p, proofUrl, key.primaryKey.getFingerprint()))
            .filter(verifier => verifier);
        //gpg --export 0xdeadfa11 | curl -T - https://testing2.keys.openpgp.org/
        /*
        proofs.push(getVerifier('https://www.reddit.com/user/wiktor-k/comments/bo5oih/test/', key.primaryKey.getFingerprint()));
        proofs.push(getVerifier('https://news.ycombinator.com/user?id=wiktor-k', key.primaryKey.getFingerprint()));
        proofs.push(getVerifier('https://gist.github.com/wiktor-k/389d589dd19250e1f9a42bc3d5d40c16', key.primaryKey.getFingerprint()));
        proofs.push(getVerifier('https://metacode.biz/@wiktor', key.primaryKey.getFingerprint()));
        proofs.push(getVerifier('dns:metacode.biz?type=TXT', key.primaryKey.getFingerprint()));
        */
        for (const subKey of key.subKeys) {
            const lastSig = getLatestSignature(subKey.bindingSignatures);
            let reasonForRevocation;
            if (subKey.revocationSignatures.length > 0) {
                reasonForRevocation = subKey.revocationSignatures[subKey.revocationSignatures.length - 1].reasonForRevocationString;
            }
            keys.push({
                fingerprint: subKey.keyPacket.getFingerprint(),
                status: await subKey.verify(key.primaryKey),
                reasonForRevocation,
                keyFlags: lastSig.keyFlags,
                created: lastSig.created,
                algorithmInfo: subKey.keyPacket.getAlgorithmInfo(),
                expirationTime: await subKey.getExpirationTime()
            });
        }
        const profileHash = await openpgp.crypto.hash.md5(openpgp.util.str_to_Uint8Array(primaryUser.user.userId.email)).then((u) => openpgp.util.str_to_hex(openpgp.util.Uint8Array_to_str(u)));
        // there is index property on primaryUser
        document.title = primaryUser.user.userId.name + ' - OpenPGP key';
        const emails = users.map(user => user.userId.email).filter(email => email);
        const name = primaryUser.user.userId.name;
        const info = ui.renderInfo(keyUrl, name, emails, profileHash, key.primaryKey.getFingerprint(), keys, proofs);
        document.getElementById('result').innerHTML = renderer.render(info);
        checkProofs();
    }
    async function checkProofs() {
        const proofs = document.querySelectorAll('[data-checks]');
        for (const proofLink of proofs) {
            const checks = JSON.parse(proofLink.dataset.checks || '');
            const url = proofLink.dataset.proofJson || '';
            try {
                await verifier_2.verify(url, checks);
                proofLink.textContent = 'verified proof';
                proofLink.classList.add('verified');
            }
            catch (e) {
                console.error('Could not verify proof: ' + e);
            }
        }
    }
    async function clickElement(e) {
        const target = e.target;
        if (target.id === 'encrypt') {
            const text = document.getElementById('message');
            openpgp.config.show_version = false;
            openpgp.config.show_comment = false;
            openpgp.encrypt({
                message: openpgp.message.fromText(text.value),
                publicKeys: [window.key],
                armor: true
            }).then((cipherText) => {
                text.value = cipherText.data;
            }, (e) => alert(e));
        }
        else if (target.id === 'send') {
            location.href = "mailto:" + target.dataset.recipient + "?subject=Encrypted%20message&body=" + encodeURIComponent(document.getElementById('message').value);
        }
        else if (target.id === 'verify') {
            const text = document.getElementById('signed');
            const message = await openpgp.cleartext.readArmored(text.value);
            const verified = await openpgp.verify({
                message,
                publicKeys: [window.key]
            });
            console.log(verified);
            alert('The signature is ' + (verified.signatures[0].valid ? '✅ correct.' : '❌ incorrect.'));
        }
    }
    return {
        setters: [
            function (local_2) {
                local = local_2;
            },
            function (renderer_1) {
                renderer = renderer_1;
            },
            function (verifier_2_1) {
                verifier_2 = verifier_2_1;
            },
            function (openpgp_3) {
                openpgp = openpgp_3;
            },
            function (ui_1) {
                ui = ui_1;
            }
        ],
        execute: function () {
            window.onload = window.onhashchange = function () {
                lookupKey(location.hash.substring(1));
            };
            ;
            document.addEventListener('click', clickElement);
        }
    };
});
