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
import {
    BTConfigurationResponse2019,
    BTMConfigurationParameterBoolean2550,
    BTMConfigurationParameterEnum105,
    BTMConfigurationParameterQuantity1826,
    BTMConfigurationParameterString872,
} from 'onshape-typescript-fetch';
import { JSXFactory } from '../common/factory';
import { OptBool } from './optionboolean';
import { OptQuantity } from './optionquantity';
import { OptEnum } from './optionenum';
import { OptString } from './optionstring';

export function genEnumOption(
    itemConfig: BTConfigurationResponse2019,
    onchange?: (e: any) => any,
    ongenerate?: (e: any) => any
) {
    return (
        <div class="select-item-configuration-selector">
            <os-parameter-list-view>
                {itemConfig.configurationParameters.map((opt) => {
                    return (
                        <os-parameter-group group="group">
                            <div
                                class="os-parameter-list-item os-param-fill-first-column"
                                data-parameter-id={opt.parameterId}
                            >
                                {opt.btType ===
                                'BTMConfigurationParameterBoolean-2550' ? (
                                    <OptBool
                                        value={
                                            opt as BTMConfigurationParameterBoolean2550
                                        }
                                        onchange={onchange}
                                    />
                                ) : opt.btType === 'BTMConfigurationParameterEnum-105' ? (
                                    <OptEnum
                                        value={opt as BTMConfigurationParameterEnum105}
                                        onchange={onchange}
                                    />
                                ) : opt.btType ===
                                  'BTMConfigurationParameterString-872' ? (
                                    <OptString
                                        value={opt as BTMConfigurationParameterString872}
                                        onchange={onchange}
                                    />
                                ) : opt.btType ===
                                  'BTMConfigurationParameterQuantity-1826' ? (
                                    <OptQuantity
                                        value={
                                            opt as BTMConfigurationParameterQuantity1826
                                        }
                                        onchange={onchange}
                                    />
                                ) : (
                                    <></>
                                )}
                            </div>
                        </os-parameter-group>
                    );
                })}
                {itemConfig.configurationParameters.length > 1 ? (
                    <div class="select-item-generate-button-holder">
                        <button
                            class="os-button os-outline select-item-generate-button"
                            onclick={ongenerate}
                            disabled="disabled"
                        >
                            <span>Generate</span>
                        </button>
                        ;
                    </div>
                ) : null}
            </os-parameter-list-view>
        </div>
    );
}
