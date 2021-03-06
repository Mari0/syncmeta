define([
    'jqueryui',
    'jsplumb',
    'lodash',
    'iwcotw',
    'canvas_widget/AbstractValue',
    'canvas_widget/AbstractAttribute',
    'operations/ot/ValueChangeOperation',
    'operations/non_ot/ActivityOperation',
    'text!templates/canvas_widget/value.html'
],/** @lends ColorValue */function($,jsPlumb,_,IWCOT,AbstractValue,AbstractAttribute,ValueChangeOperation,ActivityOperation,valueHtml) {

    ColorValue.prototype = new AbstractValue();
    ColorValue.prototype.constructor = ColorValue;
    /**
     * ColorValue
     * @class canvas_widget.ColorValue
     * @extends canvas_widget.AbstractValue
     * @memberof canvas_widget
     * @constructor
     * @param {string} id Entity identifier
     * @param {string} name Name of attribute
     * @param {canvas_widget.AbstractEntity} subjectEntity Entity the attribute is assigned to
     * @param {canvas_widget.AbstractNode|canvas_widget.AbstractEdge} rootSubjectEntity Topmost entity in the chain of entity the attribute is assigned to
     */
    function ColorValue(id,name,subjectEntity,rootSubjectEntity){
        var that = this;

        AbstractValue.call(this,id,name,subjectEntity,rootSubjectEntity);

        /**
         * Value
         * @type {string}
         * @private
         */
        var _value = "";

        /**
         * jQuery object of DOM node representing the node
         * @type {jQuery}
         * @private
         */
        var _$node = $(_.template(valueHtml,{name: name}));

        /**
         * Inter widget communication wrapper
         * @type {Object}
         * @private
         */
        var _iwcot = IWCOT.getInstance(CONFIG.WIDGET.NAME.MAIN);

        /**
         * Get chain of entities the attribute is assigned to
         * @returns {string[]}
         */
        var getEntityIdChain = function(){
            var chain = [that.getEntityId()],
                entity = that;
            while(entity instanceof AbstractAttribute){
                chain.unshift(entity.getSubjectEntity().getEntityId());
                entity = entity.getSubjectEntity();
            }
            return chain;
        };

        /**
         * Calculate the new value resulting in the application of the passed Value Change Operation
         * @param {operations.ot.ValueChangeOperation} operation
         * @returns {string}
         */
        var calcNewValue = function(operation){
            if(operation.getType() === CONFIG.OPERATION.TYPE.INSERT) {
                return _value.substr(0,operation.getPosition()) + operation.getValue() + _value.substring(operation.getPosition());
            } else if(operation.getType() === CONFIG.OPERATION.TYPE.DELETE){
                return _value.substr(0,operation.getPosition()) + _value.substring(operation.getPosition()+1);
            }
            return "";
        };

        /**
         * Commit Value Change to value
         * @param {string} type Type of the update (CONFIG.OPERATION.TYPE.INSERT,DELETE)
         * @param {string} value The new value
         * @param {number} position Position where change took place
         * @param {boolean} remote Is the change issued by a remote user
         */
        var commitUpdate = function(type,value,position,remote){
            var selectionStart = _$node[0].selectionStart;
            var selectionEnd = _$node[0].selectionEnd;
            var newSelectionStart, newSelectionEnd;

            if(!_$node.is(":focus")){
                _$node.val(value).blur();
                return;
            }
            switch (type) {
                case CONFIG.OPERATION.TYPE.INSERT:
                    if(remote){
                        if(position <= selectionStart){
                            newSelectionStart = selectionStart + 1;
                            newSelectionEnd = selectionEnd + 1;
                        } else if(position < selectionEnd) {
                            newSelectionStart = selectionStart;
                            newSelectionEnd = selectionEnd + 1;
                        } else {
                            newSelectionStart = selectionStart;
                            newSelectionEnd = selectionEnd;
                        }
                    } else {
                        newSelectionStart = position + 1;
                        newSelectionEnd = position + 1;
                    }
                    break;
                case CONFIG.OPERATION.TYPE.DELETE:
                    if(remote){
                        if(position < selectionStart){
                            newSelectionStart = selectionStart - 1;
                            newSelectionEnd = selectionEnd - 1;
                        } else if(position < selectionEnd) {
                            newSelectionStart = selectionStart;
                            newSelectionEnd = selectionEnd - 1;
                        } else {
                            newSelectionStart = selectionStart;
                            newSelectionEnd = selectionEnd;
                        }
                    } else {
                        newSelectionStart = position;
                        newSelectionEnd = position;
                    }
                    break;
            }
            _$node.val(value).blur();
            _$node[0].selectionStart = newSelectionStart;
            _$node[0].selectionEnd = newSelectionEnd;
        };

        /**
         * Apply a Value Change Operation
         * @param {operations.ot.ValueChangeOperation} operation
         */
        var processValueChangeOperation = function(operation){
            _value = calcNewValue(operation);
            commitUpdate(operation.getType(),_value,operation.getPosition(),operation.getRemote());
        };

        /**
         * Propagate a Value Change Operation to the remote users and the local widgets
         * @param {operations.ot.ValueChangeOperation} operation
         */
        var propagateValueChangeOperation = function(operation){
            operation.setEntityIdChain(getEntityIdChain());
            operation.setRemote(false);
            processValueChangeOperation(operation);
            operation.setRemote(true);
            if(_iwcot.sendRemoteOTOperation(operation)){
                _iwcot.sendLocalNonOTOperation(CONFIG.WIDGET.NAME.ACTIVITY,new ActivityOperation(
                    "ValueChangeActivity",
                    that.getEntityId(),
                    _iwcot.getUser()[CONFIG.NS.PERSON.JABBERID],
                    ValueChangeOperation.getOperationDescription(that.getSubjectEntity().getName(),that.getRootSubjectEntity().getType(),that.getRootSubjectEntity().getLabel().getValue().getValue()),
                    {
                        value: calcNewValue(operation),
                        subjectEntityName: that.getSubjectEntity().getName(),
                        rootSubjectEntityType: that.getRootSubjectEntity().getType(),
                        rootSubjectEntityId: that.getRootSubjectEntity().getEntityId()
                    }
                ).toNonOTOperation());
            }
        };

        /**
         * Propagate a Value Change to the remote users and the local widgets
         * @param type Type of the update (CONFIG.OPERATION.TYPE.INSERT,DELETE)
         * @param value Char that was inserted or deleted
         * @param position Position the change took place
         */
        var propagateValueChange = function(type,value,position){
            var operation = new ValueChangeOperation(that.getEntityId(),value,type,position);
            propagateValueChangeOperation(operation);
            _iwcot.sendLocalOTOperation(CONFIG.WIDGET.NAME.ATTRIBUTE,operation.getOTOperation());
        };

        /**
         * Callback for a remote Value Change Operation
         * @param {operations.ot.ValueChangeOperation} operation
         */
        var remoteValueChangeCallback = function(operation){
            if(operation instanceof ValueChangeOperation && operation.getEntityId() === that.getEntityId()){
                _iwcot.sendLocalOTOperation(CONFIG.WIDGET.NAME.ATTRIBUTE,operation.getOTOperation());
                _iwcot.sendLocalNonOTOperation(CONFIG.WIDGET.NAME.ACTIVITY,new ActivityOperation(
                    "ValueChangeActivity",
                    that.getEntityId(),
                    operation.getOTOperation().getSender(),
                    ValueChangeOperation.getOperationDescription(that.getSubjectEntity().getName(),that.getRootSubjectEntity().getType(),that.getRootSubjectEntity().getLabel().getValue().getValue()),
                    {
                        value: operation.getValue(),
                        subjectEntityName: that.getSubjectEntity().getName(),
                        rootSubjectEntityType: that.getRootSubjectEntity().getType(),
                        rootSubjectEntityId: that.getRootSubjectEntity().getEntityId()
                    }
                ).toNonOTOperation());
                processValueChangeOperation(operation);
            }
        };

        /**
         * Callback for a local Value Change Operation
         * @param {operations.ot.ValueChangeOperation} operation
         */
        var localValueChangeCallback = function(operation){
            if(operation instanceof ValueChangeOperation && operation.getEntityId() === that.getEntityId()){
                propagateValueChangeOperation(operation);
            }
        };

        /**
         * Callback for an undone resp. redone Value Change Operation
         * @param {operations.ot.ValueChangeOperation} operation
         */
        var historyValueChangeCallback = function(operation){
            if(operation instanceof ValueChangeOperation && operation.getEntityId() === that.getEntityId()){
                _iwcot.sendLocalOTOperation(CONFIG.WIDGET.NAME.ATTRIBUTE,operation.getOTOperation());
                processValueChangeOperation(operation);
            }
        };

        var init = function(){
            _$node.off();
            _$node.bind("input",function(){
                //noinspection UnnecessaryLocalVariableJS
                var oldValue = _value;
                var removedString, addedString, i, len;
                var newValue = _$node.val();
                var selectionStart = _$node[0].selectionStart;
                var left = 0;
                var suffixStart = -newValue.length+selectionStart;
                if(suffixStart<0){
                    oldValue = oldValue.slice(0,suffixStart);
                    newValue = newValue.slice(0,suffixStart);
                }
                while(newValue[left]===oldValue[left]&&left<selectionStart-1){
                    left+=1;
                }
                removedString = oldValue.slice(left,oldValue.length-(newValue.length-selectionStart));
                addedString = newValue.slice(left,selectionStart);
                if(addedString.length > 0 && removedString.length > 0 && addedString[0] === removedString[0]){
                    addedString = addedString.slice(1);
                    removedString = removedString.slice(1);
                    left+=1;
                }
                _$node.val(_value);
                _$node[0].selectionStart = left;
                _$node[0].selectionEnd = left;
                for(i = 0, len = removedString.length; i <len; i++){
                    propagateValueChange(CONFIG.OPERATION.TYPE.DELETE,removedString[i],left);
                }
                for(i = 0, len = addedString.length; i <len; i++){
                    propagateValueChange(CONFIG.OPERATION.TYPE.INSERT,addedString[i],left+i);
                }
            });

            _$node.autoGrowInput({
                comfortZone: 10,
                minWidth: 40,
                maxWidth: 1000
            }).trigger("blur");
        };

        //noinspection JSUnusedLocalSymbols
        var init2 = function(){
            _$node.off();
            _$node.keypress(function (ev) {
                var selectionStart, selectionEnd;
                var character = String.fromCharCode(ev.which);
                var deletedChar;

                ev.preventDefault();
                ev.stopPropagation();
                selectionStart = this.selectionStart;
                selectionEnd = this.selectionEnd;
                if (character.length > 0) {
                    while(selectionStart < selectionEnd){
                        deletedChar = $(this).val()[selectionStart];
                        propagateValueChange(CONFIG.OPERATION.TYPE.DELETE,deletedChar,selectionStart);
                        selectionEnd--;
                    }
                    propagateValueChange(CONFIG.OPERATION.TYPE.INSERT,character,selectionStart);
                }
            }).keydown(function(ev){
                    if (ev.which === $.ui.keyCode.BACKSPACE || ev.which === $.ui.keyCode.DELETE) {
                        var selectionStart, selectionEnd;
                        var deletedChar;

                        ev.preventDefault();
                        ev.stopPropagation();
                        selectionStart = this.selectionStart;
                        selectionEnd = this.selectionEnd;
                        if(selectionStart == selectionEnd){
                            if (ev.which === $.ui.keyCode.BACKSPACE) {
                                deletedChar = $(this).val()[selectionStart-1];
                                propagateValueChange(CONFIG.OPERATION.TYPE.DELETE,deletedChar,selectionStart-1);
                            } else if (ev.which === $.ui.keyCode.DELETE) {
                                deletedChar = $(this).val()[selectionStart];
                                propagateValueChange(CONFIG.OPERATION.TYPE.DELETE,deletedChar,selectionStart);
                            }
                        } else {
                            while(selectionStart < selectionEnd){
                                deletedChar = $(this).val()[selectionStart];
                                propagateValueChange(CONFIG.OPERATION.TYPE.DELETE,deletedChar,selectionStart);
                                selectionEnd--;
                            }
                        }
                    }
                });

        };

        /**
         * Set value
         * @param {string} value
         */
        this.setValue = function(value){
            _value = value;
            _$node.val(value);
        };

        /**
         * Get value
         * @returns {string}
         */
        this.getValue = function(){
            return _value;
        };

        /**
         * Get jQuery object of DOM node representing the value
         * @returns {jQuery}
         */
        this.get$node = function(){
            return _$node;
        };

        /**
         * Get JSON representation of the edge
         * @returns {Object}
         */
        this.toJSON = function(){
            var json = AbstractValue.prototype.toJSON.call(this);
            json.value = _value;
            return json;
        };

        /**
         * Set value by its JSON representation
         * @param json
         */
        this.setValueFromJSON = function(json){
            this.setValue(json.value);
        };

        /**
         * Register inter widget communication callbacks
         */
        this.registerCallbacks = function(){
            _iwcot.registerOnLocalDataReceivedCallback(localValueChangeCallback);
            _iwcot.registerOnRemoteDataReceivedCallback(remoteValueChangeCallback);
            _iwcot.registerOnHistoryChangedCallback(historyValueChangeCallback);
        };

        /**
         * Unregister inter widget communication callbacks
         */
        this.unregisterCallbacks = function(){
            _iwcot.unregisterOnLocalDataReceivedCallback(localValueChangeCallback);
            _iwcot.unregisterOnRemoteDataReceivedCallback(remoteValueChangeCallback);
            _iwcot.unregisterOnHistoryChangedCallback(historyValueChangeCallback);
        };

        init();

        if(_iwcot){
            that.registerCallbacks();
        }
    }

    return ColorValue;

});