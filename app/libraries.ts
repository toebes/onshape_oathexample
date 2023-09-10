import { BTGlobalTreeNodeInfo } from 'onshape-typescript-fetch/models/BTGlobalTreeNodeInfo';
import {
    BTGlobalTreeNodeMagicDataInfo,
    BTGlobalTreeProxyInfo,
    BTGlobalTreeProxyInfoJSONTyped,
    Preferences,
} from './preferences';
import { GetAssociativeDataWvmEnum } from 'onshape-typescript-fetch/apis/AppAssociativeDataApi';
import { OnshapeAPI } from './onshapeapi';

const SPECIALCHAR = '⏍';

export class Library extends Preferences {
    appName: string;

    libraryChildrenName = SPECIALCHAR + 'children' + SPECIALCHAR;

    constructor(onshape: OnshapeAPI, appName: string) {
        super(onshape);
        this.appName = appName;
    }
    /**
     * Adds a document to a proxy library
     * @param node Document to add to proxy library
     * @param library Library (plain name) to add the document to
     */
    public addNodeToProxyLibrary(
        node: BTGlobalTreeNodeInfo,
        library: string
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.getProxyLibrary(library).then((res) => {
                if (res !== undefined) {
                    const { contents, library } = res;
                    const newContents: BTGlobalTreeNodeMagicDataInfo[] = [];
                    let contentNode: BTGlobalTreeNodeMagicDataInfo;
                    let duplicate: BTGlobalTreeNodeMagicDataInfo;
                    //Iterate contents and don't add duplicates to new list
                    contents.unshift(node);
                    for (let i in contents) {
                        contentNode = contents[i];
                        duplicate = newContents.find(
                            (element: BTGlobalTreeNodeMagicDataInfo) => {
                                return (
                                    element.id === contentNode.id &&
                                    element.configuration === contentNode.configuration
                                );
                            }
                        );
                        if (duplicate === undefined) newContents.push(contentNode);
                        this.setProxyLibrary(library, newContents);
                    }
                } else {
                    resolve(undefined);
                }
            });
        });
    }

    /**
     * Adds a document to a proxy library
     * @param node Document to add to proxy library
     * @param library Library to add the document to
     * @param folder Folder name to add the document to
     */
    public addNodeToProxyFolder(
        node: BTGlobalTreeNodeInfo,
        library: BTGlobalTreeProxyInfo,
        folder: BTGlobalTreeProxyInfo
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.getProxyFolder(library, folder.name).then((contents) => {
                if (contents !== undefined) {
                    const newContents: BTGlobalTreeNodeMagicDataInfo[] = [];
                    let contentNode: BTGlobalTreeNodeMagicDataInfo;
                    let duplicate: BTGlobalTreeNodeMagicDataInfo;
                    //Iterate contents and don't add duplicates to new list
                    contents.unshift(node);
                    for (let i in contents) {
                        contentNode = contents[i];
                        duplicate = newContents.find(
                            (element: BTGlobalTreeNodeMagicDataInfo) => {
                                return (
                                    element.id === contentNode.id &&
                                    element.configuration === contentNode.configuration
                                );
                            }
                        );
                        if (duplicate === undefined) newContents.push(contentNode);
                    }
                    this.setProxyFolder(library, folder, newContents);
                } else {
                    resolve(undefined);
                }
            });
        });
    }

    public removeNodeFromProxyLibrary(
        node: BTGlobalTreeNodeMagicDataInfo,
        library: string
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.getProxyLibrary(library).then(({ contents, library }) => {
                if (contents !== undefined) {
                    const newContents: BTGlobalTreeNodeInfo[] = [];
                    let contentNode: BTGlobalTreeNodeMagicDataInfo;
                    //iterate over favorites list and add all the items that aren't like item
                    for (let i in contents) {
                        contentNode = contents[i];
                        if (
                            contentNode.id !== node.id ||
                            contentNode.configuration !== node.configuration
                        ) {
                            newContents.push(contentNode);
                        }
                    }
                    this.setProxyLibrary(library, newContents);
                } else {
                    resolve(undefined);
                }
            });
        });
    }

    /**
     * Removes a node from a proxy library
     * @param node Document to add to proxy library
     * @param library Library to add the document to
     * @param folder Folder name to add the document to
     */
    public removeNodeFromProxyFolder(
        node: BTGlobalTreeNodeMagicDataInfo,
        library: BTGlobalTreeProxyInfo,
        folder: BTGlobalTreeProxyInfo
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.getProxyFolder(library, folder.name).then((contents) => {
                if (contents !== undefined) {
                    const newContents: BTGlobalTreeNodeInfo[] = [];
                    let contentNode: BTGlobalTreeNodeMagicDataInfo;
                    //iterate over contentss and add all the items that aren't like item
                    for (let i in contents) {
                        contentNode = contents[i];
                        if (
                            contentNode.id !== node.id ||
                            contentNode.configuration !== node.configuration
                        ) {
                            newContents.push(contentNode);
                        }
                    }
                    this.setProxyFolder(library, folder, newContents);
                } else {
                    resolve(undefined);
                }
            });
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
    ): Promise<BTGlobalTreeProxyInfo> {
        return new Promise((resolve, _reject) => {
            const libraryName = this.libraryName(name);
            this.getProxyLibrary(libraryName).then((res) => {
                console.log(res);
                if (res === undefined) {
                    this.onshape.documentApi
                        .createDocument({
                            bTDocumentParams: {
                                ownerId: this.onshape.userId, //parent.id
                                name: libraryName,
                                description:
                                    'Document used to store ProxyLibrary ' + name,
                            },
                        })
                        .then(() => {
                            //NOT GOOD PRACTICE, but it takes onshape some time to make a file
                            setTimeout(() => {
                                this.getProxyLibrary(name).then((res2) => {
                                    resolve(res2.library);
                                });
                            }, 2000);
                        });
                } else {
                    resolve(res.library);
                }
            });
        });
    }
    /**
     * Creates a proxy folder object inside a proxy library
     * Note that the parent must be a proxy-library type.  Entries return
     * @param library The library that the proxy folder is a descendant of
     * @param name Name to associate with the folder
     * @param parent Proxy Library object to contain the folder; will be library if undefined
     * @returns BTGlobalTreeNodeInfo associated with the newly created entry
     */
    public createProxyFolder(
        library: BTGlobalTreeProxyInfo,
        name: string,
        parent?: BTGlobalTreeProxyInfo
    ): Promise<BTGlobalTreeNodeInfo> {
        return new Promise((resolve, _reject) => {
            const proxyFolder: BTGlobalTreeNodeInfo = {
                jsonType: 'proxy-folder',
                isContainer: true,
                name: name,
            };
            if (parent === undefined) {
                this.addNodeToProxyLibrary(proxyFolder, library.name);
            } else {
                this.addNodeToProxyFolder(proxyFolder, library, parent);
            }
            resolve(proxyFolder);
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
            this.setBTGArray(this.libraryChildrenName, entries, library).then((res) => {
                resolve(res);
            });
        });
    }
    /**
     * Gets the contents of a proxy library object
     * @param libraryName Name of proxy library (plain)
     * @returns An object containing the Sorted Array of BTGlobalTreeNodeInfo objects stored in the proxy library and the library node
     */
    public getProxyLibrary(
        libraryName: string
    ): Promise<{ contents: BTGlobalTreeNodeInfo[]; library: BTGlobalTreeProxyInfo }> {
        console.log(libraryName);
        return new Promise((resolve, reject) => {
            this.onshape.documentApi
                .search({
                    bTDocumentSearchParams: {
                        ownerId: this.onshape.userId,
                        limit: 100,
                        when: 'LATEST',
                        sortColumn: '',
                        sortOrder: '',
                        rawQuery: 'type:document name:' + this.libraryName(libraryName),
                        documentFilter: 0,
                    },
                })
                .then((res) => {
                    console.log(res);
                    this.getProxyDocumentFromQuery(res).then(
                        (library: BTGlobalTreeProxyInfo) => {
                            if (library === undefined) {
                                return resolve(undefined);
                            } else {
                                console.log(library === undefined);
                                this.getAppElement(this.appName, library)
                                    .then((res) => {
                                        this.getBTGArray(
                                            this.libraryChildrenName,
                                            library
                                        ).then((contents: BTGlobalTreeNodeInfo[]) => {
                                            console.log(library, contents);
                                            library.jsonType = 'proxy-library';
                                            library.isContainer = true;
                                            library.name = this.libraryName(libraryName);
                                            resolve({ contents, library });
                                        });
                                    })
                                    .catch((err) => {
                                        console.log(err);
                                        resolve(undefined);
                                    });
                            }
                        }
                    );
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    public getProxyDocumentFromQuery(res): Promise<BTGlobalTreeProxyInfo> {
        return new Promise((resolve, reject) => {
            if (res.items.length > 0) {
                const document = BTGlobalTreeProxyInfoJSONTyped(
                    { id: res.items[0].id },
                    true
                );
                console.log(document);

                this.onshape.documentApi
                    .getDocumentWorkspaces({ did: res.items[0].id })
                    .then((res) => {
                        console.log(res);
                        document.wvmid = res[0].id;
                        document.wvm = GetAssociativeDataWvmEnum['w'];

                        resolve(document);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            } else {
                resolve(undefined);
            }
        });
    }
    /**
     * Set the content for a proxy folder object
     * @param folder Previously created proxy folder object (created with createProxyFolder)
     * @param entries Sorted Array of BTGlobalTreeNodeInfo objects to store in the proxy folder
     * @returns Success/Failure
     */
    public setProxyFolder(
        library: BTGlobalTreeProxyInfo,
        folder: BTGlobalTreeNodeInfo,
        entries: Array<BTGlobalTreeNodeInfo>
    ): Promise<boolean> {
        return new Promise((resolve, _reject) => {
            this.setBTGArray(folder.name, entries, library).then((res) => {
                resolve(res);
            });
        });
    }
    /**
     * Get the content for a proxy folder object
     * @param library Library that the folder is a descendant of
     * @param folder Name of proxy folder
     * @returns Sorted Array of BTGlobalTreeNodeInfo objects stored in the proxy folder
     */
    public getProxyFolder(
        library: BTGlobalTreeProxyInfo,
        folder: string
    ): Promise<Array<BTGlobalTreeNodeInfo>> {
        return new Promise((resolve, _reject) => {
            this.getBTGArray(folder, library).then((res) => {
                resolve(res);
            });
        });
    }

    private libraryName(name: String) {
        return SPECIALCHAR + ' ' + name + ' ' + SPECIALCHAR;
    }
    public getLibraryName(libraryName: string) {
        const result = new RegExp(SPECIALCHAR + ' (\\w+) ' + SPECIALCHAR, 'gm').exec(
            libraryName
        );
        if (result !== null) {
            return result[1];
        }
        return undefined;
    }
}
