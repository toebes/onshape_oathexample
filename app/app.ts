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
import { JTTable } from './common/jttable';
import {
    classListAdd,
    createDocumentElement,
    waitForTooltip,
} from './common/htmldom';

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
    public loadedlimit = 2500; // Maximum number of items we will load
    public targetDocumentElementInfo: BTDocumentElementInfo = {};

    public insertToTarget: (
        documentId: string,
        workspaceId: string,
        elementId: string,
        item: BTInsertableInfo
    ) => void = this.insertToOther;

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
            hideFromMenu: true,
        },
        '14': {
            icon: 'svg-icon-tutorial-element',
            label: 'Custom table samples',
        },
    };
    /**
     * The main entry point for an app
     */
    public startApp(): void {
        // Create the main container
        var div = createDocumentElement('div', { id: 'apptop' });
        this.createPopupDialog(div);

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
        this.setBreadcrumbs([], undefined);

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
     * @param teamroot Preserved team root so that we know when we are processing a folder under a team
     */
    public setBreadcrumbs(
        breadcrumbs: BTGlobalTreeNodeInfo[],
        teamroot: BTGlobalTreeNodeInfo
    ): void {
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
        // Keep track of when we we need to override the next folder entry with the team icon
        let useteamicon = false;
        for (let i = breadcrumbs.length - 1; i >= 0; i--) {
            const node = breadcrumbs[i];

            let breadcrumbdiv: HTMLElement;
            const isLast = i == 0;
            // Assume we won't have to insert the fake team root into the breadcrumb list
            let addteamroot = false;
            if (node.resourceType === 'magic') {
                // This is one of the magic entries.
                let nodeid = node.id;
                let nodename = node.name;
                // When we are dealing with a team, the path to root doesn't tell you that
                // it is part of a team and instead says it is a shared folder.
                // So what we need to do in this case is to insert a magic
                if (nodeid === '12' && teamroot !== undefined) {
                    // 12 is "Shared with me"
                    nodeid = '11'; // 11 is Teams
                    nodename = this.magicInfo[nodeid].label;
                    addteamroot = true;
                    useteamicon = true;
                }
                let magicinfo = this.magicInfo[nodeid];
                if (magicinfo === undefined || magicinfo === null) {
                    // But we don't recognize which magic it is, so
                    breadcrumbdiv = this.createBreadcrumbNode(
                        'svg-icon-error',
                        `${node.id} - NOT FOUND (${node.name})`,
                        isLast && !addteamroot,
                        () => {
                            this.showHome();
                        }
                    );
                } else {
                    // We know which one it is, so use the proper icon
                    // And make it so that when they click they go to the right directory
                    breadcrumbdiv = this.createBreadcrumbNode(
                        magicinfo.icon,
                        nodename,
                        isLast && !addteamroot,
                        () => {
                            this.dumpMagic(nodeid);
                        }
                    );
                }
            } else {
                // Just a normal folder.  make it so that clicking on it
                // navigates to the folder.  However we need to remember
                // that just because it is a folder, doesn't mean it wasn't shared with a team
                let icon: OnshapeSVGIcon = 'svg-icon-folder';
                if (useteamicon || node.resourceType === 'team') {
                    icon = 'svg-icon-team';
                    useteamicon = false;
                }
                breadcrumbdiv = this.createBreadcrumbNode(
                    icon,
                    node.name,
                    isLast,
                    () => {
                        this.processFolder(node, teamroot);
                    }
                );
            }
            breadcrumbsdiv.appendChild(breadcrumbdiv);
            // Did we need to put in the fake team root that was missed in the breadcrumb list?
            if (addteamroot) {
                let teamrootdiv = this.createBreadcrumbNode(
                    'svg-icon-team',
                    teamroot.name,
                    isLast,
                    () => {
                        () => {
                            this.processFolder(teamroot, teamroot);
                        };
                    }
                );
                breadcrumbsdiv.appendChild(teamrootdiv);
                useteamicon = false;
            }
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
            title: title,
            'data-placement': 'bottom',
            textContent: title,
        });
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
        this.hidePopup();
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
                const textspan = createDocumentElement('span', {
                    textContent: magicinfo.label,
                });
                textspan.onclick = () => {
                    this.dumpMagic(magicid);
                };
                span.appendChild(textspan);
                row.add(span);
            }
        }
        dumpNodes.appendChild(table.generate());
        this.setBreadcrumbs([], undefined);
    }
    /**
     * Mark the UI as running.  We disable the dropdown so that you can't request
     * switching while in the middle of running
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
        // If we are in the process of running, we don't want to start things over again
        // so just ignore the call here
        if (this.running) {
            return;
        }
        // Note that we are running and reset the count of entries we have gotten
        this.setRunning(true);
        this.hidePopup();
        this.loaded = 0;

        // Clean up the UI so we can populate it with new entries
        let dumpNodes = document.getElementById('dump');
        if (dumpNodes !== null) {
            dumpNodes.innerHTML = '';
        } else {
            dumpNodes = document.body;
        }
        const container = this.getFileListContainer();
        dumpNodes.appendChild(container);
        // Start the process off with the first in the magic list
        this.processMagicNode(magic);
    }
    /**
     * Append a dump of elements to the current UI
     * @param items Items to append
     * @param teamroot Preserved team root so that we know when we are processing a folder under a team
     */
    public appendElements(
        items: BTGlobalTreeMagicNodeInfo[],
        teamroot: BTGlobalTreeNodeInfo
    ): void {
        // Figure out where we are to add the entries
        let container = this.getFileListContainer();
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

            let rowelem = createDocumentElement('div', {
                class: 'document-version-item-row select-item-dialog-item-row os-selectable-item',
            });
            let selectable = true;
            if (itemInfo.permissionSet !== undefined) {
                if (itemInfo.permissionSet.indexOf('LINK') === -1) {
                    selectable = false;
                    classListAdd(rowelem, 'select-item-disabled-item');
                }
            }

            let iconCol = createDocumentElement('div', {
                class: 'os-thumbnail-image',
            });
            let img = undefined;
            if (item.jsonType === 'team-summary') {
                img = createSVGIcon('svg-icon-team', 'folder-list-icon');
            } else if (item.isContainer) {
                // if item is container
                img = createSVGIcon('svg-icon-folder', 'folder-list-icon');
            } else if (item.jsonType === 'document-summary') {
                // It has an image, so request the thumbnail to be loaded for it
                img = this.createThumbnailImage(itemInfo);
                img.classList.add('os-thumbnail-image');
                img.setAttribute('draggable', 'false');
                img.setAttribute('alt', 'Thumbnail image for a document.');
                img.ondragstart = (ev) => {
                    return false;
                };
            }
            if (img !== undefined) {
                iconCol.appendChild(img);
            }
            rowelem.appendChild(iconCol);

            // Document Name
            const docName = createDocumentElement('span', {
                class: 'select-item-dialog-document-name document-version-picker-document-item',
                textContent: item.name,
            });

            let textCol = createDocumentElement('div', {
                class: 'select-item-dialog-document-name-box os-col',
            });
            textCol.appendChild(docName);
            rowelem.appendChild(textCol);

            rowelem.onmouseover = () => {
                waitForTooltip(
                    rowelem,
                    () => {
                        let rect = rowelem.getBoundingClientRect();
                        this.showPopup(item, rect);
                    },
                    () => {
                        this.hidePopup();
                    }
                );
            };
            if (selectable) {
                if (item.isContainer) {
                    rowelem.onclick = () => {
                        this.processFolder(item, teamroot);
                    };
                } else if (item.jsonType === 'document-summary') {
                    rowelem.onclick = () => {
                        this.checkInsertItem(itemInfo);
                    };
                }
            }
            container.appendChild(rowelem);
        }
    }
    /**
     * Finds the documents container to append entries to.  If one doesn't
     * already exist it will add it in the proper place.
     * @returns Table to append entries to
     */
    public getFileListContainer(): HTMLElement {
        let container = document.getElementById('glist');
        if (container === null) {
            container = createDocumentElement('div', {
                class: 'os-documents-list full-width document-version-picker-section document-version-picker-document-list select-item-dialog-subdialog-content',
                id: 'glist',
            });
            const appelement = this.getAppElement();
            appelement.append(container);
        }
        return container;
    }
    /**
     * Get the element that represents the main container for the application
     * @returns HTMLElement for top of application
     */
    public getAppElement(): HTMLElement {
        let appelement = document.getElementById('app');
        // If for some reason we lost the place it is supposed to go, just append to the body
        if (appelement === null) {
            appelement = document.body;
        }
        return appelement;
    }
    /**
     *
     * @param item
     */
    public showPopup(item: BTGlobalTreeMagicNodeInfo, rect: DOMRect): void {
        const popup = document.getElementById('docinfo');
        if (popup !== null) {
            const itemInfo = item as BTDocumentSummaryInfo;
            // TODO: Move popup above item if it doesn't fit below
            popup.style.left = String(rect.left) + 'px';
            popup.style.top = String(rect.bottom) + 'px';
            popup.style.width = String(rect.width) + 'px';
            popup.style.maxWidth = String(rect.width) + 'px';
            let modifiedby = '';
            if (
                item.modifiedBy !== null &&
                item.modifiedBy !== undefined &&
                item.modifiedBy.name !== null &&
                item.modifiedBy.name !== undefined
            ) {
                modifiedby = item.modifiedBy.name;
            }
            let modifieddate = '';
            if (item.modifiedAt !== null && item.modifiedAt !== undefined) {
                modifieddate = item.modifiedAt.toLocaleString();
            }
            let ownedBy = '';
            if (
                item.owner !== null &&
                item.owner !== undefined &&
                item.owner.name !== null &&
                item.owner.name !== undefined
            ) {
                ownedBy = item.owner.name;
            }
            let createddate = '';
            if (item.createdAt !== null && item.createdAt !== undefined) {
                createddate = item.createdAt.toLocaleString();
            }
            let permissions = '';

            if (itemInfo.permissionSet !== undefined) {
                permissions = '[' + itemInfo.permissionSet.join(', ') + ']';
            }

            this.setElemText('docinfo_name', item.name);
            this.setElemText('docinfo_desc', item.description ?? '');
            // TODO: Reenable the div in the app.css when this gets working
            this.setElemText('docinfo_loc', 'LOCATION TBD');
            this.setElemText('docinfo_owner', ownedBy);
            this.setElemText('docinfo_datecreate', createddate);
            this.setElemText('docinfo_lastmod', modifieddate);
            this.setElemText('docinfo_modifier', modifiedby);
            this.setElemText('docinfo_permissions', permissions);
            popup.style.display = 'block';
        }
    }
    /**
     * Fill in the text content of an element
     * @param id ID of element to update
     * @param content Text content for element
     */
    setElemText(id: string, content: string) {
        const elem = document.getElementById(id);
        if (elem !== null) {
            elem.textContent = content;
        }
    }
    public hidePopup(): void {
        const popup = document.getElementById('docinfo');
        if (popup !== null) {
            popup.style.display = 'none';
        }
    }
    /**
     * Create the popup infrastructure for the file information
     * @param parent Place to put popup DOM element
     */
    public createPopupDialog(parent: HTMLElement): void {
        const popoverMainDiv = createDocumentElement('div', {
            id: 'docinfo',
            class: 'popover popup bs-popover-bottom',
        });
        popoverMainDiv.innerHTML = `<div class="popover-body">
            <div id="docinfo_name" class="popname"></div>
            <div id="docinfo_desc" class="popdesc"></div>
            <div class="poplocdiv">
               <span class="popttl">Location: </span>
               <span id="docinfo_loc" class="poploc">LOCATION TBD</span>
            </div>
            <div class="popusergrp">
               <strong>Owner:</strong> <span id="docinfo_owner"></span> created on <span id="docinfo_datecreate"></span>
            </div>
            <div class="popusergrp">
               <strong>Modified:</strong> <span id="docinfo_lastmod"></span> by <span id="docinfo_modifier"></span>
            </div>
            <div class="poppermit">
               <strong>Permissions:</strong> <span id="docinfo_permissions" class="popperm">LOCATION TBD</span>
            </div>
         </div>`;

        parent.appendChild(popoverMainDiv);
    }
    /**
     * Get the elements in a document
     * @param documentId Document ID
     * @param workspaceId Workspace ID
     * @param elementId Specific element ID
     * @returns Array of BTDocumentElementInfo
     */
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
     *  Ok that's the goal.  It that the insertables API does a good job of filtering for most of that in one call
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
            let wv = 'w';
            let wvid = '';
            if (
                item.recentVersion !== null &&
                item.recentVersion !== undefined
            ) {
                wv = 'v';
                wvid = item.recentVersion.id;
            } else if (
                item.defaultWorkspace !== null &&
                item.defaultWorkspace !== undefined
            ) {
                wv = 'w';
                wvid = item.defaultWorkspace.id;
            }
            // getInsertables
            // /documents/d/{did}/{wv}/{wvid}/insertables"
            const parameters: GetInsertablesRequest = {
                did: item.id,
                wv: wv,
                wvid: wvid,
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
            let donotuseelement: BTInsertableInfo = undefined;
            const insertMap = new Map<string, BTInsertableInfo>();
            const dropParents = new Map<string, Boolean>();
            while (insertables !== undefined && insertables.items.length > 0) {
                for (let element of insertables.items) {
                    if (
                        element.elementType === 'PARTSTUDIO' ||
                        (element.elementType === 'ASSEMBLY' &&
                            insertType === element.elementType)
                    ) {
                        let elementName = (
                            element.elementName ?? ''
                        ).toUpperCase();

                        if (
                            elementName.indexOf('DO NOT USE') < 0 &&
                            elementName.indexOf('LEGACY PART') < 0
                        ) {
                            // We want to save it
                            insertMap[element.id] = element;
                        } else {
                            // Save for the special case of the DO NOT USE ICON which would be the only object in the document
                            donotuseelement = element;
                        }
                        if (
                            element.parentId !== undefined &&
                            element.parentId !== null &&
                            elementName.indexOf('DO NOT USE THESE PARTS') >= 0
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
                    element !== undefined &&
                    element !== null &&
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
            // Special case when we have a document with a do not use and it is the only thing, let them insert it
            if (result.length === 0 && donotuseelement !== undefined) {
                result.push(donotuseelement);
            }
            resolve(result);
        });
    }
    /**
     * Check if an item can be inserted or if we have to prompt the user for more choices.
     * @param item Item to check
     */
    public checkInsertItem(item: BTDocumentSummaryInfo): void {
        this.hidePopup();
        this.getInsertChoices(
            item,
            this.targetDocumentElementInfo.elementType
        ).then((res) => {
            if (res.length === 0) {
                // Nothing was insertable at all, so we just need to let them know that
                alert('Nothing is insertable from this document');
            } else if (res.length === 1) {
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
                        res[0]
                    );
                }
            } else {
                console.log(`${res.length} choices found`);
                this.showItemChoices(item, res);
            }
            //console.log(res);
        });
    }
    /**
     * Show options for a configurable item to insert
     * @param item
     */
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
        // This is what we are creating in the DOM
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
            textContent: parent.name,
        });

        itemParentRow.append(divParentTitle);
        uiDiv.appendChild(itemTreeDiv);

        // Start the process off with the first in the magic list
        for (const item of items) {
            let configurable = false;
            if (
                item.configurationParameters !== undefined &&
                item.configurationParameters !== null
            ) {
                configurable = true;
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
                textContent: item.elementName,
            });
            dialogItemDiv.append(childThumbnailDiv);
            dialogItemDiv.append(childNameDiv);
            childContainerDiv.append(dialogItemDiv);

            if (configurable) {
                childContainerDiv.onclick = () => {
                    console.log(
                        'Need to figure out configuration options settings.. But going to run it anyway'
                    );
                    console.log(item);
                    this.insertToTarget(
                        this.documentId,
                        this.workspaceId,
                        this.elementId,
                        item
                    );
                };
            } else {
                childContainerDiv.onclick = () => {
                    this.insertToTarget(
                        this.documentId,
                        this.workspaceId,
                        this.elementId,
                        item
                    );
                };
            }

            itemParentGroup.append(childContainerDiv);
        }
    }
    /**
     * Display the configuration options for an element
     * @param item Configurable element to output
     * @param itemParentGroup Location to put the configuration option
     */
    public async outputConfigurationOptions(
        item: BTInsertableInfo,
        itemParentGroup: HTMLElement
    ) {
        let wvm = 'v';
        let wvmid = item.versionId ?? undefined;
        if (wvmid === undefined) {
            wvm = 'w';
            wvmid = item.workspaceId;
        }
        const itemConfig = await this.elementApi.getConfiguration({
            did: item.documentId,
            wvm: wvm,
            wvmid: wvmid,
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
                textContent: opt.parameterName,
            });
            spanOSWrapper.append(spanLabel);

            itemParentGroup.append(divRow);

            switch (configMapping[opt.btType]) {
                case configType.configBool: {
                    //         {
                    //             "btType": "BTMConfigurationParameterBoolean-2550",
                    //             "nodeId": "MfEnrg6caclWD4RLi",
                    //             "parameterId": "CheckBox",
                    //             "parameterName": "MakeItRed",
                    //             "defaultValue": true
                    //         },
                    // Configuration value
                    //         {
                    //             "btType": "BTMParameterBoolean-144",
                    //             "nodeId": "MfG9Ciu94p/l7et/Z",
                    //             "parameterId": "CheckBox",
                    //             "value": true
                    //         },

                    const optBool = opt as BTMConfigurationParameterBoolean2550;
                    console.log(
                        `Boolean option ${optBool.parameterName} default=${optBool.defaultValue}`
                    );
                    break;
                }
                case configType.configEnum: {
                    //         {
                    //             "btType": "BTMConfigurationParameterEnum-105",
                    //             "nodeId": "M3EHnVsn3XTZa53Ke",
                    //             "parameterId": "List_xhwsnzXruq3Ri4",
                    //             "parameterName": "Which Extra Block",
                    //             "defaultValue": "Default",
                    //             "enumName": "List_xhwsnzXruq3Ri4_conf",
                    //             "namespace": "",
                    //             "options": [
                    //                 {
                    //                     "btType": "BTMEnumOption-592",
                    //                     "nodeId": "MnV7gQh05+fQmuqci",
                    //                     "option": "Default",
                    //                     "optionName": "Item1"
                    //                 },
                    //                 {
                    //                     "btType": "BTMEnumOption-592",
                    //                     "nodeId": "MGhqJCa5OPBd4+lLL",
                    //                     "option": "Item2",
                    //                     "optionName": "Item2"
                    //                 },
                    //                 {
                    //                     "btType": "BTMEnumOption-592",
                    //                     "nodeId": "MPOPNFAzj/yIOshGn",
                    //                     "option": "Item_3",
                    //                     "optionName": "Item 3"
                    //                 }
                    //             ]
                    //         },
                    //         {
                    //             "btType": "BTMConfigurationParameterEnum-105",
                    //             "nodeId": "M4uNTty2y5T8l/CFE",
                    //             "parameterId": "List_qZ128Eq2HMz4pF",
                    //             "parameterName": "Bottom Square Color",
                    //             "defaultValue": "Default",
                    //             "enumName": "List_qZ128Eq2HMz4pF_conf",
                    //             "namespace": "",
                    //             "options": [
                    //                 {
                    //                     "btType": "BTMEnumOption-592",
                    //                     "nodeId": "MZ95LPxFsFeoDzfu7",
                    //                     "option": "Default",
                    //                     "optionName": "Red"
                    //                 },
                    //                 {
                    //                     "btType": "BTMEnumOption-592",
                    //                     "nodeId": "MzaWkmJyhZdMunIkc",
                    //                     "option": "R",
                    //                     "optionName": "Blue"
                    //                 }
                    //             ]
                    //         }
                    // Current Configuration
                    //         {
                    //             "btType": "BTMParameterEnum-145",
                    //             "nodeId": "MIHuR+jMFKM3B4EUN",
                    //             "parameterId": "List_xhwsnzXruq3Ri4",
                    //             "enumName": "List_xhwsnzXruq3Ri4_conf",
                    //             "namespace": "",
                    //             "value": "Default"
                    //         },
                    //         {
                    //             "btType": "BTMParameterEnum-145",
                    //             "nodeId": "MIVPvJnDzaK8lFe2F",
                    //             "parameterId": "List_qZ128Eq2HMz4pF",
                    //             "enumName": "List_qZ128Eq2HMz4pF_conf",
                    //             "namespace": "",
                    //             "value": "Default"
                    //         }

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
                            textContent: enumopt.optionName,
                        });
                        selector.append(option);
                        console.log(
                            `  ${enumopt.optionName} = ${enumopt.option}`
                        );
                    }
                    break;
                }
                case configType.configString: {
                    //         {
                    //             "btType": "BTMConfigurationParameterString-872",
                    //             "nodeId": "Mj6bWjD/bLdPLQbhf",
                    //             "parameterId": "TestVariable",
                    //             "parameterName": "TestVariable",
                    //             "defaultValue": "Some Value"
                    //         },
                    // CURRENT CONFIGURATION
                    //         {
                    //             "btType": "BTMParameterString-149",
                    //             "nodeId": "MYOSYLAAKhyIVRctv",
                    //             "parameterId": "TestVariable",
                    //             "value": "Some Value"
                    //         },

                    const optString = opt as BTMConfigurationParameterString872;
                    console.log(
                        `String option ${optString.parameterName} default=${optString.defaultValue}`
                    );

                    break;
                }
                case configType.configQuantity: {
                    //         {
                    //             "btType": "BTMConfigurationParameterQuantity-1826",
                    //             "nodeId": "Mmo70rFbGwU68Df/1",
                    //             "parameterId": "LengthVariable",
                    //             "parameterName": "LengthVariable",
                    //             "quantityType": "LENGTH",
                    //             "rangeAndDefault": {
                    //                 "btType": "BTQuantityRange-181",
                    //                 "defaultValue": 1,
                    //                 "location": {
                    //                     "btType": "BTLocationInfo-226",
                    //                     "character": 0,
                    //                     "column": 0,
                    //                     "document": "",
                    //                     "elementMicroversion": "",
                    //                     "endCharacter": 0,
                    //                     "endColumn": 0,
                    //                     "endLine": 0,
                    //                     "languageVersion": 0,
                    //                     "line": 0,
                    //                     "moduleIds": {
                    //                         "btType": "BTDocumentVersionElementIds-1897",
                    //                         "documentId": "",
                    //                         "elementId": "",
                    //                         "versionId": ""
                    //                     },
                    //                     "nodeId": "OM199BEOlSat7Lax",
                    //                     "parseNodeId": "",
                    //                     "topLevel": "",
                    //                     "version": ""
                    //                 },
                    //                 "maxValue": 100000,
                    //                 "minValue": 0,
                    //                 "units": "millimeter"
                    //             }
                    //         },
                    //         {
                    //             "btType": "BTMConfigurationParameterQuantity-1826",
                    //             "nodeId": "M/seEMAIsBKBBZYWx",
                    //             "parameterId": "Angle_Variable",
                    //             "parameterName": "Angle Variable",
                    //             "quantityType": "ANGLE",
                    //             "rangeAndDefault": {
                    //                 "btType": "BTQuantityRange-181",
                    //                 "defaultValue": 1,
                    //                 "location": {
                    //                     "btType": "BTLocationInfo-226",
                    //                     "character": 0,
                    //                     "column": 0,
                    //                     "document": "",
                    //                     "elementMicroversion": "",
                    //                     "endCharacter": 0,
                    //                     "endColumn": 0,
                    //                     "endLine": 0,
                    //                     "languageVersion": 0,
                    //                     "line": 0,
                    //                     "moduleIds": {
                    //                         "btType": "BTDocumentVersionElementIds-1897",
                    //                         "documentId": "",
                    //                         "elementId": "",
                    //                         "versionId": ""
                    //                     },
                    //                     "nodeId": "AaJGdfFtZIPTXkkl",
                    //                     "parseNodeId": "",
                    //                     "topLevel": "",
                    //                     "version": ""
                    //                 },
                    //                 "maxValue": 180,
                    //                 "minValue": 0,
                    //                 "units": "degree"
                    //             }
                    //         },
                    //         {
                    //             "btType": "BTMConfigurationParameterQuantity-1826",
                    //             "nodeId": "MRa0AD/lJCJExUBuN",
                    //             "parameterId": "Integer_Variable",
                    //             "parameterName": "Holes",
                    //             "quantityType": "INTEGER",
                    //             "rangeAndDefault": {
                    //                 "btType": "BTQuantityRange-181",
                    //                 "defaultValue": 1,
                    //                 "location": {
                    //                     "btType": "BTLocationInfo-226",
                    //                     "character": 0,
                    //                     "column": 0,
                    //                     "document": "",
                    //                     "elementMicroversion": "",
                    //                     "endCharacter": 0,
                    //                     "endColumn": 0,
                    //                     "endLine": 0,
                    //                     "languageVersion": 0,
                    //                     "line": 0,
                    //                     "moduleIds": {
                    //                         "btType": "BTDocumentVersionElementIds-1897",
                    //                         "documentId": "",
                    //                         "elementId": "",
                    //                         "versionId": ""
                    //                     },
                    //                     "nodeId": "w2Y9xvyKSWPVRqea",
                    //                     "parseNodeId": "",
                    //                     "topLevel": "",
                    //                     "version": ""
                    //                 },
                    //                 "maxValue": 42,
                    //                 "minValue": 0,
                    //                 "units": ""
                    //             }
                    //         },
                    //         {
                    //             "btType": "BTMConfigurationParameterQuantity-1826",
                    //             "nodeId": "Mv1mu6Q3Y3AK0CpWS",
                    //             "parameterId": "RealVariable",
                    //             "parameterName": "RealVariable",
                    //             "quantityType": "REAL",
                    //             "rangeAndDefault": {
                    //                 "btType": "BTQuantityRange-181",
                    //                 "defaultValue": 1,
                    //                 "location": {
                    //                     "btType": "BTLocationInfo-226",
                    //                     "character": 0,
                    //                     "column": 0,
                    //                     "document": "",
                    //                     "elementMicroversion": "",
                    //                     "endCharacter": 0,
                    //                     "endColumn": 0,
                    //                     "endLine": 0,
                    //                     "languageVersion": 0,
                    //                     "line": 0,
                    //                     "moduleIds": {
                    //                         "btType": "BTDocumentVersionElementIds-1897",
                    //                         "documentId": "",
                    //                         "elementId": "",
                    //                         "versionId": ""
                    //                     },
                    //                     "nodeId": "k0PqqEWhhn+5RtpL",
                    //                     "parseNodeId": "",
                    //                     "topLevel": "",
                    //                     "version": ""
                    //                 },
                    //                 "maxValue": 4242,
                    //                 "minValue": 0,
                    //                 "units": ""
                    //             }
                    //         },
                    // CURRENT CONFIGURATION
                    //         {
                    //             "btType": "BTMParameterQuantity-147",
                    //             "nodeId": "Mc29VgTsa8DroMmRF",
                    //             "parameterId": "LengthVariable",
                    //             "expression": "1 mm",
                    //             "isInteger": false,
                    //             "units": "millimeter",
                    //             "value": 1
                    //         },
                    //         {
                    //             "btType": "BTMParameterQuantity-147",
                    //             "nodeId": "MfOOsDGbkJP0eGPPv",
                    //             "parameterId": "Angle_Variable",
                    //             "expression": "1 deg",
                    //             "isInteger": false,
                    //             "units": "degree",
                    //             "value": 1
                    //         },
                    //         {
                    //             "btType": "BTMParameterQuantity-147",
                    //             "nodeId": "MOexZL5H5t709dSXe",
                    //             "parameterId": "Integer_Variable",
                    //             "expression": "1",
                    //             "isInteger": false,
                    //             "units": "",
                    //             "value": 1
                    //         },
                    //         {
                    //             "btType": "BTMParameterQuantity-147",
                    //             "nodeId": "M6jIL2Bz4RrleG0oB",
                    //             "parameterId": "RealVariable",
                    //             "expression": "1",
                    //             "isInteger": false,
                    //             "units": "",
                    //             "value": 1
                    //         },
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
     * Insert to an unknown tab (generally this is an error)
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
        console.log(
            `Inserting item ${item.id} - ${item.elementName} into Assembly ${documentId}/w/${workspaceId}/e/${elementId}`
        );

        this.setInProgress();

        this.assemblyApi
            .createInstance({
                did: documentId,
                wid: workspaceId,
                eid: elementId,
                bTAssemblyInstanceDefinitionParams: {
                    _configuration: item._configuration,
                    documentId: item.documentId,
                    elementId: item.elementId,
                    featureId: '', // item.featureId,
                    isAssembly: item.elementType == 'ASSEMBLY',
                    isWholePartStudio: false, // TODO: Figure this out
                    microversionId: '', // item.microversionId,  // If you do this, it gives an error 400: Microversions may not be used with linked document references
                    partId: item.deterministicId ?? '',
                    versionId: item.versionId,
                },
            })
            .then(() => {
                this.setInProgress(false);
            })
            .catch((reason) => {
                this.setInProgress(false);

                // TODO: Figure out why we don't get any output when it actually succeeds
                if (reason !== 'Unexpected end of JSON input') {
                    console.log(`failed to create reason=${reason}`);
                }
            });
    }
    /**
     * Change the cursor while an operation is in progress
     * @param cursor Cursor to change to 'progress' and 'default' are good ones
     */
    public setInProgress(inprogress: boolean = true) {
        const element = document.getElementById('top');
        if (inprogress) {
            element.classList.add('waiting');
        } else {
            element.classList.remove('waiting');
        }
    }
    /**
     * Process a single node entry
     * @param uri URI node for the entries to be loaded
     */
    public processMagicNode(magic: string) {
        // uri: string) {
        // Get Onshape to return the list
        this.globaltreenodesApi
            .globalTreeNodesMagic({
                mid: magic,
                getPathToRoot: true,
                includeApplications: false,
                includeAssemblies: true,
                includeBlobs: false,
                includeFSComputedPartPropertyFunctions: false,
                includeFSTables: false,
                includeFeatureStudios: false,
                includeFeatures: false,
                includeFlattenedBodies: true,
                includePartStudios: false,
                includeParts: true,
                includeReferenceFeatures: false,
                includeSketches: true,
                includeSurfaces: true,
                includeVariableStudios: false,
                includeVariables: false,
                includeWires: false,
            })
            .then((res) => {
                this.setBreadcrumbs(res.pathToRoot, undefined);
                this.ProcessNodeResults(res, undefined);
            })
            .catch((err) => {
                // Something went wrong, some mark us as no longer running.
                console.log(`**** Call failed: ${err}`);
                this.setRunning(false);
            });
    }
    /**
     * Dump out all the elements that were returned from Onshape
     * @param info Node entry to be processed
     * @param teamroot TreeNode information for a team root if this folder came from a team
     */
    public ProcessNodeResults(
        info: BTGlobalTreeNodesInfo,
        teamroot: BTGlobalTreeNodeInfo
    ) {
        const nodes = info as BTGlobalTreeNodesInfo;
        // When it does, append all the elements to the UI
        this.appendElements(nodes.items, teamroot);
        // Do we have any more in the list and are we under the limit for the UI
        if (
            info.next !== '' &&
            info.next !== undefined &&
            this.loaded < this.loadedlimit
        ) {
            // We have more entries, so lets put a little "Loading More..." element at the
            // end of the list.  When it becomes visible because they scrolled down or because there
            // is more room on the screen, we will delete that Loading More element and then process
            // the next set of entries
            const container = this.getFileListContainer();
            let rowelem = createDocumentElement('div', {
                class: 'document-version-item-row select-item-dialog-item-row os-selectable-item',
            });

            let textCol = createDocumentElement('div', {
                class: 'select-item-dialog-document-name-box os-col',
                content: 'Loading More...',
            });
            rowelem.appendChild(textCol);
            container.appendChild(rowelem);
            // When the Loading More... becomes visible on the screen, we can load the next element
            const observer = new IntersectionObserver(
                (entry) => {
                    if (entry[0].isIntersecting) {
                        observer.disconnect();
                        rowelem.remove();
                        // Request the UI to jump to the next entry in the list.
                        this.setRunning(true);
                        this.OnshapeRequest(
                            info.next,
                            BTGlobalTreeNodesInfoFromJSON
                        ).then((res: BTGlobalTreeNodesInfo) => {
                            this.ProcessNodeResults(res, teamroot);
                        });
                    }
                },
                { threshold: [0] }
            );
            observer.observe(rowelem);
        }
        this.setRunning(false);
    }
    /**
     * Navigate into a folder and populate the UI with the contents
     * @param item Entry to be processed
     * @param teamroot Preserved team root so that we know when we are processing a folder under a team
     *
     */
    public processFolder(
        item: BTGlobalTreeNodeInfo,
        teamroot: BTGlobalTreeNodeInfo
    ): void {
        // id: string, _name: string, treeHref: string): void {
        // If we are in the process of running, we don't want to start things over again
        // so just ignore the call here
        this.hidePopup();

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
        const container = this.getFileListContainer();
        dumpNodes.appendChild(container);
        if (item.jsonType === 'team-summary') {
            this.globaltreenodesApi
                .globalTreeNodesTeamInsertables({
                    teamId: item.id,
                    getPathToRoot: true,
                    includeAssemblies: true,
                    includeFlattenedBodies: true,
                    includeParts: true,
                    includeSketches: false,
                    includeSurfaces: false,
                })
                .then((res) => {
                    this.setBreadcrumbs(res.pathToRoot, item);
                    this.ProcessNodeResults(res, item);
                })
                .catch((err) => {
                    // Something went wrong, some mark us as no longer running.
                    console.log(`**** Call failed: ${err}`);
                    this.setRunning(false);
                });
        } else {
            this.globaltreenodesApi
                .globalTreeNodesFolderInsertables({
                    fid: item.id,
                    getPathToRoot: true,
                    includeAssemblies: true,
                    includeFlattenedBodies: true,
                    includeParts: true,
                    includeSketches: false,
                    includeSurfaces: false,
                })
                .then((res) => {
                    this.setBreadcrumbs(res.pathToRoot, teamroot);
                    this.ProcessNodeResults(res, teamroot);
                })
                .catch((err) => {
                    // Something went wrong, some mark us as no longer running.
                    console.log(`**** Call failed: ${err}`);
                    this.setRunning(false);
                });
        }
    }
}
