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
import {
    BTAssemblyInstanceDefinitionParams,
    BTConfigurationResponse2019,
    BTDocumentElementInfo,
    BTDocumentElementInfoElementTypeEnum,
    BTDocumentInfo,
    BTDocumentSummaryInfo,
    BTGlobalTreeMagicNodeInfo,
    BTGlobalTreeNodeInfo,
    BTGlobalTreeNodesInfo,
    BTGlobalTreeNodesInfoFromJSON,
} from 'onshape-typescript-fetch/models';
import { createSVGIcon, OnshapeSVGIcon } from './onshape/svgicon';
import { classListAdd, JTRow, JTTable } from './common/jttable';

export interface magicIconInfo {
    label: string;
    icon: OnshapeSVGIcon;
    hideFromMenu?: boolean;
}

export interface InsertElementInfo {
    element: BTDocumentElementInfo;
    config: BTConfigurationResponse2019;
}

export class App extends BaseApp {
    public myserver = 'https://ftconshape.com/oauthexample';
    public running = false;
    public magic = 1;
    public loaded = 0;
    public loadedlimit = 100; // Maximum number of items we will load

    // public magicOptions: JTSelectItem[] = [
    //     { value: '0',  label: '0 - Recently Opened'
    //     { value: '1',  label: '1 - My Onshape'
    //     { value: '2',  label: '2 - Created by Me'
    //     { value: '3',  label: '3 - Public'
    //     { value: '4',  label: '4 - Trash'
    //     { value: '5',  label: '5 - Tutorials & Samples'
    //     { value: '6',  label: '6 - FeatureScript samples'
    //     { value: '7',  label: '7 - Community spotlight'
    //     { value: '8',  label: '8 - IOS Tutorials'
    //     { value: '9',  label: '9 - Android Tutorials'
    //     { value: '10', label: '10 - Labels'
    //     { value: '11', label: '11 - Teams'
    //     { value: '12', label: '12 - Shared with me'
    //     { value: '13', label: '13 - Cloud Storage'
    //     { value: '14', label: '14 - Custom table samples'
    // ];

    public magicInfo: { [item: string]: magicIconInfo } = {
        '0': { icon: 'svg-icon-recentlyOpened', label: 'Recently Opened' },
        '1': { icon: 'svg-icon-myDocuments', label: 'My Onshape' },
        '2': { icon: 'svg-icon-createdByMe', label: 'Created by Me' },
        '3': { icon: 'svg-icon-public', label: 'Public' },
        '4': { icon: 'svg-icon-trash', label: 'Trash' },
        '5': {
            icon: 'svg-icon-tutorial-element',
            label: 'Tutorials & Samples',
        },
        '6': {
            icon: 'svg-icon-tutorial-element',
            label: 'FeatureScript samples',
        },
        '7': {
            icon: 'svg-icon-tutorial-element',
            label: 'Community spotlight',
        },
        '8': { icon: 'svg-icon-help-ios', label: 'IOS Tutorials' },
        '9': { icon: 'svg-icon-help-android', label: 'Android Tutorials' },
        '10': { icon: 'svg-icon-label', label: 'Labels', hideFromMenu: true },
        '11': { icon: 'svg-icon-team', label: 'Teams' },
        '12': { icon: 'svg-icon-sharedWithMe', label: 'Shared with me' },
        '13': {
            icon: 'svg-icon-document-upload-cloud',
            label: 'Cloud Storage',
        },
        '14': {
            icon: 'svg-icon-tutorial-element',
            label: 'Custom table samples',
        },
    };

    /**
     * Get the title for a magic item
     * @param magic
     * @returns string to display for title
     */
    public getMagicTitle(magic: string): string {
        let item = this.magicInfo[magic];
        if (item === undefined || item === null) {
            return magic + ' - NOT FOUND';
        }
        return item.label;
    }

    /**
     * The main entry point for an app
     */
    public startApp(): void {
        // Create the main container
        var div = document.createElement('div');

        // Create the main div that shows where we are
        var bcdiv = document.createElement('div');
        classListAdd(
            bcdiv,
            'os-documents-heading-area disable-user-select os-row os-wrap os-align-baseline'
        );
        bcdiv.setAttribute('id', 'breadcrumbs');
        div.appendChild(bcdiv);

        // Create a place holder for the nodes to be dumped into
        const dumpNodes = document.createElement('div');
        dumpNodes.setAttribute('id', 'dump');
        div.appendChild(dumpNodes);

        this.setAppElements(div);
        this.setBreadcrumbs([]);

        // Start out by dumping the list of my Onshape entries
        this.showHome();
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
    /**
     * Set the breadcrumbs in the header
     * @param breadcrumbs Array of breadcrumbs (in reverse order)
     */
    public setBreadcrumbs(breadcrumbs: BTGlobalTreeNodeInfo[]): void {
        // Find where they want us to put the breadcrumbs
        const breadcrumbscontainer = document.getElementById('breadcrumbs');
        if (
            breadcrumbscontainer === undefined ||
            breadcrumbscontainer === null
        ) {
            // If we don't have a place for it, just skip out
            return;
        }
        // This is what Onshape Generates
        //
        // <span ng-if="!documentSearch.searchText" class="documents-filter-heading spaced-filter-name">
        //   <span ng-if="documentSearch.resourceType" class="documents-filter-heading">
        //     <os-breadcrumb breadcrumb-nodes="breadcrumbNodesList" expand-container-selectors="['.documents-filter-heading.spaced-filter-name', '.documents-filter-heading:not(.spaced-filter-name)']" lower-bound-selector="'.os-items-footer'" lower-bound-offset="12" allow-drop="true" on-drop-callback="onDropOverBreadCrumb(targetNodeId, targetNodeType)" on-dragover-callback-should-disable="shouldDisableDragoverForBreadCrumb(isMyOnshape, event)" class="">
        //       <div class="os-breadcrumb-container">
        //         <os-breadcrumb-node class="os-breadcrumb-root-node" ng-if="$ctrl.firstBreadcrumbNode()" breadcrumb-node="$ctrl.firstBreadcrumbNode()" hide-first-text="$ctrl.hideFirstNodeText" last="$ctrl.breadcrumbNodes.length === 1" first="true" dnd-list="" dnd-dragover="$ctrl.onDragOver({isFirstNode: true, isLastNode: $ctrl.breadcrumbNodes.length === 1, event})" dnd-drop="$ctrl.onDrop($ctrl.firstBreadcrumbNode().options)" os-drag-leave="">
        //           <div class="os-breadcrumb-node" ng-if="$ctrl.breadcrumbNode" ng-class="{'os-breadcrumb-leaf': $ctrl.last}">
        //             <svg class="breadcrumb-node-icon os-svg-icon node-icon" ng-if="$ctrl.breadcrumbNode.options.icon" icon="sharedWithMe" ng-class="{'node-icon': !$ctrl.last, 'breadcrumb-node-text-hidden': !$ctrl.shouldShowTitle() &amp;&amp; !$ctrl.last }" ng-click="$ctrl.breadcrumbNode.callback($ctrl.breadcrumbNode.options)" data-original-title="Shared with me" data-placement="bottom">
        //             <title></title>
        //               <use ng-if="!fromUri" href="#svg-icon-sharedWithMe" link="#svg-icon-sharedWithMe"></use>
        //             </svg>
        //             <div class="node-title" ng-class="{'hide-node-title': $ctrl.breadcrumbNode.uiSref || !$ctrl.shouldShowTitle()}" data-original-title="Shared with me" data-placement="bottom">
        //               <a ng-click="$ctrl.breadcrumbNode.callback($ctrl.breadcrumbNode.options)">Shared with me</a>
        //             </div>
        //             <div ng-hide="$ctrl.last" class="node-seperator">
        //               <svg class="os-svg-icon" icon="forward-tab">
        //                 <title></title>
        //                 <use ng-if="!fromUri" href="#svg-icon-forward-tab" link="#svg-icon-forward-tab"></use>
        //               </svg>
        //             </div>
        //           </div>
        //         </os-breadcrumb-node>
        //         <div class="os-breadcrumb-dropdown ng-hide" ng-class="{'os-breadcrumb-dropdown-drag-enter': $ctrl.isDropdownDragEnter }" ng-style="{ 'opacity': $ctrl.isInitialCalculation ? '0': '1'}" ng-show="$ctrl.isInitialCalculation || ($ctrl.collapsedBreadcrumbNodes &amp;&amp; $ctrl.collapsedBreadcrumbNodes.length)" style="opacity: 1;">
        //           <button type="button" class="os-breadcrumb-dropdown-toggle dropdown-toggle" data-toggle="dropdown">
        //             <svg class="os-svg-icon" icon="overflow">
        //               <title></title>
        //               <use ng-if="!fromUri" href="#svg-icon-overflow" link="#svg-icon-overflow"></use>
        //             </svg>
        //           </button>
        //           <div class="os-breadcrumb-dropdown-menu dropdown-menu append-to-body-menu-a-6" ng-class="{ 'opened-from-drag': $ctrl.dropdownWasOpenedFromDrag }" menu-width="none" os-append-to-body="{ backdrop: false, lowerBound: $ctrl.getLowerBound(), lowerBoundOffset: $ctrl.getLowerBoundOffset() }" style="z-index: 1100;">
        //             <div class="os-breadcrumb-dropdown-scroll-container">
        //               <ul class="os-scroll-container-content">
        //               </ul>
        //             </div>
        //           </div>
        //           <div class="node-seperator">
        //             <svg class="os-svg-icon" icon="forward-tab">
        //               <title></title>
        //               <use ng-if="!fromUri" href="#svg-icon-forward-tab" link="#svg-icon-forward-tab"></use><!---->
        //             </svg>
        //           </div>
        //         </div>
        //         <os-breadcrumb-node ng-repeat="node in $ctrl.displayBreadcrumbNodes" breadcrumb-node="node" hide-first-text="false" dnd-list="" dnd-dragover="$ctrl.onDragOver({isFirstNode: false, isLastNode: $last, event})" dnd-drop="$ctrl.onDrop(node.options)" os-drag-leave="" ng-style="{'flex-shrink': $ctrl.allowShrink ? '1' : '0'}" first="false" last="$last" style="flex-shrink: 0;">
        //           <div class="os-breadcrumb-node os-breadcrumb-leaf" ng-if="$ctrl.breadcrumbNode" ng-class="{'os-breadcrumb-leaf': $ctrl.last}">
        //             <svg class="breadcrumb-node-icon os-svg-icon" ng-if="$ctrl.breadcrumbNode.options.icon" icon="folder" ng-class="{'node-icon': !$ctrl.last, 'breadcrumb-node-text-hidden': !$ctrl.shouldShowTitle() &amp;&amp; !$ctrl.last }" ng-click="$ctrl.breadcrumbNode.callback($ctrl.breadcrumbNode.options)" data-original-title="ServoCity" data-placement="bottom">
        //               <title></title>
        //               <use ng-if="!fromUri" href="#svg-icon-folder" link="#svg-icon-folder"></use><!---->
        //             </svg>
        //             <div class="node-title hide-node-title" ng-class="{'hide-node-title': $ctrl.breadcrumbNode.uiSref || !$ctrl.shouldShowTitle()}" data-original-title="ServoCity" data-placement="bottom">
        //               <a ng-click="$ctrl.breadcrumbNode.callback($ctrl.breadcrumbNode.options)">ServoCity</a>
        //             </div>
        //             <div ng-if="$ctrl.last" class="node-title" data-original-title="ServoCity" data-placement="bottom">
        //               <span>ServoCity</span>
        //             </div>
        //             <div ng-hide="$ctrl.last" class="node-seperator ng-hide">
        //               <svg class="os-svg-icon" icon="forward-tab">
        //                 <title></title>
        //                 <use ng-if="!fromUri" href="#svg-icon-forward-tab" link="#svg-icon-forward-tab"></use><!---->
        //               </svg>
        //             </div>
        //           </div>
        //         </os-breadcrumb-node>
        //       </div>
        //     </os-breadcrumb>
        //   </span>
        // </span>

        // This is what we will do
        //
        // <div class="os-breadcrumb-container">
        //     <div class="os-breadcrumb-node">   (onclick for the div)
        //        createSVGIcon('svg-icon-sharedWithMe','breadcrumb-node-icon os-svg-icon node-icon')
        //       <div class="node-title" data-original-title="Shared with me" data-placement="bottom">
        //         <a>Shared with me</a>
        //       </div>
        //       <div class="node-seperator">
        //         createSVGIcon('svg-icon-forward-tab','os-svg-icon')
        //       </div>
        //     </div>
        //
        //   If we need to have a ... to shorten it
        //   <div class="os-breadcrumb-dropdown" >
        //     <button type="button" class="os-breadcrumb-dropdown-toggle dropdown-toggle" data-toggle="dropdown">
        //        createSVGIcon('svg-icon-overflow','os-svg-icon')
        //     </button>
        //     <div class="node-seperator">
        //        createSVGIcon('svg-icon-forward-tab','os-svg-icon')
        //     </div>
        //   </div>
        //
        //   Typical folder at the end
        //   <div class="os-breadcrumb-node os-breadcrumb-leaf">  // Leaf goes on the end
        //      createSVGIcon('svg-icon-folder','breadcrumb-node-icon os-svg-icon')
        //     <div class="node-title" data-original-title="ServoCity" data-placement="bottom">
        //       ServoCity
        //     </div>
        //   </div>
        //
        // </div>

        // Always create a home button to go to the top level list
        const breadcrumbsdiv = document.createElement('div');
        breadcrumbsdiv.classList.add('os-breadcrumb-container');
        breadcrumbsdiv.appendChild(
            this.createBreadcrumbNode(
                'svg-icon-home-button',
                'Home',
                breadcrumbs.length === 0,
                () => {
                    this.showHome();
                }
            )
        );
        for (let i = breadcrumbs.length - 1; i >= 0; i--) {
            const node = breadcrumbs[i];

            let breadcrumbdiv: HTMLElement;
            const isLast = i == 0;
            if (node.resourceType === 'magic') {
                // This is one of the magic entries.
                let magicinfo = this.magicInfo[node.id];
                if (magicinfo === undefined || magicinfo === null) {
                    // But we don't recognize which magic it is, so
                    breadcrumbdiv = this.createBreadcrumbNode(
                        'svg-icon-error',
                        `${node.id} - NOT FOUND (${node.name})`,
                        isLast,
                        () => {
                            this.showHome();
                        }
                    );
                } else {
                    // We know which one it is, so use the proper icon
                    // And make it so that when they click they go to the right directory
                    breadcrumbdiv = this.createBreadcrumbNode(
                        magicinfo.icon,
                        node.name, //magicinfo.label,
                        isLast,
                        () => {
                            this.dumpMagic(node.id);
                        }
                    );
                }
            } else {
                // Just a normal folder.  make it so that clicking on it
                // navigates to the folder.
                breadcrumbdiv = this.createBreadcrumbNode(
                    'svg-icon-folder',
                    node.name,
                    isLast,
                    () => {
                        this.processFolder(node.id, node.name, node.treeHref);
                    }
                );
            }
            breadcrumbsdiv.appendChild(breadcrumbdiv);
        }
        breadcrumbscontainer.replaceChildren(breadcrumbsdiv);
    }
    /**
     * Create a single breadcrumb node (with separators as needed)
     * @param icon Icon for the node
     * @param title Title of the node
     * @param isLast This is the last in the list of nodes
     * @param onclickFunction Function to call when it is clicked on
     * @returns HTMLElement with all the UI elements in it
     */
    public createBreadcrumbNode(
        icon: OnshapeSVGIcon,
        title: string,
        isLast: boolean,
        onclickFunction: (e: any) => any
    ): HTMLElement {
        const div = document.createElement('div');
        div.classList.add('os-breadcrumb-node');
        if (isLast) {
            div.classList.add('os-breadcrumb-leaf');
        }
        const nodeicon = createSVGIcon(icon);
        nodeicon.onclick = onclickFunction;
        div.appendChild(nodeicon);

        const titlediv = document.createElement('div');
        titlediv.classList.add('node-title');
        titlediv.setAttribute('data-original-title', title);
        titlediv.setAttribute('data-placement', 'bottom');
        titlediv.textContent = title;
        titlediv.onclick = onclickFunction;
        div.appendChild(titlediv);
        if (!isLast) {
            const seperatordiv = document.createElement('div');
            seperatordiv.classList.add('node-seperator');
            seperatordiv.appendChild(createSVGIcon('svg-icon-forward-tab'));
            div.appendChild(seperatordiv);
        }
        return div;
    }
    /**
     * Show the home list of clickable items
     */
    public showHome() {
        // Clean up the UI so we can populate it with new entries
        let dumpNodes = document.getElementById('dump');
        if (dumpNodes !== null) {
            dumpNodes.innerHTML = '';
        } else {
            dumpNodes = document.body;
        }
        const table = new JTTable({
            class: 'os-document-filter-table full-width',
        });

        for (const magicid in this.magicInfo) {
            const magicinfo = this.magicInfo[magicid];
            if (!magicinfo.hideFromMenu) {
                const row = table.addBodyRow();
                const span = document.createElement('span');
                const icon = createSVGIcon(
                    magicinfo.icon,
                    'documents-filter-icon'
                );
                icon.onclick = () => {
                    this.dumpMagic(magicid);
                };
                span.appendChild(icon);
                const textspan = document.createElement('span');
                textspan.textContent = magicinfo.label;
                textspan.onclick = () => {
                    this.dumpMagic(magicid);
                };
                span.appendChild(textspan);
                row.add(span);
            }
        }
        dumpNodes.appendChild(table.generate());
    }
    /**
     * Mark the UI as running.  We disable the dropdown so that you can't request
     * switching while in the middle of runnign
     * @param running
     */
    public setRunning(running: boolean) {
        const magicSelect = document.getElementById(
            'magic'
        ) as HTMLSelectElement;
        if (magicSelect !== null) {
            magicSelect.disabled = running;
        }
        this.running = running;
    }
    /**
     * Dump a list of entries from the Magic api
     * @param magic Which magic list to dump
     */
    public dumpMagic(magic: string): void {
        const magictitle = this.getMagicTitle(magic);
        // If we are in the process of running, we don't want to start things over again
        // so just ignore the call here
        if (this.running) {
            return;
        }
        // Note that we are running and reset the count of entries we have gotten
        this.setRunning(true);
        this.loaded = 0;

        // Clean up the UI so we can populate it with new entries
        let dumpNodes = document.getElementById('dump');
        if (dumpNodes !== null) {
            dumpNodes.innerHTML = '';
        } else {
            dumpNodes = document.body;
        }
        // Create a place holder for all the entries
        const table = new JTTable({
            class: 'os-documents-list os-items-table full-width',
        }).generate();
        table.setAttribute('id', 'glist');
        dumpNodes.appendChild(table);
        // Start the process off with the first in the magic list
        this.processNode(magic);
    }
    /**
     * Append a dump of elements to the current UI
     * @param items Items to append
     */
    public appendElements(items: BTGlobalTreeMagicNodeInfo[]): void {
        // Figure out where we are to add the entries
        let table = document.getElementById('glist');
        if (table === null) {
            const table = new JTTable({
                class: 'os-documents-list os-items-table full-width',
            }).generate();
            table.setAttribute('id', 'glist');

            let appelement = document.getElementById('app');
            // If for some reason we lost the place it is supposed to go, just append to the body
            if (appelement === null) {
                appelement = document.body;
            }
            appelement.append(table);
        }
        //
        // Iterate over all the items
        for (let item of items) {
            // Have we hit the limit?  If so then just skip out
            if (this.loaded >= this.loadedlimit) {
                return;
            }
            // Count another entry output
            this.loaded++;
            ///
            // <table class="os-documents-list os-items-table full-width"><tbody>
            // <tr class="os-item-row os-document-in-list">
            // <td class="os-documents-thumbnail-column os-document-folder-thumbnail-column document-item"><svg class="os-svg-icon folder-list-icon"><use href="#svg-icon-folder"></use></svg></td>
            // <td class="os-document-name document-item">Visor - John Toebes</td></tr></tbody></table>
            ////
            // Create a LI element to hold the entry
            let row = new JTRow({ class: 'os-item-row os-document-in-list' });
            if (item.isContainer) {
                const svg = createSVGIcon(
                    'svg-icon-folder',
                    'folder-list-icon'
                );
                row.add({
                    celltype: 'td',
                    settings: {
                        class: 'os-documents-thumbnail-column os-document-folder-thumbnail-column document-item',
                    },
                    content: svg,
                });
            } else if (
                item.thumbnail !== undefined &&
                item.thumbnail.href !== undefined
            ) {
                // It has an image, so request the thumbnail to be loaded for it
                let img = document.createElement('img');

                //img.setAttribute('src', item.thumbnail.href);
                // Ask onshape to give us a thumbnail image to fill in
                this.getThumbnail(item.thumbnail, 40, 40).then((src) => {
                    img.setAttribute('src', src);
                });
                img.setAttribute('height', '40');
                img.classList.add('os-thumbnail-image');

                img.setAttribute('draggable', 'false');
                img.setAttribute('alt', 'Thumbnail image for a document.');
                img.ondragstart = (ev) => {
                    return false;
                };
                row.add({
                    celltype: 'td',
                    settings: {
                        class: 'os-documents-thumbnail-column document-item',
                    },
                    content: img,
                });
            } else {
                row.add('');
            }
            const alink = document.createElement('a');
            alink.textContent = item.name;
            alink.classList.add('os-document-display-name');
            if (item.isContainer) {
                alink.onclick = () => {
                    this.processFolder(item.id, item.name, item.treeHref);
                };
            } else {
                alink.ondblclick = () => {
                    this.insertItem(item);
                };
            }
            // Document Name
            row.add({
                celltype: 'td',
                settings: { class: 'os-document-name document-item' },
                content: alink,
            });
            // Modified
            row.add({
                celltype: 'td',
                settings: { class: 'os-item-modified-date document-item' },
                content: item.modifiedAt.toLocaleTimeString(),
            });
            // Modified By
            row.add({
                celltype: 'td',
                settings: {
                    class: 'os-item-modified-by os-with-owned-by document-item',
                },
                content: item.owner.name,
            });
            // Owned By
            row.add({
                celltype: 'td',
                settings: { class: 'os-item-owned-by document-item' },
                content: item.owner.name,
            });
            const rowelem = row.generate();
            if (item.isContainer) {
                rowelem.ondblclick = () => {
                    this.processFolder(item.id, item.name, item.treeHref);
                };
            } else {
                rowelem.ondblclick = () => {
                    if (item.jsonType !== 'document-summary') {
                        console.log(
                            `Wrong type in appendElements expected document-summary but got ${item.jsonType}`
                        );
                    }

                    this.insertItem(item as BTDocumentSummaryInfo);
                };
            }
            table.appendChild(rowelem);
        }
    }
    public getDocumentElementInfo(
        documentId: string,
        workspaceId: string,
        elementId?: string
    ): Promise<BTDocumentElementInfo> {
        return new Promise((resolve, reject) => {
            this.documentApi
                .getElementsInDocument({
                    did: documentId,
                    wvm: 'w',
                    wvmid: workspaceId,
                    elementId: elementId,
                })
                .then((val: BTDocumentElementInfo[]) => {
                    for (let elem of val) {
                        if (elem.id === this.elementId) {
                            resolve(elem);
                            return;
                        }
                    }
                    // We didn't find it, so return an empty structure
                    const result: BTDocumentElementInfo = {};
                    resolve(result);
                })
                .catch((reason) => {
                    reject(reason);
                });
        });
    }
    public getDocumentInfo(documentId: string): Promise<BTDocumentInfo> {
        //return new Promise((resolve, reject) => {
        return this.documentApi.getDocument({ did: documentId });
        // //                .then((val: BTDocumentInfo) => {
        //                     resolve(val);
        //                 })
        //                 .catch((reason) => {
        //                     reject(reason);
        //                 });
        //         });
    }
    /**
     * Insert an item into the main document
     * @param item Item to insert into the main document
     */
    public insertItem(item: BTDocumentSummaryInfo): void {
        this.getDocumentElementInfo(
            this.documentId,
            this.workspaceId,
            this.elementId
        ).then((val: BTDocumentElementInfo) => {
            if (val.elementType === 'PARTSTUDIO') {
                this.insertToPartStudio(
                    this.documentId,
                    this.workspaceId,
                    this.elementId,
                    item
                );
            } else if (val.elementType === 'ASSEMBLY') {
                this.insertToAssembly(
                    this.documentId,
                    this.workspaceId,
                    this.elementId,
                    item
                );
            } else {
                alert(`Unable to insert into ${val.elementType}`);
            }
        });
    }
    /**
     * Insert an item into a Parts Studio
     * @param documentId Document to insert into
     * @param workspaceId Workspace in the document
     * @param elementId Element of parts studio to insert into
     * @param item Document to insert from
     */
    public insertToPartStudio(
        documentId: string,
        workspaceId: string,
        elementId: string,
        item: BTDocumentSummaryInfo
    ) {
        // Let's dump out what is actually in the part studio

        this.partstudioApi
            .getPartStudioFeatures({
                did: documentId,
                wvm: 'w',
                wvmid: workspaceId,
                eid: elementId,
            })
            .then((res) => {
                console.log('Part Stuio Features:');
                console.log(res);
            });

        // alert(
        //     `Inserting ${item.name} from ${item.id}/w/${item.defaultWorkspace.id}/e/${item.defaultElementId} INTO a parts studio`
        // );
        // // Figure out the best parts
        // this.documentApi.getDocument({ did: item.id }).then((res) => {
        //     console.log(res);
        // });
    }
    /**
     *
     * 1. Examine the document an determine if we can insert without prompting the user
     *    a. There is a parts studio tab with the same name as the main document with a single object on that tab
     *       (or one object named the same as the main document) and no configuration options for that object.
     *       If so, insert it
     *    b. If there is an assembly tab with the same name as the main document with no configuration options
     *       and we are inserting into an assembly, insert the entire assembly.
     *    c. If there is a single tab (only looking at Parts studios and Assemblies) parts studio
     *       with a single part with no configuration options, insert it
     *    d. If there is a single assembly (looking at parts studios/assemblies) with no configuration options
     *       and we are inserting into an assembly then insert the entire assembly
     *    e. If there are no (parts studios/assembly) tabs, give them a message about nothing to insert
     * 2. We know that we have to present them a choice of what to insert.
     *    Go through all the (part studios/assemblies) tabs
     *    [eliminate assemblies if we are inserting into a parts studio]
     *    to gather all that have at least one item in them
     *    a. Tabs that are assemblies count as a single item.
     *    b. For parts we only want actual parts/combined parts, not drawings, curves, surfaces
     *    c. For every part that is on a tab with a configuration, remember the configuration options
     *    d. For every assembly with a configuration, remember the configuration options
     *    e. Create an overlay dialog (leaving the underlying list of parts still loaded) that offers the options to choose to insert.
     *       If an item has configuration options, put them next to the part.
     *       The overlay dialog has a close button and doesn't auto close after inserting the part from the dialog.
     */
    /**
     * Find all potential items to insert.
     * @param item Document that we are trying to insert from
     * @param insertType The type of document that we are inserting into
     * @returns Array of InsertElementInfo entries so that the inserting code can make a descision
     */
    public async getInsertChoices(
        item: BTDocumentSummaryInfo,
        insertType: BTDocumentElementInfoElementTypeEnum
    ): Promise<InsertElementInfo[]> {
        return new Promise(async (resolve, reject) => {
            // If item.defaultWorkspace is empty or item.defaultWorkspace.id is null then we need to
            // call https://cad.onshape.com/glassworks/explorer/#/Document/getDocumentWorkspaces to get a workspace
            // for now we will assume it is always provided
            const documentinfo = await this.documentApi.getElementsInDocument({
                did: item.id,
                wvm: 'w',
                wvmid: item.defaultWorkspace.id,
            });
            if (documentinfo === undefined) {
                resolve([]); // Nothing to insert
            }
            const result: InsertElementInfo[] = [];
            for (let element of documentinfo) {
                if (
                    element.elementType === 'PARTSTUDIO' ||
                    (element.elementType === 'ASSEMBLY' &&
                        insertType === element.elementType)
                ) {
                    // We to determine if this element has configurations to pick fom
                    const config = await this.elementApi.getConfiguration({
                        did: item.id,
                        wvm: 'w',
                        wvmid: item.defaultWorkspace.id,
                        eid: element.id,
                    });
                    if (config !== undefined) {
                        // If it is a part studio, we need to see how many parts there are in it
                        const xxx =
                            await this.partstudioApi.getPartStudioFeatures({
                                did: item.id,
                                wvm: 'w',
                                wvmid: item.defaultWorkspace.id,
                                eid: element.id,
                            });
                        xxx.features.length;
                        xxx.features[0].featureId;
                        result.push({ element: element, config: config });
                        // See if this is an only matching situation
                        if (element.name === item.name && result.length === 1) {
                            // We found an element that matches the name of the containing document.
                            // If it is the first one and we found nothing else, then return
                            // it for them to insert.
                            // TODO: Add an option to override this behavior
                            resolve(result);
                        }
                    }
                }
            }
        });
    }
    /**
     * Insert an item into an Assembly
     * @param documentId Document to insert into
     * @param workspaceId Workspace in the document
     * @param elementId Element of parts studio to insert into
     * @param item Document to insert from
     */
    public insertToAssembly(
        documentId: string,
        workspaceId: string,
        elementId: string,
        item: BTDocumentSummaryInfo
    ) {
        this.assemblyApi
            .getAssemblyDefinition({
                did: documentId,
                wvm: 'w',
                wvmid: workspaceId,
                eid: elementId,
            })
            .then((res) => {
                console.log('Assembly Information');
                console.log(res);
            });

        const assemblyparms: BTAssemblyInstanceDefinitionParams = {
            _configuration: 'default',
            documentId: '5096c5677f11dbb880c20ece',
            microversionId: '80c6f67ca4fcda7fbfdf9a2d',
            versionId: '98c10de5931cbb46c230ed83',
            elementId: '5b846f306c4c44a22a93d47a',
            isAssembly: true,
            includePartTypes: ['PARTS', 'COMPOSITE_PARTS'],
            isHidden: false,
            isSuppressed: false,
            isWholePartStudio: true,
        };

        this.assemblyApi
            .createInstance({
                did: documentId,
                wid: workspaceId,
                eid: elementId,
                bTAssemblyInstanceDefinitionParams: assemblyparms,
            })
            .then((res) => {
                console.log('Created Instance');
                console.log(res);
            });

        // assembly_data = {
        //     "name": "My Assembly",
        //     "description": "An example assembly created using the Onshape API",
        //     "rootAssembly": True,
        //     "subAssemblies": [
        //         {
        //             "documentId": "SUB_ASSEMBLY_DOCUMENT_ID",
        //             "elementId": "SUB_ASSEMBLY_ELEMENT_ID",
        //             "transform": [
        //                 [1, 0, 0, 0],
        //                 [0, 1, 0, 0],
        //                 [0, 0, 1, 0],
        //                 [0, 0, 0, 1]
        //             ]
        //         }
        //     ]
        // }
        return;
        // When inserting there are several possible situations
        // 1. There is No default workspace/tab defined.
        // 2. The default workspace/tab has than one part in the part studio/Assembly
        // 3. The Part Studio/Assembly has configurations
        // 4. It is just a Normal part.
        // alert(
        //     `Inserting ${item.name} from ${item.id}/w/${item.defaultWorkspace.id}/e/${item.defaultElementId} INTO an assembly`
        // );
        this.documentApi.getDocument({ did: item.id }).then((res) => {
            console.log('Get Document');
            console.log(res);
        });

        if (
            item.defaultWorkspace === undefined ||
            item.defaultWorkspace.id === undefined ||
            item.defaultWorkspace.id === null ||
            item.defaultElementId === undefined ||
            item.defaultElementId === null
        ) {
            alert('No default workspace/element ID, unable to insert');
            return;
        }

        // We have a default workspace/element ID, let's figure out what type it is
        // If there is no default workspace or elements then we need to figure out what workspaces there are.
        this.documentApi
            .getElementsInDocument({
                did: item.id,
                wvm: 'w',
                wvmid: item.defaultWorkspace.id,
                elementId: item.defaultElementId,
            })
            .then((res) => {
                console.log('Get Elements in Document');
                console.log(res);
            });
        this.partApi
            .getPartsWMVE({
                did: item.id,
                wvm: 'w',
                wvmid: item.defaultWorkspace.id,
                eid: item.defaultElementId,
            })
            .then((res) => {
                console.log('Get Parts');
                console.log(res);
            });
        this.elementApi
            .getConfiguration({
                did: item.id,
                wvm: 'w',
                wvmid: item.defaultWorkspace.id,
                eid: item.defaultElementId,
            })
            .then((res) => {
                console.log('Get Configuration');
                console.log(res);
                if (res.configurationParameters.length > 0) {
                    alert('Must select configuration');
                } else {
                    alert('Simple item to insert');
                }
            });
    }
    /**
     * Process a single node entry
     * @param uri URI node for the entries to be loaded
     */
    public processNode(magic: string) {
        // uri: string) {
        // Get Onshape to return the list
        this.globaltreenodesApi
            .globalTreeNodesMagic({ mid: magic, getPathToRoot: true })
            .then((res) => {
                this.setBreadcrumbs(res.pathToRoot);
                this.ProcessNodeResults(res);
            })
            .catch((err) => {
                // Something went wrong, some mark us as no longer running.
                console.log(`**** Call failed: ${err}`);
                this.setRunning(false);
            });
    }
    public ProcessNodeResults(res: BTGlobalTreeNodesInfo) {
        const nodes = res as BTGlobalTreeNodesInfo;
        // When it does, append all the elements to the UI
        this.appendElements(nodes.items);
        // Do we have any more in the list and are we under the limit for the UI
        if (
            res.next !== '' &&
            res.next !== undefined &&
            this.loaded < this.loadedlimit
        ) {
            // Request the UI to jump to the next entry in the list.
            // By calling setTimeout we give the UI a little break
            // setTimeout(() => {
            this.OnshapeRequest(res.next, BTGlobalTreeNodesInfoFromJSON).then(
                (res) => {
                    this.ProcessNodeResults(res as BTGlobalTreeNodesInfo);
                }
            );
            // }, 10);
        } else {
            // All done
            this.setRunning(false);
        }
    }
    /**
     * Navigate into a folder and populate the UI with the contents
     * @param id Id of folder
     * @param _name Name of folder (not currently used, may be deleted)
     * @param treeHref Optional href to access folder contents
     */
    public processFolder(id: string, _name: string, treeHref: string): void {
        // If we are in the process of running, we don't want to start things over again
        // so just ignore the call here
        if (this.running) {
            return;
        }
        // Note that we are running and reset the count of entries we have gotten
        this.setRunning(true);
        this.loaded = 0;

        // Clean up the UI so we can populate it with new entries
        let dumpNodes = document.getElementById('dump');
        if (dumpNodes !== null) {
            dumpNodes.innerHTML = '';
        } else {
            dumpNodes = document.body;
        }
        // And create a place holder for all the entries
        const table = new JTTable({
            class: 'os-documents-list os-items-table full-width',
        }).generate();
        table.setAttribute('id', 'glist');
        dumpNodes.appendChild(table);

        if (treeHref !== undefined && treeHref !== '') {
            this.OnshapeRequest(
                treeHref + '?getPathToRoot=true',
                BTGlobalTreeNodesInfoFromJSON
            )
                .then((res) => {
                    this.setBreadcrumbs(res.pathToRoot);
                    this.ProcessNodeResults(res);
                })
                .catch((err) => {
                    // Something went wrong, some mark us as no longer running.
                    console.log(`**** Call failed: ${err}`);
                    this.setRunning(false);
                });
        } else {
            this.globaltreenodesApi
                .globalTreeNodesFolder({ fid: id, getPathToRoot: true })
                .then((res) => {
                    this.setBreadcrumbs(res.pathToRoot);
                    this.ProcessNodeResults(res);
                })
                .catch((err) => {
                    // Something went wrong, some mark us as no longer running.
                    console.log(`**** Call failed: ${err}`);
                    this.setRunning(false);
                });
        }
    }
}
