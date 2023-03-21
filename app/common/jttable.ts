/**
 * TSTable - Class for dynamically generating tables in TypeScript
 */

/**
 *
 */
export interface ElemAttributes {
    [key: string]: any;
}
export interface JTTDParms {
    celltype?: string;
    settings?: ElemAttributes;
    content?: HTMLElement | string;
}
export type JTElem = HTMLElement | string | ElemAttributes;
export type JTRowItems = Array<JTElem>;

export interface JTTableParms {
    class?: string;
    caption?: string;
    head?: Array<JTRowItems>;
    body?: Array<JTRowItems>;
    foot?: Array<JTRowItems>;
}
/**
 * Determines if a parameter is a plain string
 * x Item to test
 */
function isString(x: any): x is string {
    return typeof x === 'string';
}

function isTDParms(x: any): x is JTTDParms {
    return x.content !== undefined;
}

export interface JTRowParms {
    class?: string;
    celltype?: string;
    row?: JTRowItems;
}
export function classListAdd(elem: HTMLElement, classlist: string) {
    classlist.split(' ').forEach((val: string) => {
        elem.classList.add(val);
    });
}

/**
 * Determines the type of a parameter for a new row so that you
 * don't have to pass in the class or other attributes if you only
 * want to create a simple row
 * parms
 */
// function isRowParms(parms: JTRowParms | JTRowItems): parms is JTRowParms {
//     return true;
// }

export class JTRow {
    public celltype: string;
    public row: JTRowItems;
    public rowClass: string;
    public attrset: ElemAttributes;
    constructor(parms?: JTRowParms | JTRowItems) {
        this.celltype = 'td';
        this.row = [];
        if (parms !== null && parms !== undefined) {
            if (Array.isArray(parms)) {
                this.row = parms as JTRowItems;
            } else {
                if (parms.celltype !== undefined) {
                    this.celltype = parms.celltype;
                }
                if (parms.row !== undefined) {
                    this.row = parms.row;
                }
                if (parms.class !== undefined) {
                    this.rowClass = parms.class;
                }
            }
        }
    }
    public setCellType(celltype: string): JTRow {
        this.celltype = celltype;
        return this;
    }
    public attr(attrset: ElemAttributes): JTRow {
        this.attrset = attrset;
        return this;
    }
    /**
     * Adds a new element to the row.  This returns the row so you can chain
     * elem Element to be added (string | HTMLElement)
     */
    public add(elem: JTElem): JTRow {
        if (elem !== null && elem !== undefined) {
            this.row.push(elem);
        }
        return this;
    }
    /**
     * Generates the dom object from this Row.  Note that if the row is empty
     * we don't generate anything at all
     */
    public generate(): HTMLElement {
        // If the row is empty, we toss it out
        if (this.row.length === 0) {
            return null;
        }
        const row = document.createElement('tr');
        if (this.rowClass !== undefined) {
            classListAdd(row, this.rowClass);
        }
        if (this.attrset !== undefined) {
            for (let v in this.attrset) {
                row.setAttribute(v, this.attrset[v]);
            }
        }
        for (const item of this.row) {
            let cell: HTMLElement;
            let celltype = this.celltype;
            if (isTDParms(item)) {
                if (item.celltype !== null && item.celltype !== undefined) {
                    celltype = item.celltype;
                }
                cell = document.createElement(celltype);
                if (item.settings !== null && item.settings !== undefined) {
                    for (let v in item.settings) {
                        cell.setAttribute(v, item.settings[v]);
                    }
                }
                if (isString(item.content)) {
                    cell.textContent = item.content as string;
                } else {
                    cell.appendChild(item.content);
                }
            } else {
                cell = document.createElement(celltype);
                // For strings we want to set the text of the cell so that it doesn't
                // attempt to interpret it as html
                if (isString(item)) {
                    cell.textContent = item;
                } else {
                    cell.appendChild(item as HTMLElement);
                }
            }
            row.append(cell);
        }
        return row;
    }
}

/**
 * Creates a new table object that can be used to generate an HTML Table
 */
export class JTTable {
    public class: string = null;
    public caption: string = null;
    public header: Array<JTRow> = [];
    public body: Array<JTRow> = [];
    public footer: Array<JTRow> = [];

    constructor(parms: JTTableParms) {
        this.class = parms.class;
        this.caption = parms.caption;
        if (parms.head !== undefined) {
            for (const rowdata of parms.head) {
                this.addHeaderRow(rowdata);
            }
        }
        if (parms.body !== undefined) {
            for (const rowdata of parms.body) {
                this.addBodyRow(rowdata);
            }
        }
        if (parms.foot !== undefined) {
            for (const rowdata of parms.foot) {
                this.addFooterRow(rowdata);
            }
        }
    }

    /**
     * Adds a new header row and returns it so you can add elements to it
     * parms Header row items to add
     */
    public addHeaderRow(parms?: JTRowParms | JTRowItems): JTRow {
        const newRow = new JTRow(parms).setCellType('th');
        this.header.push(newRow);
        return newRow;
    }

    /**
     * Adds a new body row and returns it so you can add elements to it
     * parms Body row items to add
     */
    public addBodyRow(parms?: JTRowParms | JTRowItems): JTRow {
        const newRow = new JTRow(parms);
        this.body.push(newRow);
        return newRow;
    }

    /**
     * Adds a new Footer row and returns it so you can add elements to it
     * parms Footer row items to add
     */
    public addFooterRow(parms?: JTRowParms | JTRowItems): JTRow {
        const newRow = new JTRow(parms);
        this.footer.push(newRow);
        return newRow;
    }
    /**
     * Generates the final table using everything that was gathered
     */
    public generate(): HTMLElement {
        const table = document.createElement('table');
        classListAdd(table, this.class);
        if (this.header.length) {
            const thead = document.createElement('thead');
            for (const row of this.header) {
                thead.append(row.generate());
            }
            table.append(thead);
        }
        if (this.body.length) {
            const tbody = document.createElement('tbody');
            for (const row of this.body) {
                tbody.append(row.generate());
            }
            table.append(tbody);
        }
        if (this.footer.length) {
            const tfoot = document.createElement('tfoot');
            for (const row of this.footer) {
                tfoot.append(row.generate());
            }
            table.append(tfoot);
        }
        return table;
    }
}
