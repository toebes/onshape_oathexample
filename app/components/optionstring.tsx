import { BTMConfigurationParameterString872 } from 'onshape-typescript-fetch';
import { JSXFactory } from '../common/factory';

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

export function genStringOption(
    optString: BTMConfigurationParameterString872,
    onchange?: (e: any) => any
) {
    return (
        <os-string-parameter>
            <span
                class="os-param-wrapper os-param-container"
                data-parameter-id={optString.parameterId}
            >
                <label class="os-param-label">{optString.parameterName}</label>
                <input
                    class="os-param-text ng-pristine ng-untouched ng-valid ng-not-empty os-param-form-item"
                    type="text"
                    autocomplete={optString.nodeId}
                    placeholder=""
                    value={optString.defaultValue}
                    onchange={onchange}
                />
            </span>
        </os-string-parameter>
    );
}
