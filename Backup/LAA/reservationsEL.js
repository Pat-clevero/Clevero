{
    "0": [  // This section runs when the page loads.
        {
            "description": "Filter Guests",
            "if": {
                "eventType": [
                    "PAGE_LOAD"  // Trigger when the page loads.
                ],
                "any": [
                    {
                        "version": "v2",
                        "condition": "function(context) { 
                            return context.fieldStates.getValue(7861).length > 0; 
                            // Check if the field 7861 has a value.
                        }"
                    }
                ]
            },
            "then": [
                {
                    "version": "v2",
                    "fieldId": "8169",  // Target field to update (likely the guest list).
                    "action": "UPDATE",  // Action to take (updating the field).
                    "value": "function(context){ 
                        let tourId = context.fieldStates.getValue(7861); 
                        console.log('tourId', tourId); 
                        // Log the selected tour ID.

                        context.fieldStates.updateState(8169, {
                            inputState: {
                                'filters':[
                                    {
                                        'subject':'7584',
                                        'type':'array',
                                        'operator':'any_of',
                                        'value':tourId
                                        // Filter guests by the selected tour ID.
                                    },
                                    'and',
                                    {
                                        'subject':'11316',
                                        'type':'array',
                                        'operator':'any_of',
                                        'value':['251713']
                                        // Apply additional fixed filter (e.g., guest type).
                                    },
                                    'and',
                                    {
                                        'subject':'11309',
                                        'type':'array',
                                        'operator':'any_of',
                                        'value':['290934']
                                        // Another fixed filter (e.g., status or group).
                                    }
                                ]
                            }
                        });  

                        return context.fieldStates.getValue(8169); 
                        // Return the updated guest list.
                    }"
                }
            ],
            "else": [
                {
                    "version": "v2",
                    "fieldId": "8169",  // If no tour is selected, update the guest list.
                    "action": "UPDATE",
                    "value": "function(context){
                        context.fieldStates.updateState(8169, {
                            inputState: {
                                filters: [
                                    {
                                        subject:'7584',
                                        type:'array',
                                        operator: 'none_of',
                                        value: []
                                        // Apply a filter that excludes all guests.
                                    }
                                ]
                            }
                        });
                    }"
                }
            ]
        }
    ],
    "7861": [  // This section runs when the value of field 7861 changes.
        {
            "description": "Filter Guests",
            "if": {
                "eventType": [
                    "VALUE_CHANGE"  // Trigger when the value of field 7861 changes.
                ],
                "any": [
                    {
                        "version": "v2",
                        "condition": "function(context) { 
                            return context.fieldStates.getValue(7861).length > 0; 
                            // Check if the field 7861 has a value.
                        }"
                    }
                ]
            },
            "then": [
                {
                    "version": "v2",
                    "fieldId": "8169",  // Target field to update (likely the guest list).
                    "action": "NONE",  // Action is to do nothing (likely a placeholder).
                    "value": "function(context){  
                        let tourId = context.fieldStates.getValue(7861); 
                        console.log('tourId->>>', tourId); 
                        // Log the selected tour ID.

                        context.fieldStates.updateState(8169, {
                            inputState: {
                                'filters':[
                                    {
                                        'subject':'7584',
                                        'type':'array',
                                        'operator':'any_of',
                                        'value':[...tourId]
                                        // Filter guests by the selected tour ID.
                                    },
                                    'and',
                                    {
                                        'subject':'11316',
                                        'type':'array',
                                        'operator':'any_of',
                                        'value':['251713']
                                        // Apply additional fixed filter (e.g., guest type).
                                    },
                                    'and',
                                    {
                                        'subject':'11309',
                                        'type':'array',
                                        'operator':'any_of',
                                        'value':['290934']
                                        // Another fixed filter (e.g., status or group).
                                    }
                                ]
                            }
                        });  
                    }"
                }
            ],
            "else": [
                {
                    "version": "v2",
                    "fieldId": "8169",  // If no tour is selected, update the guest list.
                    "action": "UPDATE",
                    "value": "function(context){
                        context.fieldStates.updateState(8169, {
                            inputState: {
                                filters: [
                                    {
                                        subject:'7584',
                                        type:'array',
                                        operator: 'none_of',
                                        value: []
                                        // Apply a filter that excludes all guests.
                                    }
                                ]
                            }
                        });
                    }"
                }
            ]
        }
    ]
}
