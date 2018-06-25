# MC Up

Run a specific version of Mobile Core on a local OpenShift instance.

<p align="center">
	<br>
	<img width="700" src="mcup.svg">
	<br>
	<br>
</p>

## Compatibility

This module has only been tested on macOS.

## Prerequisites

`mcup` will automatically check prerequisites and instruct you if anything needs
to be installed, but here's a list of what it will check for you:

* Node.js 6.14+
* Docker 17.09-ce or newer
* Python 2.7+
* Ansible 2.4+
* OpenShift Origin 3.9+
* Dockerhub Account

## Installation & Usage

Not currently available on npm so you'll need to do the following:

```
$ git clone git@github.com:evanshortiss/mcup.git
$ cd mcup
$ npm install
$ npm link
```

Next run the `mcup up` command and pass the `dockeruser` and `dockerpass`
arguments, or set your Docker Hub username and password in `DOCKERHUB_USER`
and `DOCKERHUB_PASS` environment variables. It will prompt you for your sudo
password after the "Unpack Release" step has completed.

```
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
