// Useful debug aids:
//
//        Ext.util.Observable.capture( object, function(event) { console.log(event, arguments);});


Ext.define('Rally.apps.storyfieldfilter.App', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    config: {
        defaultSettings: [
            {  name: 'filterByField', value: 'Feature'}
        ]
    },

    //Identify this app so that we can find it from some unrelated code....
    id: 'MainApp',

    items:[
            {   xtype: 'container',
                itemId: 'header',
                layout: 'column',
                border: 5,
                style: {
                    borderColor: Rally.util.Colors.cyan,
                    borderStyle: 'solid'
                },
                items: [ {
                            xtype: 'container',
                            margin: 10,
                            itemId: 'selectorBox'
                        },
                        {
                            xtype: 'container',
                            margin: 10,
                            itemId: 'disableBox'
                        },
                        {
                            xtype: 'container',
                            itemId: 'notBox',
                            margin: 10
//                            style: {
//                                margins: '0 10 0 10',
//                                borderColor: Rally.util.Colors.logo_red,
//                                borderStyle: 'solid'
//                            }
                        },
                        {
                            xtype: 'container',
                            margin: 10,
                            itemId: 'buttonBox'
                        }
                    ]
            },
            {   xtype: 'container',
                itemId: 'body'
            }
    ],

    storyGrid: null,

    fieldName: undefined,
    fieldTitle: undefined,

    // This function needs to be provided so that the app is instantiated with the extra 'app settings' entry
    // on the app gearwheel.

    getSettingsFields: function ()
    {
        return Rally.apps.storyfieldfilter.Settings.getFields();
    },

    // Single entry point to reloading the grid with the current settings
    _updateGrid: function(app) {

        if ( app.storyGrid !== null) {
            app.storyGrid.destroy();
        }

        app._createGrid(app);

    },

    _createFilter: function(app) {
        //Create a blank filter array and add objects (with properties) according to the checkboxes

        var filters = [];

        if (Ext.getCmp('releaseFilterDisable').getValue() === false)
        {
            var releasefilter = Ext.create('Rally.data.wsapi.Filter',{
                property: 'Release.ObjectID',
                operator: app.down('#releaseNot').getValue() ? '!=' : '=',
                value: Rally.util.Ref.getOidFromRef(app.down('#releaseSelector').getValue())
            });
            filters.push(releasefilter);
        }

        if (Ext.getCmp('fieldFilterDisable').getValue() === false)
        {
            var fieldfilter = Ext.create('Rally.data.wsapi.Filter',{
                property: app.fieldName,
                operator: app.down('#fieldNot').getValue() ? '!=' : '=',
                value: app.down('#fieldSelector').getValue()
            });
            filters.push(fieldfilter);
        }

        if (Ext.getCmp('stateFilterDisable').getValue() === false)
        {
            var statefilter = Ext.create('Rally.data.wsapi.Filter',{
                property: 'ScheduleState',
                operator: app.down('#stateNot').getValue() ? '!=' : '=',
                value: app.down('#stateSelector').getValue()
            });

            filters.push(statefilter);
        }


        return filters;
    },

    _createCfg: function(app) {
        //Create a blank filter array and add objects (with properties) according to the checkboxes

        var colCfgs =
            [
                    {
                        dataIndex: 'FormattedID',
                        text: 'ID'
                    },
                    {
                        dataIndex: 'Name',
                        text: 'Title',
                        flex: 2
                    }
        ];

        if (Ext.getCmp('releaseFilterDisable').getValue() === true)
        {
            var releaseClm = {
                dataIndex: 'Release',
                text: 'Release'
            };
            colCfgs.push(releaseClm);
        }

        if (Ext.getCmp('stateFilterDisable').getValue() === true)
        {
            var stateClm = {
                dataIndex: 'ScheduleState',
                text: 'Schedule State'
            };
            colCfgs.push(stateClm);
        }

        if (Ext.getCmp('fieldFilterDisable').getValue() === true)
        {
            var fieldClm = {
                dataIndex: app.fieldName,
                text: app.fieldTitle
            };
            colCfgs.push(fieldClm);
        }

        return colCfgs;
    },

    _createGrid: function (app, fieldValue, releaseValue, stateValue){

        app.storyGrid = Ext.create('Rally.ui.grid.Grid', {


                autoLoad: false,
                models: [ 'User Story', 'Defect'],
                //We want the fields that make up the filters, so that we can add in the columns as needed
                storeConfig: {
                    fetch: ['Release', 'ScheduleState', app.fieldName],
                    filters: app._createFilter(app)
                },
                columnCfgs: app._createCfg(app)
            });

        app.down('#body').add(app.storyGrid);

    },

    launch: function() {

        var app = this;

        //Check that the settings are configured. If not, set some useful defaults

        var filterField = this.getSetting('filterByField');
        if ( filterField === undefined) {
            this.fieldName = "Feature";
            this.fieldTitle = "Feature";
        }else {
            this.fieldName = filterField;
            this.fieldTitle = this.getSetting('wsapiName');
        }

        //Cascade the creation of comboboxes so that we keep the code simple

        var releaseSelector = Ext.create('Rally.ui.combobox.ReleaseComboBox', {
            fieldLabel: 'Rally Release: ',
            allowNoEntry: true,
            id: 'releaseSelector',
                listeners: {
                    ready: function(thing, value){
                                        app.doStateSelector(app, value);
                                        }

               }
            });

        var disableSelector = Ext.create('Ext.container.Container', {
                items: [
                        {
                            xtype: 'fieldcontainer',
                            region: 'center',
                            border: '0 3 0 3',
                            fieldLabel: 'Filter Disable',
                            defaultType: 'checkboxfield',
                            items: [
                                {
                                    boxLabel: 'Release',
                                    name: 'all',
                                    inputValue: '1',
                                    id: 'releaseFilterDisable'
                                },
                                {
                                    boxLabel: 'State',
                                    name: 'state',
                                    inputValue: '1',
                                    id: 'stateFilterDisable'
                                },
                                {
                                    boxLabel: app.fieldTitle,
                                    name: 'field',
                                    inputValue: '2',
                                    id: 'fieldFilterDisable'
                                }
                            ]
                        }
                ]
        });
        var notSelector = Ext.create('Ext.container.Container', {
                items: [
                        {
                            xtype: 'fieldcontainer',
                            fieldLabel: 'Apply Inverse Filter',
                            defaultType: 'checkboxfield',
                            items: [
                                {
                                    boxLabel: 'Release',
                                    name: 'all',
                                    inputValue: '1',
                                    id: 'releaseNot'
                                },
                                {
                                    boxLabel: 'State',
                                    name: 'state',
                                    inputValue: '1',
                                    id: 'stateNot'
                                },
                                {
                                    boxLabel: app.fieldTitle,
                                    name: 'field',
                                    inputValue: '2',
                                    id: 'fieldNot'
                                }
                            ]
                        }
                ]
        });

        var goButton = Ext.create('Ext.Button', {
                text: 'Run Query',
                color: Rally.util.Colors.logo_red,
                handler: function() { app._updateGrid(app); }
        });



        this.down('#selectorBox').add(releaseSelector);
        this.down('#disableBox').add(disableSelector);
        this.down('#notBox').add(notSelector);
        this.down('#buttonBox').add(goButton);

    },

    doFieldSelector: function(app, releaseValue, stateValue) {

        var fieldSelector = Ext.create('Rally.ui.combobox.FieldValueComboBox', {
                fieldLabel: app.fieldTitle + ": ",
                allowNoEntry: true,
                allowBlank: true,
                autoScroll: true,
                autoExpand: true,
                anyMatch: true,
                id: 'fieldSelector',
                model: 'UserStory',
                field: app.fieldName,
                listeners: {
                    ready: function(thing, fieldValue){
                                        app._createGrid(app, fieldValue, releaseValue, stateValue);
                                        }
               }
            });

        this.down('#selectorBox').add(fieldSelector);
    },

    doStateSelector: function(app, fieldValue, releaseValue) {

        var stateSelector = Ext.create('Rally.ui.combobox.FieldValueComboBox', {
                fieldLabel: 'Current State: ',
                allowBlank: true,
                allowNoEntry: true,
                autoScroll: true,
                autoExpand: true,
                anyMatch: true,
                id: 'stateSelector',
                model: 'UserStory',
                field: 'ScheduleState',
                listeners: {
                    ready: function(thing, stateValue){
                                        app.doFieldSelector(app, releaseValue, stateValue);
                                        }
               }
            });

        this.down('#selectorBox').add(stateSelector);
    }
});
