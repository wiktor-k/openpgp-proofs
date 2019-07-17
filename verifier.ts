
export interface Proof {
    matcher: string;
    variables: {
        [name: string]: number;
    };
    profile: string;
    proof: string;
    username: string;
    service: string;
    checks: any[];
}

export interface VerifierProof {
    profile: string,
    proofUrl: string;
    proofJson: string;
    service: string;
    username: string;
    checks: any[];
}

export function getVerifier(proofs: Proof[], proofUrl: string, fingerprint: string) {
    for (const proof of proofs) {
        const matches = proofUrl.match(new RegExp(proof.matcher));
        if (!matches) continue;

        const bound = Object.entries(proof.variables).map(([key, value]) => [key, matches[value || 0]]).reduce((previous, current) => { previous[current[0]] = current[1]; return previous;}, { FINGERPRINT: fingerprint } as any);

        const profile = proof.profile.replace(/\{([A-Z]+)\}/g, (_, name) => bound[name]);

        const proofJson = proof.proof.replace(/\{([A-Z]+)\}/g, (_, name) => bound[name]);

        const username = proof.username.replace(/\{([A-Z]+)\}/g, (_, name) => bound[name]);

        return {
            profile,
            proofUrl,
            proofJson,
            username,
            service: proof.service,
            checks: ((proof.checks || []) as any).map((check: any) => ({
                relation: check.relation,
                proof: check.proof,
                claim: check.claim.replace(/\{([A-Z]+)\}/g, (_: any, name: string) => bound[name])
            }))
        };
    }
    return null;
}

export async function verify(json: any, checks: any[]) {
    for (const check of checks) {
        const proofValue = check.proof.reduce((previous: any, current: any) => {
            if (current == null || previous == null) return null;
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
        } else if (check.relation === 'contains') {
            if (!proofValue || proofValue.indexOf(claimValue) === -1) {
                throw new Error(`Proof value ${proofValue} does not contain claim value ${claimValue}`);
            }
        } else if (check.relation === 'oneOf') {
            if (!proofValue || proofValue.indexOf(claimValue) === -1) {
                throw new Error(`Proof value ${proofValue} does not contain claim value ${claimValue}`);
            }
        }
    }
}
