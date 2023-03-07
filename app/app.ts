/**
 * Copyright (c) 2023 John Toebes
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 * EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
import { BaseApp } from './baseapp';
import { documentSummary } from './onshape';

export class App extends BaseApp {
    public myserver = 'https://ftconshape.com/oauthexample';

    /**
     * The main entry point for an app
     */
    public startApp(): void {
        var div = document.createElement('div');
        const h2 = document.createElement('h2');
        h2.innerHTML = 'Starting';
        const ul = document.createElement('ul');
        const li1 = document.createElement('li');
        li1.innerHTML = 'Access_Token=' + this.access_token;
        const li2 = document.createElement('li');
        li2.innerHTML = 'Refresh_Token=' + this.refresh_token;
        const li3 = document.createElement('li');
        li3.innerHTML = 'Expires: ' + this.expires_token.toLocaleString();
        div.appendChild(h2);
        ul.appendChild(li1);
        ul.appendChild(li2);
        ul.appendChild(li3);
        div.appendChild(ul);
        this.setAppElements(div);

        this.makeCall();
    }

    public makeCall() {
        var div = document.createElement('div');
        var h2 = document.createElement('h2');
        h2.innerHTML = 'Dumping Global Nodes';
        div.appendChild(h2);
        const ul = document.createElement('ul');
        ul.setAttribute('id', 'glist');
        div.appendChild(ul);
        this.setAppElements(div);
        this.processNode(
            '/api/globaltreenodes/magic/1?getPathToRoot=true&limit=50&sortColumn=modifiedAt&sortOrder=desc'
        );
    }

    public appendElements(items: documentSummary[]) {
        let ul = document.getElementById('glist');
        if (ul === null) {
            ul = document.createElement('ul');
            let appelement = document.getElementById('app');
            if (appelement === null) {
                appelement = document.body;
            }
            appelement.append(ul);
        }
        for (let item of items) {
            let li = document.createElement('li');
            li.innerHTML = item.name + ' - ' + item.createdBy.name;
            ul.appendChild(li);
            if (
                item.thumbnail !== undefined &&
                item.thumbnail.href !== undefined
            ) {
                let img = document.createElement('img');

                //img.setAttribute('src', item.thumbnail.href);
                // Ask onshape to give us a thumbnail image to fill in
                this.getThumbnail(item.thumbnail, 40, 40).then((src) => {
                    img.setAttribute('src', src);
                });
                img.setAttribute('height', '40');
                li.appendChild(img);
            }
        }
    }

    public processNode(uri: string) {
        this.OnshapeAPIasJSON(uri)
            .then((res) => {
                this.appendElements(res.items);
                if (res.next !== '' && res.next !== undefined) {
                    setTimeout(() => {
                        this.processNode(res.next);
                    }, 10);
                }
            })
            .catch((err) => {
                console.log(`**** Call failed: ${err}`);
            });
    }
    /**
     * Handle when an app is unable to authenticate or has any other problem when starting
     * @param reason Reason for initialization failure
     */
    public failApp(reason: string): void {
        super.failApp(reason);
    }
    /**
     * Create the initial page showing that we are initializing
     */
    public showInitializing() {
        super.showInitializing();
    }
}
