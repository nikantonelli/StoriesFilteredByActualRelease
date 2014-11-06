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
                items: [ {
                            xtype: 'container',
                            itemId: 'selectorBox'
                        },
                        {
                            xtype: 'container',
                            itemId: 'disableBox'
                        }
                    ]
            },
            {   xtype: 'container',
                itemId: 'body'
            }
    ],

    storyGrid: null,

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
                operator: '=',
                value: Rally.util.Ref.getOidFromRef(app.down('#releaseSelector').getValue())
            });
            filters.push(releasefilter);
        }

        if (Ext.getCmp('fieldFilterDisable').getValue() === false)
        {
            var fieldfilter = Ext.create('Rally.data.wsapi.Filter',{
                property: 'c_ActualReleaseNumber',
                operator: '=',
                value: app.down('#fieldSelector').getValue()
            });
            filters.push(fieldfilter);
        }

        if (Ext.getCmp('stateFilterDisable').getValue() === false)
        {
            var statefilter = Ext.create('Rally.data.wsapi.Filter',{
                property: 'ScheduleState',
                operator: '=',
                value: app.down('#stateSelector').getValue()
            });

            filters.push(statefilter);
        }


        return filters;
    },

    _createGrid: function (app, fieldValue, releaseValue, stateValue){

           app.storyGrid = Ext.create('Rally.ui.grid.Grid', {

                models: [ 'User Story', 'Defect'],
                fetch: ['FormattedID', 'Name', 'ScheduleState'],
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
                            dataIndex: 'Name',
                            flex: 1
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
        store.load();

        //Add listeners to change onto dropdowns. To keep the code simple,
        // I am not going to pass the value, but refetch it.
        Ext.getCmp('releaseSelector').on( {
                            change: function(thing, value){
                                app._updateGrid(app);
                            }
                    });

        Ext.getCmp('fieldSelector').on( {
                            change: function(thing, value){
                                app._updateGrid(app);
                            }
                    });

        Ext.getCmp('stateSelector').on( {
                            change: function(thing, value){
                                app._updateGrid(app);
                            }
                    });

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
                                    boxLabel: 'Actual Release',
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

        Ext.getCmp('releaseFilterDisable').on ({
                            change: function (thing, value) {
                                        app._updateGrid(app);
                                        }
                            });

        Ext.getCmp('fieldFilterDisable').on ({
                            change: function (thing, value) {
                                        app._updateGrid(app);
                                        }
                            });
        Ext.getCmp('stateFilterDisable').on ({
                            change: function (thing, value) {
                                        app._updateGrid(app);
                                        }
                            });


        this.down('#selectorBox').add(releaseSelector);
        this.down('#disableBox').add(disableSelector);

    },

    doFieldSelector: function(app, releaseValue) {

        var fieldSelector = Ext.create('Rally.ui.combobox.FieldValueComboBox', {
                fieldLabel: 'Actual Release: ',
                allowNoEntry: true,
                allowBlank: true,
                autoScroll: true,
                autoExpand: true,
                anyMatch: true,
                id: 'fieldSelector',
                model: 'UserStory',
                field: 'c_ActualReleaseNumber',
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
