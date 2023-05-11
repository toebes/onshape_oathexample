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
    BTDocumentElementInfo,
    BTDocumentSummaryInfo,
    BTGlobalTreeMagicNodeInfo,
    BTGlobalTreeNodeInfo,
    BTGlobalTreeNodesInfo,
    BTGlobalTreeNodesInfoFromJSON,
    BTInsertableInfo,
    BTInsertablesListResponse,
    BTInsertablesListResponseFromJSON,
    BTMConfigurationParameterBoolean2550,
    BTMConfigurationParameterEnum105,
    BTMConfigurationParameterQuantity1826,
    BTMConfigurationParameterString872,
    GBTElementType,
    GetInsertablesRequest,
} from 'onshape-typescript-fetch';
import { createSVGIcon, OnshapeSVGIcon } from './onshape/svgicon';
import {
    classListAdd,
    createDocumentElement,
    JTRow,
    JTTable,
} from './common/jttable';

export interface magicIconInfo {
    label: string;
    icon: OnshapeSVGIcon;
    hideFromMenu?: boolean;
}

// Things to do in order to be basically complete:
// * Implement scrolling (preferrably virtual) for items that don't fit on the screen
// * Implement dialog for selcting a configurable item
// * Implement dialog for selection more than one element for an item
// * Distinguish between configured item vs configurable item
// * Implement hover-over to show additional information
// * Teams doesn't put the teams icon in the breadcrumbs (is it possible?)
// * After changing a configuration, if the image doesn't get updated (not available), set a timer and retry it

enum configType {
    configBool,
    configEnum,
    configQuantity,
    configString,
}
// These mappings are used to convert from the odd names in the API to something more meaningful
const configMapping: { [name: string]: configType } = {
    'BTMConfigurationParameterBoolean-2550': configType.configBool,
    'BTMConfigurationParameterEnum-105': configType.configEnum,
    'BTMConfigurationParameterQuantity-1826': configType.configQuantity,
    'BTMConfigurationParameterString-872': configType.configString,
};

export class App extends BaseApp {
    public myserver = 'https://ftconshape.com/oauthexample';
    public running = false;
    public magic = 1;
    public loaded = 0;
    public loadedlimit = 100; // Maximum number of items we will load
    public targetDocumentElementInfo: BTDocumentElementInfo = {};

    public insertToTarget: (
        documentId: string,
        workspaceId: string,
        elementId: string,
        item: BTInsertableInfo
    ) => void = this.insertToOther;

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
        var div = createDocumentElement('div');

        // Create the main div that shows where we are
        var bcdiv = createDocumentElement('div', {
            id: 'breadcrumbs',
            class: 'os-documents-heading-area disable-user-select os-row os-wrap os-align-baseline',
        });
        div.appendChild(bcdiv);

        // Create a place holder for the nodes to be dumped into
        const dumpNodes = createDocumentElement('div', {
            id: 'dump',
            class: 'y-overflow',
        });
        div.appendChild(dumpNodes);

        this.setAppElements(div);
        this.setBreadcrumbs([]);

        this.getDocumentElementInfo(
            this.documentId,
            this.workspaceId,
            this.elementId
        )
            .then((val: BTDocumentElementInfo) => {
                this.targetDocumentElementInfo = val;

                if (val.elementType === 'PARTSTUDIO') {
                    this.insertToTarget = this.insertToPartStudio;
                } else if (val.elementType === 'ASSEMBLY') {
                    this.insertToTarget = this.insertToAssembly;
                } else {
                    this.failApp(
                        `Only able to insert into PartStudios and Assemblies.  This page is of type ${val.elementType}`
                    );
                    return;
                }
                // Start out by dumping the list of my Onshape entries
                this.showHome();
            })
            .catch((err) => {
                this.failApp(err);
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
        //               <use ng-if="!fromUri" href="#svg-icon-forward-tab" link="#svg-icon-forward-tab"></use>
        //             </svg>
        //           </div>
        //         </div>
        //         <os-breadcrumb-node ng-repeat="node in $ctrl.displayBreadcrumbNodes" breadcrumb-node="node" hide-first-text="false" dnd-list="" dnd-dragover="$ctrl.onDragOver({isFirstNode: false, isLastNode: $last, event})" dnd-drop="$ctrl.onDrop(node.options)" os-drag-leave="" ng-style="{'flex-shrink': $ctrl.allowShrink ? '1' : '0'}" first="false" last="$last" style="flex-shrink: 0;">
        //           <div class="os-breadcrumb-node os-breadcrumb-leaf" ng-if="$ctrl.breadcrumbNode" ng-class="{'os-breadcrumb-leaf': $ctrl.last}">
        //             <svg class="breadcrumb-node-icon os-svg-icon" ng-if="$ctrl.breadcrumbNode.options.icon" icon="folder" ng-class="{'node-icon': !$ctrl.last, 'breadcrumb-node-text-hidden': !$ctrl.shouldShowTitle() &amp;&amp; !$ctrl.last }" ng-click="$ctrl.breadcrumbNode.callback($ctrl.breadcrumbNode.options)" data-original-title="ServoCity" data-placement="bottom">
        //               <title></title>
        //               <use ng-if="!fromUri" href="#svg-icon-folder" link="#svg-icon-folder"></use>
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
        //                 <use ng-if="!fromUri" href="#svg-icon-forward-tab" link="#svg-icon-forward-tab"></use>
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
        const breadcrumbsdiv = createDocumentElement('div', {
            class: 'os-breadcrumb-container',
        });
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
        const div = createDocumentElement('div', {
            class: 'os-breadcrumb-node',
        });
        if (isLast) {
            div.classList.add('os-breadcrumb-leaf');
        }
        const nodeicon = createSVGIcon(icon);
        nodeicon.onclick = onclickFunction;
        div.appendChild(nodeicon);

        const titlediv = createDocumentElement('div', {
            class: 'node-title',
            'data-original-title': title,
            'data-placement': 'bottom',
        });
        titlediv.textContent = title;
        titlediv.onclick = onclickFunction;
        div.appendChild(titlediv);
        if (!isLast) {
            const seperatordiv = createDocumentElement('div', {
                class: 'node-seperator',
            });
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
                const span = createDocumentElement('span');
                const icon = createSVGIcon(
                    magicinfo.icon,
                    'documents-filter-icon'
                );
                icon.onclick = () => {
                    this.dumpMagic(magicid);
                };
                span.appendChild(icon);
                const textspan = createDocumentElement('span');
                textspan.textContent = magicinfo.label;
                textspan.onclick = () => {
                    this.dumpMagic(magicid);
                };
                span.appendChild(textspan);
                row.add(span);
            }
        }
        dumpNodes.appendChild(table.generate());
        this.setBreadcrumbs([]);
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
            class: 'os-documents-listx os-items-table full-width',
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
                class: 'os-documents-listx os-items-table full-width',
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
            const itemInfo = item as BTDocumentSummaryInfo;
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
                // } else if (
                //     item.thumbnail !== undefined &&
                //     item.thumbnail.href !== undefined
                // ){
            } else if (item.jsonType === 'document-summary') {
                // It has an image, so request the thumbnail to be loaded for it
                let img = this.createThumbnailImage(itemInfo);
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
            const alink = createDocumentElement('a', {
                class: 'os-document-display-name',
            });
            alink.textContent = item.name;
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
            let modifiedby = '';
            if (
                item.modifiedBy !== null &&
                item.modifiedBy !== undefined &&
                item.modifiedBy.name !== null &&
                item.modifiedBy.name !== undefined
            ) {
                modifiedby = item.modifiedBy.name;
            }
            row.add({
                celltype: 'td',
                settings: {
                    class: 'os-item-modified-by os-with-owned-by document-item',
                },
                content: modifiedby,
            });
            // Owned By
            let ownedBy = '';
            if (
                item.owner !== null &&
                item.owner !== undefined &&
                item.owner.name !== null &&
                item.owner.name !== undefined
            ) {
                ownedBy = item.owner.name;
            }
            row.add({
                celltype: 'td',
                settings: { class: 'os-item-owned-by document-item' },
                content: ownedBy,
            });
            const rowelem = row.generate();
            if (item.isContainer) {
                rowelem.onclick = () => {
                    this.processFolder(item.id, item.name, item.treeHref);
                };
            } else if (item.jsonType === 'document-summary') {
                rowelem.onclick = () => {
                    this.checkInsertItem(itemInfo);
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
        insertType: GBTElementType
    ): Promise<BTInsertableInfo[]> {
        return new Promise(async (resolve, reject) => {
            // If item.defaultWorkspace is empty or item.defaultWorkspace.id is null then we need to
            // call https://cad.onshape.com/glassworks/explorer/#/Document/getDocumentWorkspaces to get a workspace
            // for now we will assume it is always provided

            // getInsertables
            // /documents/d/{did}/{wv}/{wvid}/insertables"
            const parameters: GetInsertablesRequest = {
                did: item.id,
                wv: 'v',
                wvid: item.recentVersion.id,
                includeParts: true,
                includeSurfaces: false,
                includeSketches: false,
                includeReferenceFeatures: false,
                includeAssemblies: true,
                includeFeatureStudios: false,
                includeBlobs: false,
                includePartStudios: true,
                includeFeatures: true,
                includeMeshes: false,
                includeWires: false,
                includeFlattenedBodies: false,
                includeApplications: false,
                includeCompositeParts: true,
                includeFSTables: false,
                includeFSComputedPartPropertyFunctions: false,
                includeVariables: false,
                includeVariableStudios: false,
            };

            let insertables = await this.documentApi.getInsertables(parameters);
            const result: BTInsertableInfo[] = [];
            const insertMap = new Map<string, BTInsertableInfo>();
            const dropParents = new Map<string, Boolean>();
            while (insertables !== undefined && insertables.items.length > 0) {
                for (let element of insertables.items) {
                    if (
                        element.elementType === 'PARTSTUDIO' ||
                        (element.elementType === 'ASSEMBLY' &&
                            insertType === element.elementType)
                    ) {
                        let elementName = element.elementName ?? '';

                        if (
                            elementName.toUpperCase().indexOf('DO NOT USE') < 0
                        ) {
                            // We want to save it
                            insertMap[element.id] = element;
                        }
                        if (
                            element.parentId !== undefined &&
                            element.parentId !== null &&
                            elementName
                                .toUpperCase()
                                .indexOf('DO NOT USE THESE PARTS') >= 0
                        ) {
                            dropParents[element.parentId] = true;
                        }
                    }
                }
                // If we are finished with the list return it
                if (
                    insertables.next === undefined ||
                    insertables.next === null
                ) {
                    insertables = undefined;
                } else {
                    insertables = (await this.OnshapeRequest(
                        insertables.next,
                        BTInsertablesListResponseFromJSON
                    )) as BTInsertablesListResponse;
                }
            }
            // We have built a map of all the options, now go through and prune any parents
            for (const id in insertMap) {
                const element = insertMap[id];
                if (
                    element.parentId !== undefined &&
                    element.parentId !== null
                ) {
                    insertMap[element.parentId] = undefined;
                }
            }
            for (const id in insertMap) {
                const element = insertMap[id];
                if (element !== undefined) {
                    if (!dropParents[element.parentId]) {
                        result.push(insertMap[id]);
                    }
                }
            }

            resolve(result);
        });
    }
    /**
     * Check if an item can be inserted or if we have to prompt the user for more choices.
     * @param item Item to check
     */
    public checkInsertItem(item: BTDocumentSummaryInfo): void {
        this.getInsertChoices(
            item,
            this.targetDocumentElementInfo.elementType
        ).then((res) => {
            if (res.length === 1) {
                if (
                    res[0].configurationParameters !== undefined &&
                    res[0].configurationParameters !== null
                ) {
                    this.showItemChoices(item, res);
                } else {
                    // Perform an actual insert of an item. Note that we already know if we are
                    // going into a part studio or an assembly.
                    this.insertToTarget(
                        this.documentId,
                        this.workspaceId,
                        this.elementId,
                        item
                    );
                }
            } else {
                console.log(`${res.length} choices found`);
                this.showItemChoices(item, res);
            }
            console.log(res);
        });
    }
    /**
     * Show options for a configurable item to insert
     * @param item
     */

    // [
    //     {
    //         "btType": "BTMConfigurationParameterEnum-105",
    //         "nodeId": "M2GYU6sysKE5ini9U",
    //         "parameterId": "List_rQUjcTCrGVekld",
    //         "parameterName": "Length",
    //         "defaultValue": "_3_00___2_Hole_",
    //         "enumName": "List_rQUjcTCrGVekld_conf",
    //         "namespace": "",
    //         "options": [
    //             {
    //                 "btType": "BTMEnumOption-592",
    //                 "nodeId": "M9iXW2dbu///1PsN0",
    //                 "option": "Copy_of_3_00___3_Hole_",
    //                 "optionName": "1.50\" (1 Hole)"
    //             },
    //             {
    //                 "btType": "BTMEnumOption-592",
    //                 "nodeId": "MfCX7LRsS6IBYs9/s",
    //                 "option": "_3_00___2_Hole_",
    //                 "optionName": "3.00\" (3 Hole)"
    //             },
    //             {
    //                 "btType": "BTMEnumOption-592",
    //                 "nodeId": "M2jqt3Avv2Zi672ac",
    //                 "option": "_3_75___4_Hole_",
    //                 "optionName": "3.75\" (4 Hole)"
    //             },
    //             {
    //                 "btType": "BTMEnumOption-592",
    //                 "nodeId": "MExImsNcUfTmTqVw6",
    //                 "option": "_4_50___5_Hole_",
    //                 "optionName": "4.50\" (5 Hole)"
    //             },
    //             {
    //                 "btType": "BTMEnumOption-592",
    //                 "nodeId": "Maul46dnuTCtHPzV2",
    //                 "option": "_6_00___7_Hole_",
    //                 "optionName": "6.00\" (7 Hole)"
    //             },
    //             {
    //                 "btType": "BTMEnumOption-592",
    //                 "nodeId": "MEUQsuAKfJnCeLQ/w",
    //                 "option": "_7_50___9_Hole_",
    //                 "optionName": "7.50\" (9 Hole)"
    //             },
    //             {
    //                 "btType": "BTMEnumOption-592",
    //                 "nodeId": "MwpNQYNWx0dWrxbXh",
    //                 "option": "_9_00___11_Hole_",
    //                 "optionName": "9.00\" (11 Hole)"
    //             },
    //             {
    //                 "btType": "BTMEnumOption-592",
    //                 "nodeId": "MRqRRwsSL8wcQ9Hrv",
    //                 "option": "_10_50___13_Hole_",
    //                 "optionName": "10.50\" (13 Hole)"
    //             },
    //             {
    //                 "btType": "BTMEnumOption-592",
    //                 "nodeId": "MRsnog6Qo4+/cTHGu",
    //                 "option": "_12_00___15_Hole_",
    //                 "optionName": "12.00\" (15 Hole)"
    //             },
    //             {
    //                 "btType": "BTMEnumOption-592",
    //                 "nodeId": "MbpRO7DRhZBl/FRP6",
    //                 "option": "_13_50___17_Hole_",
    //                 "optionName": "13.50\" (17 Hole)"
    //             },
    //             {
    //                 "btType": "BTMEnumOption-592",
    //                 "nodeId": "MoHDMXEXrW5413bYK",
    //                 "option": "_15_00___19_Hole_",
    //                 "optionName": "15.00\" (19 Hole)"
    //             },
    //             {
    //                 "btType": "BTMEnumOption-592",
    //                 "nodeId": "MZLTSlWzsO9hC/1/J",
    //                 "option": "_16_50___21_Hole_",
    //                 "optionName": "16.50\" (21 Hole)"
    //             },
    //             {
    //                 "btType": "BTMEnumOption-592",
    //                 "nodeId": "M4ozgb4JDgfjJWn9M",
    //                 "option": "_18_00___23_Hole_",
    //                 "optionName": "18.00\" (23 Hole)"
    //             },
    //             {
    //                 "btType": "BTMEnumOption-592",
    //                 "nodeId": "M7lnJtknvb7cZWxtT",
    //                 "option": "_21_0___27_Hole_",
    //                 "optionName": "21.0\" (27 Hole)"
    //             },
    //             {
    //                 "btType": "BTMEnumOption-592",
    //                 "nodeId": "M+MTpleBisFuuS119",
    //                 "option": "_24_0___31_Hole_",
    //                 "optionName": "24.0\" (31 Hole)"
    //             },
    //             {
    //                 "btType": "BTMEnumOption-592",
    //                 "nodeId": "MGl39WDIgAhejoogL",
    //                 "option": "_36_0___47_Hole_",
    //                 "optionName": "36.0\" (47 Hole)"
    //             },
    //             {
    //                 "btType": "BTMEnumOption-592",
    //                 "nodeId": "MAG7BOuWYX0IK0C1U",
    //                 "option": "_48_0___63_Hole_",
    //                 "optionName": "48.0\" (63 Hole)"
    //             }
    //         ]
    //     }
    // ]
    public async showItemChoices(
        parent: BTDocumentSummaryInfo,
        items: BTInsertableInfo[]
    ): Promise<void> {
        // Clean up the UI so we can populate it with the list
        let uiDiv = document.getElementById('dump');
        if (uiDiv !== null) {
            uiDiv.innerHTML = '';
        } else {
            uiDiv = document.body;
        }
        const itemTreeDiv = createDocumentElement('div', {
            class: 'select-item-tree',
        });
        const itemParentGroup = createDocumentElement('div', {
            class: 'select-item-parent-group',
        });
        itemTreeDiv.append(itemParentGroup);

        const itemParentRow = createDocumentElement('div', {
            class: 'select-item-dialog-item-row parent-item-expander-row os-selectable-item',
        });
        itemParentGroup.append(itemParentRow);

        const levelControlButtons = createDocumentElement('div', {
            class: 'ns-select-item-dialog-item-expand-collapse',
        });
        const imgExpand = createDocumentElement('img', {
            src: 'https://cad.onshape.com/images/expanded.svg',
        });
        levelControlButtons.append(imgExpand);
        itemParentRow.append(levelControlButtons);

        // Get the parent information
        const divParentItem = createDocumentElement('div', {
            class: 'select-item-dialog-item parent-item',
        });
        const divParentThumbnailContainer = createDocumentElement('div', {
            class: 'select-item-dialog-thumbnail-container os-no-shrink',
        });
        divParentItem.append(divParentThumbnailContainer);

        const imgParentThumbnail = this.createThumbnailImage(parent);
        itemParentRow.append(divParentItem);

        divParentThumbnailContainer.append(imgParentThumbnail);

        const divParentTitle = createDocumentElement('div', {
            class: 'select-item-dialog-item-name',
        });
        divParentTitle.textContent = parent.name;

        itemParentRow.append(divParentTitle);
        uiDiv.appendChild(itemTreeDiv);

        // Start the process off with the first in the magic list
        for (const item of items) {
            if (
                item.configurationParameters !== undefined &&
                item.configurationParameters !== null
            ) {
                await this.outputConfigurationOptions(item, itemParentGroup);
            }
            // Now we need to output the actual item.
            const childContainerDiv = createDocumentElement('div', {
                class: 'select-item-dialog-item-row child-item-container os-selectable-item',
            });
            const dialogItemDiv = createDocumentElement('div', {
                class: 'select-item-dialog-item child-item',
            });
            const childThumbnailDiv = createDocumentElement('div', {
                class: 'select-item-dialog-thumbnail-container os-no-shrink',
            });
            const imgChildThumbnail = this.createThumbnailImage(parent);
            childThumbnailDiv.append(imgChildThumbnail);
            const childNameDiv = createDocumentElement('div', {
                class: 'select-item-dialog-item-name',
            });
            childNameDiv.textContent = item.elementName;
            dialogItemDiv.append(childThumbnailDiv);
            dialogItemDiv.append(childNameDiv);
            childContainerDiv.append(dialogItemDiv);
            itemParentGroup.append(childContainerDiv);
        }
    }

    public async outputConfigurationOptions(
        item: BTInsertableInfo,
        itemParentGroup: HTMLElement
    ) {
        const itemConfig = await this.elementApi.getConfiguration({
            did: item.documentId,
            wvm: 'v',
            wvmid: item.versionId,
            eid: item.elementId,
        });
        console.log(
            `Configuration ${itemConfig.configurationParameters.length} options`
        );
        for (let opt of itemConfig.configurationParameters) {
            console.log(opt);
            const divRow = createDocumentElement('div', {
                class: 'select-item-dialog-item-row child-item-container os-selectable-item',
            });
            const divSelector = createDocumentElement('div', {
                class: 'select-item-configuration-selector',
            });
            divRow.append(divSelector);
            const spanOSWrapper = createDocumentElement('div', {
                class: 'os-param-wrapper os-param-select',
            });
            divRow.append(spanOSWrapper);
            const spanLabel = createDocumentElement('span', {
                class: 'os-param-label',
            });
            spanLabel.textContent = opt.parameterName;
            spanOSWrapper.append(spanLabel);

            itemParentGroup.append(divRow);

            switch (configMapping[opt.btType]) {
                case configType.configBool: {
                    const optBool = opt as BTMConfigurationParameterBoolean2550;
                    console.log(
                        `Boolean option ${optBool.parameterName} default=${optBool.defaultValue}`
                    );
                    break;
                }
                case configType.configEnum: {
                    const optEnum = opt as BTMConfigurationParameterEnum105;

                    const divContainer = createDocumentElement('div', {
                        class: 'os-select-container os-select-bootstrap dropdown ng-not-empty ng-valid',
                    });
                    spanOSWrapper.append(divContainer);

                    const spanSelector = createDocumentElement('span', {
                        class: 'os-select-match-text float-start',
                    });
                    divContainer.append(spanSelector);

                    const selector = createDocumentElement('select', {
                        id: optEnum.parameterId,
                        style: 'border:none; width:100%',
                    });
                    spanSelector.append(selector);
                    spanSelector.onchange = (ev) => {
                        console.log(ev);
                        console.log(
                            `Changed Configuration for ${optEnum.parameterId}`
                        );
                    };
                    console.log(`Enum option ${optEnum.parameterName}`);
                    for (let enumopt of optEnum.options) {
                        const option = createDocumentElement('option', {
                            value: enumopt.option,
                        });
                        option.textContent = enumopt.optionName;
                        selector.append(option);
                        console.log(
                            `  ${enumopt.optionName} = ${enumopt.option}`
                        );
                    }
                    break;
                }
                case configType.configString: {
                    const optString = opt as BTMConfigurationParameterString872;
                    console.log(
                        `String option ${optString.parameterName} default=${optString.defaultValue}`
                    );

                    break;
                }
                case configType.configQuantity: {
                    const optQuantity =
                        opt as BTMConfigurationParameterQuantity1826;
                    console.log(
                        `Quantity option ${optQuantity.parameterName} - ${optQuantity.quantityType} [${optQuantity.rangeAndDefault.minValue}-${optQuantity.rangeAndDefault.minValue} ${optQuantity.rangeAndDefault.units}]`
                    );
                    break;
                }
                default: {
                    console.log(`Unknown configuration btType ${opt.btType}`);
                }
            }
        }
    }

    /**
     *
     * @param documentId Document to insert into
     * @param workspaceId Workspace in the document
     * @param elementId Element of parts studio to insert into
     * @param item Document element to insert
     */
    public insertToOther(
        documentId: string,
        workspaceId: string,
        elementId: string,
        item: BTInsertableInfo
    ): void {
        alert(
            `Unable to determine how to insert item ${item.id} - ${item.elementName} into ${this.targetDocumentElementInfo.elementType} ${documentId}/w/${workspaceId}/e/${elementId}`
        );
    }

    /**
     * Insert an item into a Parts Studio
     * @param documentId Document to insert into
     * @param workspaceId Workspace in the document
     * @param elementId Element of parts studio to insert into
     * @param item Document element to insert
     */
    public insertToPartStudio(
        documentId: string,
        workspaceId: string,
        elementId: string,
        item: BTInsertableInfo
    ): void {
        alert(
            `Inserting item ${item.id} - ${item.elementName} into Part Studio ${documentId}/w/${workspaceId}/e/${elementId}`
        );
    }
    /**
     * Insert an item into an Assembly
     * @param documentId Document to insert into
     * @param workspaceId Workspace in the document
     * @param elementId Element of parts studio to insert into
     * @param item Document element to insert
     */
    public insertToAssembly(
        documentId: string,
        workspaceId: string,
        elementId: string,
        item: BTInsertableInfo
    ): void {
        alert(
            `Inserting item ${item.id} - ${item.elementName} into Assembly ${documentId}/w/${workspaceId}/e/${elementId}`
        );

        // this.assemblyApi
        //     .createInstance({
        //         did: documentId,
        //         wid: workspaceId,
        //         eid: elementId,
        //         bTAssemblyInstanceDefinitionParams: assemblyparms,
        //     })
        //     .then((res) => {
        //         console.log('Created Instance');
        //         console.log(res);
        //     });

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
            class: 'os-documents-listx os-items-table full-width',
        }).generate();
        table.setAttribute('id', 'glist');
        dumpNodes.appendChild(table);

        if (
            treeHref !== undefined &&
            treeHref !== '' &&
            treeHref.indexOf('/team/') >= 0
        ) {
            // If we have /team/ in the href then
            // if (treeHref !== undefined && treeHref !== '') {
            this.globaltreenodesApi
                .globalTreeNodesTeamInsertables({
                    teamId: id,
                    getPathToRoot: true,
                    includeAssemblies: true,
                    includeFlattenedBodies: true,
                    includeParts: true,
                    includeSketches: false,
                    includeSurfaces: false,
                })
                // this.OnshapeRequest(
                //     treeHref + '?getPathToRoot=true',
                //     BTGlobalTreeNodesInfoFromJSON
                // )
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
                .globalTreeNodesFolderInsertables({
                    fid: id,
                    getPathToRoot: true,
                    includeAssemblies: true,
                    includeFlattenedBodies: true,
                    includeParts: true,
                    includeSketches: false,
                    includeSurfaces: false,
                })
                //                .globalTreeNodesFolder({ fid: id, getPathToRoot: true })
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

// itemTreeDiv                <div class="select-item-tree">
//                                <!--Element level insertables-->
// itemParentGroup                <div class="select-item-parent-group">
// itemParentRow                      <div class="select-item-dialog-item-row parent-item-expander-row os-selectable-item">
//                                        <!--Element level collapse/expand buttons-->
// levelControlButtons                    <div class="ns-select-item-dialog-item-expand-collapse">
// imgExpand                                 <img src="https://cad.onshape.com/images/expanded.svg">
//                                        </div>
// divParentItem                          <div class="select-item-dialog-item parent-item">
//                                            <!--Element level image/icon/thumbnail container-->
// divParentThumbnailContainer                <div class="select-item-dialog-thumbnail-container os-no-shrink">
//                                            <!--Element level thumbnail-->
// imgParentThumbnail                         <img src="data:image/png;base64,xxxxxx">
//                                        </div>
//                                        <!--Element level display name-->
// divParentTitle                         <div class="select-item-dialog-item-name">
//                                            Aluminum Channel (Configurable)
//                                        </div>
//                                    </div>
//                                </div>
//                                <!-- Configuration selector -->
//                                <div class="select-item-configuration-selector">

//   <div>
//   <div class="select-item-dialog-item-row child-item-container os-selectable-item">
//   <!-- Configuration selector -->
//   <div class="select-item-configuration-selector">
//   <!-- Configuration parameters -->
//      <span class="os-param-wrapper os-param-select">
//         <label class="os-param-label"><span>Length</span></label>

//         <div class="os-select-container os-select-bootstrap dropdown ng-not-empty ng-valid">
//         <div class="os-select-match">
//            <span class="os-select-match-text float-start">
//               <select id="ccc" style="border:none; width:100%">
//                  <option value="Copy_of_3_00___3_Hole_">1.50" (1 Hole)   </option>
//                  <option value="_3_00___2_Hole_">3.00" (3 Hole)   </option>
//                  <option value="_3_75___4_Hole_">3.75" (4 Hole)   </option>
//                  <option value="_4_50___5_Hole_">4.50" (5 Hole)   </option>
//                  <option value="_6_00___7_Hole_">6.00" (7 Hole)   </option>
//                  <option value="_7_50___9_Hole_">7.50" (9 Hole)   </option>
//                  <option value="_9_00___11_Hole_">9.00" (11 Hole)  </option>
//                  <option value="_10_50___13_Hole_">10.50" (13 Hole) </option>
//                  <option value="_12_00___15_Hole_">12.00" (15 Hole) </option>
//                  <option value="_13_50___17_Hole_">13.50" (17 Hole) </option>
//                  <option value="_15_00___19_Hole_">15.00" (19 Hole) </option>
//                  <option value="_16_50___21_Hole_">16.50" (21 Hole) </option>
//                  <option value="_18_00___23_Hole_">18.00" (23 Hole) </option>
//                  <option value="_21_0___27_Hole_">21.0" (27 Hole)  </option>
//                  <option value="_24_0___31_Hole_">24.0" (31 Hole)  </option>
//                  <option value="_36_0___47_Hole_">36.0" (47 Hole)  </option>
//                  <option value="_48_0___63_Hole_">48.0" (63 Hole)  </option>
//               </select>
//            </span>
//         </div>
//      </span>
//   </div>
// </div>
// </div>
//       <!--Child level insertables-->
//       <div>
//          <div class="select-item-dialog-item-row child-item-container os-selectable-item">
//             <div class="select-item-dialog-item child-item" data-bs-original-title="3.00&quot; Aluminum Channel 585442">
//                <!--Child level image/icon/thumbnail container-->
//                <div class="select-item-dialog-thumbnail-container os-no-shrink">
//                   <!--Child level thumbnail-->
//                   <img src="/api/thumbnails/22f83f1be3e53004c07b6a491ec84af2939961cc/s/70x40?t=18bdb24e5837e17e04fd00f7&amp;rejectEmpty=true">
//                </div>

//                <!--Child level display name-->
//                <div class="select-item-dialog-item-name">
//                  3.00" Aluminum Channel 585442
//                </div>
//             </div>
//          </div>
//       </div>
//    </div>
// </div>

//  childContainerDiv        <div class="select-item-dialog-item-row child-item-container os-selectable-item" >
//    dialogItemDiv              <div class="select-item-dialog-item child-item">
//                                   <!--Child level image/icon/thumbnail container-->
//      childThumbnailDiv            <div class="select-item-dialog-thumbnail-container os-no-shrink">
//                                       <!--Child level thumbnail-->
//        imgChildThumbnail              <img src="/api/thumbnails/22f83f1be3e53004c07b6a491ec84af2939961cc/s/70x40?t=18bdb24e5837e17e04fd00f7&amp;rejectEmpty=true">
//                                   </div>
//                                   <!--Child level display name-->
//      childNameDiv                 <div class="select-item-dialog-item-name">
//                                      3.00" Aluminum Channel 585442
//                                   </div>
//                               </div>
//                           </div>
