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
export function classListAdd(elem: HTMLElement, classlist: string) {
    classlist.split(' ').forEach((val: string) => {
        elem.classList.add(val);
    });
}

export function createDocumentElement(
    tagName: string,
    attributes?: { [index: string]: string }
) {
    const elem = document.createElement(tagName);
    if (attributes !== undefined && attributes !== null) {
        for (let attr in attributes) {
            if (attr === 'class') {
                classListAdd(elem, attributes[attr]);
            } else if (attr === 'textContent') {
                elem.textContent = attributes[attr];
            } else {
                elem.setAttribute(attr, attributes[attr]);
            }
        }
    }
    return elem;
}
/**
 * Show a tooltip for an element after a given time and automatically take it down when they move off the element
 * @param elem
 * @param showTooltip
 * @param hideTooltip
 */
export function waitForTooltip(
    elem: HTMLElement,
    showTooltip: () => void,
    hideTooltip: () => void
) {
    const observer = new MutationObserver(() => {
        mouseoutfunc();
    });

    // If they move the mouse, we simply reset the timer and wait more
    const timeoutfunc = () => {
        elem.removeEventListener('mousemove', mousemovefunc, true);
        if (elem.isConnected) {
            showTooltip();
        }
    };
    const mousemovefunc = () => {
        // cancel the timer
        clearTimeout(moveTimer);
        moveTimer = setTimeout(timeoutfunc, 500);
    };
    const mouseoutfunc = () => {
        observer.disconnect();
        elem.removeEventListener('mouseout', mouseoutfunc, true);
        elem.removeEventListener('mousemove', mousemovefunc, true);
        clearTimeout(moveTimer);
        hideTooltip();
    };

    observer.observe(elem, { childList: true });
    elem.addEventListener('mousemove', mousemovefunc, true);
    elem.addEventListener('mouseout', mouseoutfunc, true);
    let moveTimer = setTimeout(timeoutfunc, 500);
}
