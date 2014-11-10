// Define a way of loading the field selector in the settings

Ext.define('Rally.apps.storyfieldfilter.Settings', {
    singleton: true,
    requires: [
        'Rally.apps.storyfieldfilter.App',
        'Rally.ui.combobox.FieldComboBox'
    ],

    getFields: function(config) {
        var items = [
            {
                name: 'filterByField',
                xtype: 'rallyfieldcombobox',
                model: 'UserStory',
                fieldLabel: 'Filter by',
                listeners: {
                    select: function(combo) {
                        this.fireEvent('fieldselected', combo.getRecord());
                    },
                    ready: function(combo) {
                        combo.store.filterBy(function(record) {
                            var attr = record.get('fieldDefinition').attributeDefinition;
                            return attr && !attr.ReadOnly && attr.Constrained && attr.AttributeType !== 'OBJECT' && attr.AttributeType !== 'COLLECTION';
                        });
                        if (combo.getRecord()) {
                            this.fireEvent('fieldselected', combo.getRecord());
                        }
                    }
                },
                bubbleEvents: ['fieldselected'],

                handlesEvents: {
                    fieldselected: function(record) {
                        Ext.getCmp('wsapiName').setValue(record.raw.name);
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
