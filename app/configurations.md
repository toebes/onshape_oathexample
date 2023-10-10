# Configurations in Items

When a [`BTInsertableInfo`](https://toebes.github.io/onshape-typescript-fetch/interfaces/BTInsertableInfo.html) item is configurable, the [`configurationParameters`](https://toebes.github.io/onshape-typescript-fetch/interfaces/BTInsertableInfo.html#configurationParameters) field will have valid values (i.e. not `null` or `undefined`).

The routine `outputConfigurationOptions` routine in [`app.ts`](https://github.com/toebes/onshape_oauthexample/blob/main/app/app.ts) does all the magic to create a UI element with the configuration options in it.  The complimentary routine `getConfigValues` in [`app.ts`](https://github.com/toebes/onshape_oauthexample/blob/main/app/app.ts) does all the magic to get the currently selected values and put them into `insertInfo` structure so that the `insertToTarget` selected routine can insert it correctly.

Here's some sample code showing nominally how it is done.

```typescript
    let item : BTInsertableInfo;
    let index: number;

    // Not shown here: Fill in:
    //    Item   is the Insertable that is configurable
    //    index  is set to the entry number so that each insertable gets a unique
    //           value for the UI elements that are created

    // Create a container to hold the UI elements
    const itemParentGroup = createDocumentElement('div', {
         class: 'select-item-parent-group',
    });
    itemTreeDiv.append(itemParentGroup);

    // Create a container to hold the clickable item
    const childContainerDiv = createDocumentElement('div', {
         class: 'select-item-dialog-item-row child-item-container os-selectable-item',
    });
    itemParentGroup.append(childContainerDiv);

    // After determining that this is configurable, output the UI configuration elements
    let insertInfo: configInsertInfo = await this.outputConfigurationOptions(
                    item,
                    index,
                    itemParentGroup
                );

   // Handle when they click on the item to do an insert
    childContainerDiv.onclick = () => {

        // Get the currently selected values from the UI
        insertInfo.configList = this.getConfigValues(index);
        this.insertToTarget(
                        this.documentId,
                        this.workspaceId,
                        this.elementId,
                        item,
                        insertInfo
        );
    };           
```

## InsertToTarget handling of configurations

It is worth noting that `InsertToPartStudio` and `InsertToAssembly` have to process the configuration information differently.

`InsertToPartStudio` calls `buildPartConfiguration` which turns the UI Elements into an array of [`BTMParameter1`](https://toebes.github.io/onshape-typescript-fetch/interfaces/BTMParameter1.html) values.

`InsertToAssembly` calls `buildAssemblyConfiguration` which turns the UI Elements into a single string of `id=value` pairs separated by semicolons.

## Enhancement to `outputConfigurationOptions`

Currently there is no way to pre-load the options to `outputConfigurationOptions`. This means that when inserting from the recently inserted list, it will default to the initial values that were there when the item was first displayed in the UI.  What will need to be done is:

1. When recording the insert of a configurable item, the system should call `buildAssemblyConfiguration` to get the currently selected values as a string. This is the most compact way to store the information.
1. This string should be stored in a new field in the [`BTDocumentSummaryInfo`](https://toebes.github.io/onshape-typescript-fetch/interfaces/BTDocumentSummaryInfo.html) structure or a newly created subclass of it.

   ```typescript
      export interface BTDocumentSummaryInfoConfig extends BTDocumentSummaryInfo {
          selectedConfiguration: string;
      };
   ```

1. Update `outputConfigurationOptions` to look at the `selectedConfiguration` string and pass the information down to `genEnumOption` in [`configurationoptions.tsx`](https://github.com/toebes/onshape_oauthexample/blob/main/app/components/configurationoptions.tsx) to set the value or selected item.  The actual code for these are in [`optionboolean.tsx`](https://github.com/toebes/onshape_oauthexample/blob/main/app/components/optionboolean.tsx) for boolean parameters, [`optionenum.tsx`](https://github.com/toebes/onshape_oauthexample/blob/main/app/components/optionenum.tsx) for enum selectors, [`optionstring.tsx`](https://github.com/toebes/onshape_oauthexample/blob/main/app/components/optionstring.tsx) for strings and [`optionquantity.tsx`](https://github.com/toebes/onshape_oauthexample/blob/main/app/components/optionquantity.tsx) for number values.  `OptEnum` in  [`optionenum.tsx`](https://github.com/toebes/onshape_oauthexample/blob/main/app/components/optionenum.tsx) will probably be the hardest (even if it is the most used) because you will have to create an array mapping the value as defaults.
