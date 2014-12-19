// Define a way of loading the field selector in the settings

Ext.define('Rally.apps.StoriesByCustomStoryField.Settings', {
    singleton: true,
    requires: [
        'Rally.apps.StoriesByCustomStoryField.App',
        'Rally.ui.combobox.FieldComboBox'
    ],

    getFields: function(context) {

        var items = [

            {
                name: 'timeBox',
                xtype: 'rallycheckboxfield',
                fieldLabel: 'Use Releases'
            },
            {
                name: 'filterByField',
                xtype: 'rallyfieldcombobox',
                model: 'UserStory',
                fieldLabel: 'Filter by',
                listeners: {
                    select: function(record) {
                        Ext.getCmp('wsapiName').setValue(record.rawValue);
                    },
                    ready: function(combo) {
                        combo.store.filterBy(function(record) {
                            var attr = record.get('fieldDefinition').attributeDefinition;
                            return attr && attr.Filterable && attr.AttributeType !== 'OBJECT' && attr.AttributeType !== 'COLLECTION';
                        });
                        if (combo.getRecord()) {
                            this.fireEvent('fieldselected', combo.getRecord());
                        }
                    }
                }
            },
            {
                name: 'wsapiName',
                id: 'wsapiName',
                fieldLabel: 'WSAPI Field Name',
                xtype: 'rallytextfield',
                readOnly: true,
                border: 0,
                hidden: true
            }

        ];
        return items;
    }

});
