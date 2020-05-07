# OpenPGP Proofs

This document describes a method of adding social proofs to OpenPGP keys in a way that can be independently verified by clients. This is similar to Keybase but decentralized.

An example:

```
$ gpg --export 653909a2f0e37c106f5faf546c8857e0d8e8f074 | node index.js
Key : openpgp4fpr:653909a2f0e37c106f5faf546c8857e0d8e8f074
User: Wiktor Kwapisiewicz <>

  ✓ dns:metacode.biz
    URL: https://metacode.biz
    Proof: dns:metacode.biz?type=TXT

  ✓ github:wiktor-k
    URL: https://github.com/wiktor-k
    Proof: https://gist.github.com/wiktor-k/389d589dd19250e1f9a42bc3d5d40c16

  ✓ reddit:wiktor-k
    URL: https://www.reddit.com/user/wiktor-k
    Proof: https://www.reddit.com/user/wiktor-k/comments/bo5oih/test/

  ✓ hackernews:wiktor-k
    URL: https://news.ycombinator.com/user?id=wiktor-k
    Proof: https://news.ycombinator.com/user?id=wiktor-k

If this is a person you were looking for you can locally sign the key:
  gpg --quick-lsign 653909a2f0e37c106f5faf546c8857e0d8e8f074
```

See also online version at https://metacode.biz/openpgp/key#0x653909A2F0E37C106F5FAF546C8857E0D8E8F074

## Technical details

Proofs are URIs to documents hosted on third-party sites (such as https://gist.github.com/wiktor-k/389d589dd19250e1f9a42bc3d5d40c16) that can be used by proof-validating clients to check if the key owner has access to given social account.

(Inspect proofs from command line by using `gpg --list-options show-notations --list-sigs D8E8F074 | grep proof`).

Proof URIs are converted to URLs that are used to fetch JSON documents. These documents contain back-link data pointing to an OpenPGP key.

One additional document: `proofs.json` is needed for validators to properly handle proof URIs.

An example, given this proof URI:

https://gist.github.com/wiktor-k/389d589dd19250e1f9a42bc3d5d40c16

It is matched to first entry in `proofs.json`, this regular expression:

`"^https://gist.github.com/([A-Za-z0-9_-]+)/([0-9a-f]+)$"`

Capturing groups are assigned names, in this case first group is a `USERNAME` and the second `PROOFID`.

These groups can be used to construct other elements, such as profile URL:

`"https://github.com/{USERNAME}"`

Or proof URL, that points to the JSON representation of the proof document:

`"https://api.github.com/gists/{PROOFID}"`

The proof document is then fetched with appropriate headers and a number of checks, also defined in `proofs.json` is performed.

Checks always extract a piece of data from the JSON document by recursively extracing objects by keys.

For example the first check extracts `owner` object and then, from that object `login` key (`["owner", "login"]`). This is compared to a *claim*, that in this case is `USERNAME` that has been extracted from the URL.

If all checks succeed then the proof is considered validated.

## For users

Proof documents can be added using platform specific editors only at the moment (for example GitHub gists). After the gist has been created a notation needs to be added to OpenPGP key that points to the proof document:

```
$ gpg --edit-key F470E50DCB1AD5F1E64E08644A63613A4D6E4094
sec  rsa1024/4A63613A4D6E4094
     created: 2013-10-18  expires: never       usage: SCEA
     trust: unknown       validity: full
ssb  rsa1024/E084F7446C202C97
     created: 2013-10-18  expires: never       usage: SEA
[  full  ] (1). Test McTestington <test@example.com>

gpg>
```

Use `notation` subcommand and enter `proof@metacode.biz=` and the proof URI.

For example:

```
gpg> notation
Enter the notation: proof@metacode.biz=https://news.ycombinator.com/user?id=wiktor-k
No notations on user ID "Test McTestington <test@example.com>"
Adding notation: proof@metacode.biz=https://news.ycombinator.com/user?id=wiktor-k
```

Send the key to keyservers if you want others to be able to verify your proofs (this is not strictly needed).

## For proof validators

Proof validation logic is designed to be as simple as possible. Proofs are extracted from OpenPGP self-signature notations using `proof@metacode.biz` key and then matched to the data in `proofs.json` file.

JavaScript implementation of this process is in `verifier.ts` file. Additional implementations are planned.

## For service providers

If you host a service and would like to add the ability for users to prove that they control that account there are only two steps:

1. Expose user data (either profile info or a comment) in a JSON format that can be read by all sites (that is with appropriate CORS header: `Access-Control-Allow-Origin: *`). The document should include user name.

2. Add an entry to `proofs.json` describing how to extract data (username and key fingerprint) from that document.

## FAQ

1. Q: Why the notation name is `proof@metacode.biz`? Should I replace it with my own e-mail / domain?

A: Nope. This e-mail-like string is actually notation key. RFC 4880 specifies [this kind of format](https://tools.ietf.org/html/rfc4880#section-5.2.3.16) as a way to namespace custom notations. You need to create notations under the domain that you own to avoid conflicts. I used my own domain for this protocol. Ideally the notation key would be just `proof`. Using this kind of keys (without `@` namespacing) is only allowed for IETF-approved extensions though (I did not approach them).

2. Q: Why aren't proof documents cleartext signed like in Keybase?

A: The link to the proof document is already signed with your own key when you add the signature notation. Even if the social site published a different document at that link the fingerprint will never match. Actually the signature is stronger than with Keybase as it requires your primary (master) key with Certify capability while cleartext signatures that Keybase uses require only Signing keys. (This could be important if you store your master keys offline).
