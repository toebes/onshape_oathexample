/**
 * Copyright (c) 2023 John Toebes, Chris Peratrovich
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
import {
    BTGlobalTreeNodeInfo,
    GetAssociativeDataWvmEnum,
} from 'onshape-typescript-fetch';
import { InitStorage, JTStorage } from './common/jtstore';

export interface BTGlobalTreeProxyInfo extends BTGlobalTreeNodeInfo {
    // jsonType = 'proxy-library', 'proxy-folder', or 'proxy-element'
    wvm?: typeof GetAssociativeDataWvmEnum;
    wvmid?: string;
    elementId?: string;
}

export class Preferences {
    public prefname: string = 'unset';
    public storage: JTStorage;
    public constructor() {
        this.storage = InitStorage();
    }
    public openPreferences(name: string): Promise<BTGlobalTreeNodeInfo> {
        return new Promise((resolve, _reject) => {
            this.prefname = name;
            resolve(undefined);
        });
    }

    /**
     * Preserve the last location that we were at
     * @param location Location to save - Array of BTGlobalTreeNodeInfo representing the full path to the location
     */
    public setLastKnownLocation(location: Array<BTGlobalTreeNodeInfo>): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.storage.set(`${this.prefname}_lastloc`, location);
            resolve(true);
        });
    }
    /**
     * Retrieve the last location saved with setLastKnownLocation
     * @returns Saved Array of BTGlobalTreeNodeInfo representing the full path to the location
     */
    public getLastKnownLocation(): Promise<Array<BTGlobalTreeNodeInfo>> {
        return new Promise((resolve, _reject) => {
            let result: Array<BTGlobalTreeNodeInfo> = this.storage.getJSON(
                `${this.prefname}_lastloc`
            );
            resolve(result);
        });
    }
    /**
     * Creates an empty JSON element stored in the user preferences with the given name.  If it already exists, it returns false (does not throw an exception).
     * @param name String for entry to be created, generally associated with the application name
     */
    public createCustom(name: string): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            const val = this.storage.getJSON(`${this.prefname}_${name}`);
            resolve(val !== undefined && val !== null);
        });
    }
    /**
     * Stores the element as JSON in the preferences associated with the name.  If the element doesn’t exist in the preferences, it returns false (does not thrown an exception)
     * @param name Name of element to set
     * @param element Value to be stored into element
     */
    public setCustom(name: string, element: any): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.storage.set(`${this.prefname}_${name}`, element);
            resolve(true);
        });
    }
    /**
     * Returns the element which was stored as a JSON object as an object.  If the element doesn’t exist the default value is returned.
     * @param name Name of element to retrieve
     * @param default_val Default value to return if the element wasn't already set
     */
    public getCustom(name: string, default_val: any): Promise<any> {
        return new Promise((resolve, _reject) => {
            let result = this.storage.getJSON(`${this.prefname}_${name}`);
            if (result === undefined || result === null) {
                result = default_val;
            }
            resolve(result);
        });
    }
    /**
     * Add an item to the list of recently inserted items associated with the application.  Note that it only stores the last 50 sorted by date
     * @param item Item to add to the insert list
     */
    public addRecentlyInserted(
        item: BTGlobalTreeNodeInfo,
        limit: number = 50,
        name: string = 'recent'
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            resolve(false);
        });
    }
    /**
     *  Last 50 entries sent to addRecentlyInserted sorted by date.
     * @returns
     */
    public getAllRecentlyInserted(
        name: string = 'recent'
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        return new Promise((resolve, _reject) => {
            resolve([]);
        });
    }

    /**
     * Set an arbitrary list of entries for the application to use as the home
     * @param items Array of items to store
     * @returns Success/failure indicator
     */
    public setHome(items: Array<BTGlobalTreeNodeInfo>): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.storage.set(`${this.prefname}_home`, items);
            resolve(true);
        });
    }
    /**
     * returns what was sent to setHome
     * @returns Array of BTGlobalTreeNodeInfo items previously stored (or [] if none had ever been stored)
     */
    public getHome(): Promise<Array<BTGlobalTreeNodeInfo>> {
        return new Promise((resolve, _reject) => {
            let result: Array<BTGlobalTreeNodeInfo> = this.storage.getJSON(
                `${this.prefname}_${name}`
            );
            if (result === undefined || result === null) {
                result = [];
            }
            resolve(result);
        });
    }
    /*********************************************************************************
     *                         PROXY LIBRARY/FOLDER ROUTINES                         *
     *********************************************************************************/
    /**
     * Creates a proxy Library object as a real Onshape document in a given location.
     * Note that the parent must be a real Onshape folder location
     * @param parent Location in Onshape hierarchy to create the new folder object
     * @param name Name to associate with the library
     */
    public createProxyLibrary(
        parent: BTGlobalTreeNodeInfo,
        name: string
    ): Promise<BTGlobalTreeNodeInfo> {
        return new Promise((resolve, _reject) => {
            const result: BTGlobalTreeNodeInfo = {
                jsonType: 'proxy-library',
                name: name,
            };
            resolve(undefined);
        });
    }
    /**
     * Creates a proxy folder object inside a proxy library
     * Note that the parent must be a proxy-library type.  Entries return
     * @param parent Proxy Library object to contain the folder
     * @param name Name to associate with the folder
     * @returns BTGlobalTreeNodeInfo associated with the newly created entry
     */
    public createProxyFolder(
        parent: BTGlobalTreeNodeInfo,
        name: string
    ): Promise<BTGlobalTreeNodeInfo> {
        return new Promise((resolve, _reject) => {
            const result: BTGlobalTreeNodeInfo = { jsonType: 'proxy-foler', name: name };
            resolve(undefined);
        });
    }
    // TODO: Do we need a setProxyMetaData/getProxyMetaData routine to store extra
    //       information with the proxy library objects (such as owner, contact info, website...)
    /**
     * Sets the metadata for a proxy item
     * @param entry Proxy item (proxy-folder or proxy-library) to set metadata for
     * @param metadata Arbitrary metadata to set
     */
    public setProxyMetadata(
        entry: BTGlobalTreeNodeInfo,
        metadata: any
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            resolve(false);
        });
    }
    /**
     * Retrieves the metadata for a proxy item
     * @param entry Proxy item (proxy-folder or proxy-library) to set metadata for
     * @returns Arbitrary metadata set with setProxyMetadata
     */
    getProxyMetadata(entry: BTGlobalTreeNodeInfo): Promise<any> {
        return new Promise((resolve, _reject) => {
            resolve(undefined);
        });
    }
    /**
     * Set the content for a proxy library object
     * @param library Previously created proxy library object (created with createProxyLibrary)
     * @param entries Sorted array of BTGlobalTreeNodeInfo objects representing the contents of the library
     */
    public setProxyLibrary(
        library: BTGlobalTreeNodeInfo,
        entries: Array<BTGlobalTreeNodeInfo>
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            resolve(false);
        });
    }
    /**
     * Gets the contents of a proxy library object
     * @param library Previously created proxy library object (created with createProxyLibrary)
     * @returns Sorted Array of BTGlobalTreeNodeInfo objects stored in the proxy library
     */
    public getProxyLibrary(
        library: BTGlobalTreeNodeInfo
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        return new Promise((resolve, _reject) => {
            resolve([]);
        });
    }
    /**
     * Set the content for a proxy folder object
     * @param folder Previously created proxy folder object (created with createProxyFolder)
     * @param entries Sorted Array of BTGlobalTreeNodeInfo objects to store in the proxy folder
     * @returns Success/Failure
     */
    public setProxyFolder(
        folder: BTGlobalTreeNodeInfo,
        entries: Array<BTGlobalTreeNodeInfo>
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            resolve(false);
        });
    }
    /**
     * Get the content for a proxy folder object
     * @param folder Previously created proxy folder object (created with createProxyFolder)
     * @returns Sorted Array of BTGlobalTreeNodeInfo objects stored in the proxy folder
     */
    public getProxyFolder(
        folder: BTGlobalTreeNodeInfo
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        return new Promise((resolve, _reject) => {
            resolve([]);
        });
    }
}
