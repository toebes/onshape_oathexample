import { BTMConfigurationParameterBoolean2550 } from 'onshape-typescript-fetch';
import { JSXFactory } from '../common/factory';

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

export function genBooleanOption(
    optBool: BTMConfigurationParameterBoolean2550,
    onchange?: (e: any) => any
) {
    return (
        <os-boolean-parameter>
            <div
                class="os-param-wrapper os-param-container"
                data-parameter-id={optBool.parameterId}
            >
                <label
                    class="os-param-checkbox"
                    data-bs-html="true"
                    data-bs-original-title={optBool.parameterName}
                    data-bs-placement="right"
                >
                    <input
                        class="os-param-checkbox-input ng-pristine ng-untouched ng-valid ng-not-empty"
                        type="checkbox"
                        data-parameter-value="true"
                        onchange={onchange}
                        checked={optBool.defaultValue}
                    />
                    <span class="os-checkbox-indicator"></span>
                    <span class="os-param-checkbox-label">
                        {optBool.parameterName}
                    </span>
                </label>
            </div>
        </os-boolean-parameter>
    );
}
