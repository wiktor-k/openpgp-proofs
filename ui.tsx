
import local = require('./local');
import * as openpgp from 'openpgp';
import { VerifierProof } from './verifier';

function formatAlgorithm(name: string) {
    if (name === 'rsa_encrypt_sign') return "RSA";
    return name;
}

const dateFormat = new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric'
});

export function formatDate(date: Date | number) {
    if (date === Infinity) return "never";
    return dateFormat.format(date);
}

function getStatus(status: any, details?: string) {
    if (status === openpgp.enums.keyStatus.invalid) {
        return <span title="Invalid key">❌</span>;
    }
    if (status === openpgp.enums.keyStatus.expired) {
        return <span title="Key expired">⏰</span>;
    }
    if (status === openpgp.enums.keyStatus.revoked) {
        return <span title={"Key revoked: " + details}>❌</span>;
    }
    if (status === openpgp.enums.keyStatus.valid) {
        return <span title="Valid key">✅</span>;
    }
    if (status === openpgp.enums.keyStatus.no_self_cert) {
        return <span title="Key not certified">❌</span>;
    }
    return "unknown:" + status;
}

function getIcon(keyFlags: any) {
    if (!keyFlags || !keyFlags[0]) {
        return "";
    }
    let flags = [];
    if ((keyFlags[0] & openpgp.enums.keyFlags.certify_keys) !== 0) {
        flags.push(<span title="Certyfing key">🏵️</span>);
    }
    if ((keyFlags[0] & openpgp.enums.keyFlags.sign_data) !== 0) {
        flags.push(<span title='Signing key'>🖋</span>);
    }
    if (((keyFlags[0] & openpgp.enums.keyFlags.encrypt_communication) !== 0) ||
    ((keyFlags[0] & openpgp.enums.keyFlags.encrypt_storage) !== 0)) {
        flags.push(<span title='Encryption key'>🔒</span>);
    }
    if ((keyFlags[0] & openpgp.enums.keyFlags.authentication) !== 0) {
        flags.push(<span title='Authentication key'>💳</span>);
    }
    return flags;
}

function serviceToClassName(service: string) {
    if (service === 'github') {
        return 'fab fa-github';
    } else if (service === 'reddit') {
        return 'fab fa-reddit';
    } else if (service === 'hackernews') {
        return 'fab fa-hacker-news';
    } else if (service === 'mastodon') {
        return 'fab fa-mastodon';
    } else if (service === 'dns') {
        return 'fas fa-globe';
    } else {
        return '';
    }
}

export function renderInfo(keyUrl: string, name: string, emails: string[], profileHash: string, fingerprint: string, subKeys: any[], proofs: VerifierProof[]) {

    const now = new Date();
    return <div>
        <div class="wrapper">
          <div class="bio">
          <img class="avatar" src={"https://seccdn.libravatar.org/avatar/" + profileHash + "?s=148&d=" + encodeURIComponent("https://www.gravatar.com/avatar/" + profileHash + "?s=148&d=mm")} />
          <h2>{name}</h2></div>
          <div>
        <ul class="props">
        <li title={fingerprint}><a href={keyUrl} target="_blank" rel="nofollow noopener">🔑&nbsp;<code>{fingerprint}</code></a></li>
        {emails.map(email =>
        <li><a href={"mailto:" + email}>📧 {email}</a>
        </li>
        )}
        {proofs.map(proof =>
        <li>
            <a rel="me noopener nofollow" target="_blank" href={proof.profile}>
            <i class={serviceToClassName(proof.service)}></i>{proof.username}</a>
            <a rel="noopener nofollow" target="_blank" href={proof.proofUrl} class="proof" data-proof-json={proof.proofJson} data-checks={JSON.stringify(proof.checks)}>
            <i class="fas fa-certificate"></i>proof</a>
            </li>
        )}
        </ul>
    </div></div>
    <details><summary>🔒 Encrypt</summary>
    <textarea placeholder="Message to encrypt..." id="message"></textarea>
    <input type="button" value="Encrypt" id="encrypt" />{' '}
    <input type="button" id="send" data-recipient={emails[0]} value={"Send to " + emails[0]} />
    </details>
    <details><summary>🖋 Verify</summary>
    <textarea placeholder="Clearsigned message to verify..." id="signed"></textarea>
    <input type="button" value="Verify" id="verify" />
    </details>
    <details><summary>🔑 Key details</summary>
        <p>Subkeys:</p>
        <ul>{subKeys.map((subKey: any) =>
        <li>
            <div>{getStatus(subKey.status, subKey.reasonForRevocation)} {getIcon(subKey.keyFlags)} <code>{subKey.fingerprint.substring(24).match(/.{4}/g).join(" ")}</code> {formatAlgorithm(subKey.algorithmInfo.algorithm)} ({subKey.algorithmInfo.bits})</div>
            <div>created: {formatDate(subKey.created)}, expire{now > subKey.expirationTime ? "d" : "s"}: {formatDate(subKey.expirationTime)}</div>
            </li>)}</ul>
    </details>
</div>;
}