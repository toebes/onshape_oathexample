import { BTMConfigurationParameterEnum105 } from 'onshape-typescript-fetch';
import { JSXFactory } from '../common/factory';

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

export function genEnumOption(
    optEnum: BTMConfigurationParameterEnum105,
    onchange?: (e: any) => any
) {
    return (
        <os-enum-parameter>
            <span class="os-param-wrapper os-param-select">
                <label class="os-param-label">
                    <span>{optEnum.parameterName}</span>
                </label>
                <div class="os-select-container os-select-bootstrap dropdown ng-not-empty ng-valid">
                    <span class="os-select-match-text float-start">
                        <select
                            id={optEnum.parameterId}
                            style="border:none; width:100%"
                            onchange={onchange}
                        >
                            {optEnum.options.map((enumopt) => (
                                <option value={enumopt.option}>
                                    {enumopt.optionName}
                                </option>
                            ))}
                        </select>
                    </span>
                </div>
            </span>
        </os-enum-parameter>
    );
}
