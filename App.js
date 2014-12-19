// Useful debug aids:
//
//        Ext.util.Observable.capture( object, function(event) { console.log(event, arguments);});


Ext.define('Rally.apps.StoriesByCustomStoryField.App', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    config: {
        defaultSettings: [
            { name: 'filterByField', value: 'State'},
            { name: 'wsapiName',     value: 'State'},
            { name: 'timeBox',       value: false}
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

    // Maximum number of stories that can be fetched in a grid page.
    PageSize: 200,


    fieldName: undefined,
    fieldTitle: undefined,

    // This function needs to be provided so that the app is instantiated with the extra 'app settings' entry
    // on the app gearwheel.

    getSettingsFields: function ()
    {
        return Rally.apps.StoriesByCustomStoryField.Settings.getFields(this);
    },

    // Single entry point to reloading the grid with the current settings
    _updateGrid: function(app) {

        if ( app.storyGrid) {
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
                property: app.timeBoxType + '.ObjectID',
                operator: app.down('#releaseNot').getValue() ? '!=' : '=',
                value: Rally.util.Ref.getOidFromRef(app.down('#timeBoxSelector').getValue())
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
                        dataIndex: 'Name',
                        text: 'Title'
                    },
                    {
                        dataIndex: 'Project',
                        text: 'Team'
                    },
                    {
                        dataIndex: 'SubmittedBy',
                        text: 'Submitted By'
                    },
                    {
                        dataIndex: 'Owner',
                        text: 'Owner'
                    }
        ];

        if ((Ext.getCmp('releaseFilterDisable').getValue() === true) ||
               (Ext.getCmp('releaseNot').getValue() === true) )
        {
            var releaseClm = {
                dataIndex: app.timeBoxType,
                text: app.timeBoxType
            };
            colCfgs.push(releaseClm);
        }

        if ((Ext.getCmp('stateFilterDisable').getValue() === true)  ||
               (Ext.getCmp('stateNot').getValue() === true) )
        {
            var stateClm = {
                dataIndex: 'ScheduleState',
                text: 'Schedule State'
            };
            colCfgs.push(stateClm);
        }

        if ((Ext.getCmp('fieldFilterDisable').getValue() === true)  ||
               (Ext.getCmp('fieldNot').getValue() === true) )
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

        var storiessFound = [];

        var StoryStore = Ext.create('Rally.data.wsapi.TreeStoreBuilder').build( {

                autoLoad: true,
                enableHierarchy: true,
                emptyText: '<p align=center>No Stories Found.</p>',
                models: [ 'UserStory'],
                //We want the fields that make up the filters, so that we can add in the columns as needed
//                storeConfig: {
                    pageSize: app.PageSize, //Set up gird page to this many
                    limitParam: undefined,  //Seems to suggest that set to undefined it will get everything in one go....
                    fetch: [app.timeBoxType, 'ScheduleState', app.fieldName, 'CreationDate'],
                    filters: app._createFilter(app)
//                    }
                }).then({
                    success: function(store) {
                        app.storyGrid = Ext.create('Rally.ui.grid.TreeGrid', {
                                    columnCfgs: app._createCfg(app),
                                    store: store,
                                    sortableColumns: true

                                });
                            }
                });

        app.down('#body').add(app.storyGrid);

    },

    timeBoxType: "Iteration",

    launch: function() {

        var app = this;

        //Check that the settings are configured. If not, set some useful defaults

        var filterField = this.getSetting('filterByField');
        if ( filterField === undefined) {
            app.fieldName = "State";
            app.fieldTitle = "State";
        }else {
            app.fieldName = filterField;
            app.fieldTitle = app.getSetting('wsapiName');
        }
        var timeBoxField = app.getSetting('timeBox');

        if (timeBoxField) {
            app.timeBoxType = "Release";
        }

        //Cascade the creation of comboboxes so that we keep the code simple
        var START_DATE_FIELD = app.timeBoxType + "StartDate";
        var END_DATE_FIELD = app.timeBoxType + "Date";

        if ( app.timeBoxType == "Iteration") {  //Completely inconsistent!
            START_DATE_FIELD = "StartDate";
            END_DATE_FIELD = "EndDate";
        }

        var comboType = "Rally.ui.combobox." + app.timeBoxType + "ComboBox";
        var timeBoxSelector = Ext.create(comboType, {
            fieldLabel: 'Rally ' + app.timeBoxType + ': ',
            allowNoEntry: true,
            id: 'timeBoxSelector',

            storeConfig: {
                fetch: ["Name", START_DATE_FIELD, END_DATE_FIELD, "ObjectID", "State", "PlannedVelocity"],
                sorters: [
                    {property: START_DATE_FIELD, direction: "DESC"},
                    {property: END_DATE_FIELD, direction: "DESC"}
                ],
                model: Ext.identityFn(app.timeBoxType)
            },

            listeners: {
                ready: function(thing, value){
                                    app.doStateSelector(app, value);
                                    },
                select: function(field, e) {
                    app._updateGrid(app);
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
                                    boxLabel: app.timeBoxType,
                                    name: 'all',
                                    value: false,
                                    id: 'releaseFilterDisable'
                                },
                                {
                                    boxLabel: 'ScheduleState',
                                    name: 'state',
                                    value: true,
                                    id: 'stateFilterDisable'
                                },
                                {
                                    boxLabel: app.fieldTitle,
                                    name: 'field',
                                    value: true,
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
                                    boxLabel: app.timeBoxType,
                                    name: 'all',
                                    value: false,
                                    id: 'releaseNot'
                                },
                                {
                                    boxLabel: 'ScheduleState',
                                    name: 'state',
                                    value: false,
                                    id: 'stateNot'
                                },
                                {
                                    boxLabel: app.fieldTitle,
                                    name: 'field',
                                    value: false,
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



        this.down('#selectorBox').add(timeBoxSelector);
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
