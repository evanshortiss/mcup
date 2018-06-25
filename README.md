# MC Up

Run a specific version of Mobile Core on a local OpenShift instance.

## Compatibility

This module has only been tested on macOS.

## Prerequisites

`mcup` will automatically check prerequisites and instruct you if anything needs
to be installed, but here's a list of what it will check for you:

* Docker 17.09-ce or newer
* Python 2.7+
* Ansible 2.4+
* OpenShift Origin 3.9+
* Dockerhub Account

## Installation & Usage

Not currently, available on npm so you'll need to do the following:

```
$ git clone git@github.com:evanshortiss/mcup.git
$ cd mcup
$ npm install
$ npm link
```

Next simply run the `mcup up` command. It will prompt you for your sudo
password after the "Unpack Release" step has completed:

```
# You can also pass these using --dockeruser and --dockerpass arguments
$ export DOCKERHUB_USER=yourusername
$ export DOCKERHUB_PASS=yourpassword

$ mcup up

 ✔ Verify OpenShift 🔴
 ✔ Verify Ansible 🤖
 ✔ Verify Docker 🐳
 ✔ Fetch Mobile Core Releases 🐕
 ✔ Download Release Package 🎁
 ✔ Unpack Release 📦
 ⠸ Launch OpenShift with Mobile Core 📲
   → Installing Mobile Core with ansible-playbook (might be a good time for ☕ )

📱  OpenShift Origin with Mobile Core is available at: https://192.168.37.1:8443/console/
```
