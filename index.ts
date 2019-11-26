import * as openpgp from 'openpgp';
import { verify, getVerifier, VerifierProof, getJson } from './verifier';
import * as fetch from 'node-fetch';

function readStdinToBuffer(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const data: Buffer[] = [];
      process.stdin.on('readable', () => {
      const chunk = process.stdin.read() as Buffer;
      if (chunk !== null) {
          data.push(chunk)
      }
      });

      process.stdin.on('end', () => {
        resolve(Buffer.concat(data));
      });

      process.stdin.on('error', e => reject(e));
    });
  };

async function parseKey(buffer: Buffer) {
    const key = (await openpgp.key.read(buffer)).keys[0];
    const fingerprint = key.primaryKey.getFingerprint();

    const primaryUser = await key.getPrimaryUser();
    const lastPrimarySig = primaryUser.selfCertification;

    const p = require('./proofs.json').proofs;
    const notations: [string, any][] = (lastPrimarySig as any).notations || [];
    const proofs = notations
        .filter(notation => notation[0] === 'proof@metacode.biz' && typeof notation[1] === 'string')
        .map(notation => notation[1] as string)
        .map(proofUrl => getVerifier(p, proofUrl, key.primaryKey.getFingerprint()))
        .filter(verifier => verifier) as VerifierProof[];
    console.log('Key : openpgp4fpr:' + fingerprint);
    console.log('User: ' + primaryUser.user.userId.userid);
    return { fingerprint, proofs };
}

async function verifyIdentifies() {
    if (typeof process === 'undefined') {
        return;
    }
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
            await verify(json, proof.checks);
            passed = true;
        } catch (e) {
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

verifyIdentifies().catch(console.error.bind(console));