// Useful debug aids:
//
//        Ext.util.Observable.capture( object, function(event) { console.log(event, arguments);});


Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    requries: [
        'Rally.ui.tree.TreeGrid'
    ],
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
                            margin: 10,
                            itemId: 'notBox'
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

    fieldName: "Feature",
    fieldTitle: "Feature",

    _updateGrid: function(app) {

        if ( app.storyGrid !== null) {
            app.storyGrid.destroy();
        }

        app._createGrid(app,
                        app.down('#fieldSelector').getValue(),
                        app.down('#releaseSelector').getValue(),
                        app.down('#stateSelector').getValue()
        );

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
                        text: 'ID',
                        dataIndex: 'FormattedID'
                    },
                    {
                        text: 'Title',
                        dataIndex: 'Name',
                        flex: 1
                    }
     ];


        if (Ext.getCmp('releaseFilterDisable').getValue() === true)
        {
            var releaseClm = {
                text: 'Release',
                dataIndex: 'Release.Name'
            };
            colCfgs.push(releaseClm);
        }

        if (Ext.getCmp('fieldFilterDisable').getValue() === true)
        {
            var fieldClm = {
                text: app.fieldTitle,
                dataIndex: app.fieldName
            };
            colCfgs.push(fieldClm);
        }

        if (Ext.getCmp('stateFilterDisable').getValue() === true)
        {
            var stateClm = {
                text: 'Schedule State',
                dataIndex: 'ScheduleState'
            };
            colCfgs.push(stateClm);
        }


        return colCfgs;
    },

    _createGrid: function (app, fieldValue, releaseValue, stateValue){

           app.storyGrid = Ext.create('Rally.ui.grid.Grid', {

                //We will rely on the default 'fetch' settings
                autoLoad: false,
                models: [ 'User Story', 'Defect'],
                storeConfig: {

                    filters:[]
                },
                columnCfgs: [
                    {
                        text: 'ID',
                        dataIndex: 'FormattedID'
                    },
                    {
                        text: 'Title',
                        dataIndex: 'Name'
                    },
                    {
                        text: 'State',
                        dataIndex: 'ScheduleState'
                    }
                ]
            });

        // Now re-add the filter
        var store = app.storyGrid.getStore();
        store.clearFilter(true);
        store.filter(app._createFilter(app));

        // Reset the columnCfgs of the grid
//debugger;
//        var colCfgs = app._createCfg(app);


//        for  (var j = 0; j < colCfgs.length ; j++) {
//                    app.storyGrid.setColumnCfgs(colCfgs);
  //      }


        //Add listeners to change onto dropdowns. To keep the code simple,
        // I am not going to pass the value, but refetch it.
//        Ext.getCmp('releaseSelector').on( {
//                            change: function(thing, value){
//                                app._updateGrid(app);
//                            }
//                    });
//
//        Ext.getCmp('fieldSelector').on( {
//                            change: function(thing, value){
//                                app._updateGrid(app);
//                            }
//                    });
//
//        Ext.getCmp('stateSelector').on( {
//                            change: function(thing, value){
//                                app._updateGrid(app);
//                            }
//                    });

        app.down('#body').add(app.storyGrid);

    },

    launch: function() {

        var app = this;

        //Cascade the creation of comboboxes so that we keep the code simple

        var releaseSelector = Ext.create('Rally.ui.combobox.ReleaseComboBox', {
            fieldLabel: 'Rally Release: ',
            allowNoEntry: true,
            id: 'releaseSelector',
                listeners: {
                    ready: function(thing, value){
                                        app.doFieldSelector(app, value);
                                        }

               }
            });

        var disableSelector = Ext.create('Ext.container.Container', {
                items: [
                        {
                            xtype: 'fieldcontainer',
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
                                    boxLabel: app.fieldTitle,
                                    name: 'field',
                                    inputValue: '2',
                                    id: 'fieldFilterDisable'
                                },
                                {
                                    boxLabel: 'State',
                                    name: 'state',
                                    inputValue: '1',
                                    id: 'stateFilterDisable'
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
                                    boxLabel: app.fieldTitle,
                                    name: 'field',
                                    inputValue: '2',
                                    id: 'fieldNot'
                                },
                                {
                                    boxLabel: 'State',
                                    name: 'state',
                                    inputValue: '1',
                                    id: 'stateNot'
                                }
                            ]
                        }
                ]
        });

        var goButton = Ext.create('Ext.Button', {
                text: 'Run Query',
                handler: function() { app._updateGrid(app); }
        });



        this.down('#selectorBox').add(releaseSelector);
        this.down('#disableBox').add(disableSelector);
        this.down('#notBox').add(notSelector);
        this.down('#buttonBox').add(goButton);

    },

    doFieldSelector: function(app, releaseValue) {

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
                                        app.doStateSelector(app, fieldValue, releaseValue);
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
                                        app._createGrid(app, fieldValue, releaseValue, stateValue);
                                        }
               }
            });

        this.down('#selectorBox').add(stateSelector);
    }
});
