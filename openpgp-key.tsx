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

import local = require('./local');
import renderer = require('./renderer');
import { verify, getVerifier, VerifierProof, getJson } from './verifier';
import * as openpgp from 'openpgp';
import * as ui from './ui';


function getLatestSignature(signatures: any, date=new Date()) {
    let signature = signatures[0];
    for (let i = 1; i < signatures.length; i++) {
      if (signatures[i].created >= signature.created &&
         (signatures[i].created <= date || date === null)) {
        signature = signatures[i];
      }
    }
    return signature;
}

window.onload = window.onhashchange = function() {

    lookupKey(location.hash.substring(1));

};

async function lookupKey(query: string) {
    const result = (document.getElementById('result') as HTMLElement);
    result.innerHTML = renderer.render(<span>Looking up {query}...</span>);
    let keys, keyUrl;
    const keyLink = (document.querySelector('[rel="pgpkey"]') as HTMLLinkElement);
    if (!keyLink) {
      const keyserver = (document.querySelector('meta[name="keyserver"]') as HTMLMetaElement).content;
      keyUrl = `https://${keyserver}/pks/lookup?op=get&options=mr&search=${query}`;
      const response = await fetch(keyUrl);
      const key = await response.text();
      keys = (await openpgp.key.readArmored(key)).keys;
    } else {
      keyUrl = keyLink.href;
      const response = await fetch(keyUrl);
      const key = await response.arrayBuffer();
      keys = (await openpgp.key.read(new Uint8Array(key))).keys;
    }

    if (keys.length > 0) {
        loadKeys(keyUrl, keys).catch(e => {
            result.innerHTML = renderer.render(<span>Could not display this key: {String(e)}</span>)
        });
    } else {
        result.innerHTML = renderer.render(<span>{query}: not found</span>);
    }
}

async function loadKeys(keyUrl: string, _keys: any) {
    const key = _keys[0];
    (window as any).key = key;

    const primaryUser = await key.getPrimaryUser();
    const users = [];

    for (const user of key.users) {
        try {
            if (await user.verify(key.primaryKey) === openpgp.enums.keyStatus.valid && user.userId) {
                users.push(user);
            }
        } catch (e) {
            console.error('User verification error:', e);
        }
    }

    for (const user of key.users) {
        user.revoked = await user.isRevoked();
    }

    const lastPrimarySig = primaryUser.selfCertification;

    const keys: any[] = [{
        fingerprint: key.primaryKey.getFingerprint(),
        status: await key.verifyPrimaryKey(),
        keyFlags: lastPrimarySig.keyFlags,
        created: key.primaryKey.created,
        algorithmInfo: key.primaryKey.getAlgorithmInfo(),
        expirationTime: lastPrimarySig.getExpirationTime()
    }];

    const p = (await (await fetch('proofs.json')).json()).proofs;
    const notations: [string, any][] = lastPrimarySig.notations || [];
    const proofs = notations
        .filter(notation => notation[0] === 'proof@metacode.biz' && typeof notation[1] === 'string')
        .map(notation => notation[1] as string)
        .map(proofUrl => getVerifier(p, proofUrl, key.primaryKey.getFingerprint()))
        .filter(verifier => verifier) as VerifierProof[];
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

    const profileHash = await openpgp.crypto.hash.md5(openpgp.util.str_to_Uint8Array(primaryUser.user.userId.email)).then((u: any) => openpgp.util.str_to_hex(openpgp.util.Uint8Array_to_str(u)));

    // there is index property on primaryUser
    document.title = primaryUser.user.userId.name + ' - OpenPGP key';
    const emails = users.map(user => user.userId.email as string).filter(email => email);
    const name = primaryUser.user.userId.name;
    const info = ui.renderInfo(keyUrl, name, emails, profileHash, key.primaryKey.getFingerprint(), keys, proofs);
    (document.getElementById('result') as HTMLElement).innerHTML = renderer.render(info);
    checkProofs();
};

async function checkProofs() {
    const proofs = document.querySelectorAll('[data-checks]') as NodeListOf<HTMLElement>;
    for (const proofLink of proofs) {
        const checks = JSON.parse(proofLink.dataset.checks || '');
        const url = proofLink.dataset.proofJson || '';
        try {
            await verify(url, checks);
            proofLink.textContent = 'verified proof';
            proofLink.classList.add('verified');
        } catch(e) {
            console.error('Could not verify proof: ' + e);
        }
    }
}

async function clickElement(this: any, e: Event) {
    const target: any = e.target;
    if (target.id === 'encrypt') {
        const text = document.getElementById('message') as HTMLTextAreaElement;
        openpgp.config.show_version = false;
        openpgp.config.show_comment = false;
        openpgp.encrypt({
            message: openpgp.message.fromText(text.value),
            publicKeys: [(window as any).key],
            armor: true
        }).then((cipherText: { data: string}) => {
            text.value = cipherText.data;
        }, (e: Error) => alert(e));
    } else if (target.id === 'send') {
        location.href = "mailto:" + target.dataset.recipient + "?subject=Encrypted%20message&body=" + encodeURIComponent((document.getElementById('message') as HTMLTextAreaElement).value);
    } else if (target.id === 'verify') {
        const text = document.getElementById('signed') as HTMLTextAreaElement;
        const message = await openpgp.cleartext.readArmored(text.value);
        const verified = await openpgp.verify({
            message,
            publicKeys: [(window as any).key]
        });
        console.log(verified);
        alert('The signature is ' + (verified.signatures[0].valid ? '✅ correct.' : '❌ incorrect.'));
    }
}

document.addEventListener('click', clickElement);