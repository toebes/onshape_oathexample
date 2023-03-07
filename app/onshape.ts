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
'use strict';

export interface thumbNailSizeItem {
    size: string;
    sheetName: string;
    viewOrientation: string;
    href: string;
    uniqueId: string;
    mediaType: string;
    renderMode: string;
}

export interface thumbnailItem {
    sizes: thumbNailSizeItem[];
    secondarySizes: thumbNailSizeItem[];
    id: string;
    href: string;
}

export interface documentSummary {
    jsonType: string;
    public: boolean;
    permission: string;
    defaultElementId: string;
    recentVersion: string;
    hasRelevantInsertables: boolean;
    canUnshare: boolean;
    userAccountLimitsBreached: boolean;
    supportTeamUserAndShared: boolean;
    isUsingManagedWorkflow: boolean;
    likedByCurrentUser: boolean;
    sequence: string;
    tags: string[];
    documentType: number;
    projectId: string;
    thumbnail: thumbnailItem;
    defaultWorkspace: {
        canDelete: boolean;
        isReadOnly: boolean;
        parent: string;
        type: string;
        lastModifier: string;
        description: string;
        creator: string;
        modifiedAt: string;
        documentId: string;
        createdAt: string;
        thumbnail: string;
        microversion: string;
        parents: string;
        overrideDate: string;
        name: string;
        id: string;
        href: string;
    };
    parentId: string;
    permissionSet: string[];
    trash: boolean;
    totalWorkspacesUpdating: number;
    totalWorkspacesScheduledForUpdate: number;
    documentLabels: string;
    numberOfTimesReferenced: number;
    numberOfTimesCopied: number;
    likes: number;
    notes: string;
    notRevisionManaged: boolean;
    createdWithEducationPlan: boolean;
    anonymousAccessAllowed: boolean;
    anonymousAllowsExport: boolean;
    trashedAt: string;
    hasReleaseRevisionableObjects: boolean;
    isOrphaned: boolean;
    owner: {
        type: number;
        isEnterpriseOwnedResource: boolean;
        image: string;
        name: string;
        id: string;
        href: string;
    };
    unparentHref: string;
    resourceType: string;
    isMutable: boolean;
    isContainer: boolean;
    canMove: boolean;
    description: string;
    modifiedAt: string;
    createdAt: string;
    createdBy: {
        state: number;
        image: string;
        name: string;
        id: string;
        href: string;
    };
    modifiedBy: {
        state: number;
        image: string;
        name: string;
        id: string;
        href: string;
    };
    isEnterpriseOwned: boolean;
    name: string;
    id: string;
    href: string;
}
