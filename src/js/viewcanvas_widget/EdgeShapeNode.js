define([
    'jqueryui',
    'jsplumb',
    'lodash',
    'viewcanvas_widget/AbstractNode',
    'viewcanvas_widget/SingleSelectionAttribute',
    'viewcanvas_widget/SingleValueAttribute',
    'viewcanvas_widget/SingleColorValueAttribute',
    'viewcanvas_widget/SingleMultiLineValueAttribute',
    'viewcanvas_widget/BooleanAttribute',
    'text!templates/canvas_widget/edge_shape_node.html'
],/** @lends EdgeShapeNode */function($,jsPlumb,_,AbstractNode,SingleSelectionAttribute,SingleValueAttribute,SingleColorValueAttribute,SingleMultiLineValueAttribute,BooleanAttribute,edgeShapeNodeHtml) {

    EdgeShapeNode.TYPE = "Edge Shape";
    EdgeShapeNode.DEFAULT_WIDTH = 150;
    EdgeShapeNode.DEFAULT_HEIGHT = 150;

    EdgeShapeNode.prototype = new AbstractNode();
    EdgeShapeNode.prototype.constructor = EdgeShapeNode;
    /**
     * Abstract Class Node
     * @class canvas_widget.EdgeShapeNode
     * @extends canvas_widget.AbstractNode
     * @memberof canvas_widget
     * @constructor
     * @param {string} id Entity identifier of node
     * @param {number} left x-coordinate of node position
     * @param {number} top y-coordinate of node position
     * @param {number} width Width of node
     * @param {number} height Height of node
     * @param {number} zIndex Position of node on z-axis
     */
    function EdgeShapeNode(id,left,top,width,height,zIndex){
        var that = this;

        AbstractNode.call(this,id,EdgeShapeNode.TYPE,left,top,width,height,zIndex);

        /**
         * jQuery object of node template
         * @type {jQuery}
         * @private
         */
        var _$template = $(_.template(edgeShapeNodeHtml,{type: that.getType()}));

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
            json.type = EdgeShapeNode.TYPE;
            return json;
        };

        this.addAttribute(new SingleSelectionAttribute(this.getEntityId()+"[arrow]","Arrow",this,{"bidirassociation":"---","unidirassociation":"-->","generalisation":"--▷","diamond":"-◁▷"}));
        this.addAttribute(new SingleSelectionAttribute(this.getEntityId()+"[shape]","Shape",this,{"straight":"Straight","curved":"Curved","segmented":"Segmented"}));
        this.addAttribute(new SingleColorValueAttribute(this.getEntityId()+"[color]","Color",this));
        this.addAttribute(new SingleValueAttribute(this.getEntityId()+"[overlay]","Overlay Text",this));
        this.addAttribute(new SingleSelectionAttribute(this.getEntityId()+"[overlayPosition]","Overlay Position",this,{"hidden":"Hide","top":"Top","center":"Center","bottom":"Bottom"}));
        this.addAttribute(new BooleanAttribute(this.getEntityId()+"[overlayRotate]","Autoflip Overlay",this));

        _$node.find(".label").append(this.getLabel().get$node());

        for(var attributeKey in _attributes){
            if(_attributes.hasOwnProperty(attributeKey)){
                _$attributeNode.append(_attributes[attributeKey].get$node());
            }
        }

    }

    return EdgeShapeNode;

});