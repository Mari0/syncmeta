define([
    'jqueryui',
    'jsplumb',
    'lodash',
    'viewcanvas_widget/AbstractNode',
    'viewcanvas_widget/BooleanAttribute',
    'viewcanvas_widget/IntegerAttribute',
    'viewcanvas_widget/FileAttribute',
    'viewcanvas_widget/SingleValueAttribute',
    'viewcanvas_widget/SingleSelectionAttribute',
    'viewcanvas_widget/SingleMultiLineValueAttribute',
    'text!templates/canvas_widget/model_attributes_node.html'
],/** @lends ModelAttributesNode */function($,jsPlumb,_,AbstractNode,BooleanAttribute,IntegerAttribute,FileAttribute,SingleValueAttribute,SingleSelectionAttribute,SingleMultiLineValueAttribute,modelAttributesNodeHtml) {

    ModelAttributesNode.TYPE = "ModelAttributesNode";

    ModelAttributesNode.prototype = new AbstractNode();
    ModelAttributesNode.prototype.constructor = ModelAttributesNode;
    /**
     * Abstract Class Node
     * @class canvas_widget.ModelAttributesNode
     * @extends canvas_widget.AbstractNode
     * @memberof canvas_widget
     * @constructor
     * @param {string} id Entity identifier of node
     * @param {object} [attr] model attributes
     */
    function ModelAttributesNode(id,attr){

        AbstractNode.call(this,id,ModelAttributesNode.TYPE,0,0,0,0,0);

        /**
         * jQuery object of node template
         * @type {jQuery}
         * @private
         */
        var _$template = $(_.template(modelAttributesNodeHtml,{}));

        /**
         * jQuery object of DOM node representing the node
         * @type {jQuery}
         * @private
         */
        var _$node = AbstractNode.prototype.get$node.call(this).append(_$template).addClass("class");

        /**
         * jQuery object of DOM node representing the attributes
         * @type {jQuery}
         * @private
         */
        var _$attributeNode = _$node.find(".attributes");

        /**
         * Attributes of node
         * @type {Object}
         * @private
         */
        var _attributes = this.getAttributes();

        /**
         * Get JSON representation of the node
         * @returns {Object}
         */
        this.toJSON = function(){
            var json = AbstractNode.prototype.toJSON.call(this);
            json.type = ModelAttributesNode.TYPE;
            return json;
        };

        if(attr){
            for(var attrKey in attr){
                if(attr.hasOwnProperty(attrKey)){
                    switch(attr[attrKey].value){
                        case "boolean":
                            this.addAttribute(new BooleanAttribute(this.getEntityId()+"["+attr[attrKey].key.toLowerCase()+"]",attr[attrKey].key,this));
                            break;
                        case "string":
                            this.addAttribute(new SingleValueAttribute(this.getEntityId()+"["+attr[attrKey].key.toLowerCase()+"]",attr[attrKey].key,this));
                            break;
                        case "integer":
                            this.addAttribute(new IntegerAttribute(this.getEntityId()+"["+attr[attrKey].key.toLowerCase()+"]",attr[attrKey].key,this));
                            break;
                        case "file":
                            this.addAttribute(new FileAttribute(this.getEntityId()+"["+attr[attrKey].key.toLowerCase()+"]",attr[attrKey].key,this));
                            break;
                        default:
                            if(attr[attrKey].options){
                                this.addAttribute(new SingleSelectionAttribute(this.getEntityId()+"["+attr[attrKey].key.toLowerCase()+"]",attr[attrKey].key,this,attr[attrKey].options));
                            }
                            break;
                    }
                }
            }
        } else {
            this.addAttribute(new SingleValueAttribute(this.getEntityId()+"[name]","Name",this));
            this.addAttribute(new SingleMultiLineValueAttribute(this.getEntityId()+"[description]","Description",this));
        }

        this.getLabel().getValue().setValue("Model attributes");

        _$node.find(".label").text("Model Attributes");
        _$node.hide();

        for(var attributeKey in _attributes){
            if(_attributes.hasOwnProperty(attributeKey)){
                _$attributeNode.append(_attributes[attributeKey].get$node());
            }
        }

    }

    return ModelAttributesNode;

});