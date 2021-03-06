define([
    'require',
    'jqueryui',
    'jsplumb',
    'lodash',
    'viewcanvas_widget/AbstractNode',
    'viewcanvas_widget/SingleValueAttribute',
    'viewcanvas_widget/SingleSelectionAttribute',
    'viewcanvas_widget/KeySelectionValueListAttribute',
    'text!templates/canvas_widget/object_node.html'
],/** @lends ObjectNode */function(require,$,jsPlumb,_,AbstractNode,SingleValueAttribute,SingleSelectionAttribute,KeySelectionValueListAttribute,objectNodeHtml) {

    ObjectNode.TYPE = "Object";
    ObjectNode.DEFAULT_WIDTH = 150;
    ObjectNode.DEFAULT_HEIGHT = 100;

    ObjectNode.prototype = new AbstractNode();
    ObjectNode.prototype.constructor = ObjectNode;
    /**
     * ObjectNode
     * @class canvas_widget.ObjectNode
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
    function ObjectNode(id,left,top,width,height,zIndex){
        var that = this;

        AbstractNode.call(this,id,ObjectNode.TYPE,left,top,width,height,zIndex);

        /**
         * jQuery object of node template
         * @type {jQuery}
         * @private
         */
        var _$template = $(_.template(objectNodeHtml,{type: that.getType()}));

        /**
         * jQuery object of DOM node representing the node
         * @type {jQuery}
         * @private
         */
        var _$node = AbstractNode.prototype.get$node.call(this).append(_$template).addClass("object");

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
            return AbstractNode.prototype.toJSON.call(this);
        };

        //this.addAttribute(new SingleValueAttribute(this.getEntityId()+"[color]","Color",this));
        //this.addAttribute(new SingleSelectionAttribute(this.getEntityId()+"[shape]","Shape",this,{"rectangle":"Rectangle","circle":"Circle"}));
        this.addAttribute(new KeySelectionValueListAttribute("[attributes]","Attributes",this,{"string":"String","boolean":"Boolean","integer":"Integer","file":"File"}));

        _$node.find(".label").append(this.getLabel().get$node());

        for(var attributeKey in _attributes){
            if(_attributes.hasOwnProperty(attributeKey)){
                _$attributeNode.append(_attributes[attributeKey].get$node());
            }
        }

        this.setContextMenuItemCallback(function(){
            var NodeShapeNode = require('viewcanvas_widget/NodeShapeNode'),
                BiDirAssociationEdge = require('viewcanvas_widget/BiDirAssociationEdge'),
                UniDirAssociationEdge = require('viewcanvas_widget/UniDirAssociationEdge');
            return {
                addShape: {
                    name: "Add Node Shape",
                        callback: function(){
                        var canvas = that.getCanvas(),
                            appearance = that.getAppearance(),
                            nodeId;

                        //noinspection JSAccessibilityCheck
                        nodeId = canvas.createNode(NodeShapeNode.TYPE,appearance.left + appearance.width + 50,appearance.top,150,100);
                        canvas.createEdge(BiDirAssociationEdge.TYPE,that.getEntityId(),nodeId, null, null, $('#lblCurrentView').text());
                    },
                    disabled: function() {
                        var edges = that.getEdges(),
                            edge,
                            edgeId;

                        for(edgeId in edges){
                            if(edges.hasOwnProperty(edgeId)){
                                edge = edges[edgeId];
                                if( (edge instanceof BiDirAssociationEdge &&
                                    (edge.getTarget() === that && edge.getSource() instanceof NodeShapeNode ||
                                        edge.getSource() === that && edge.getTarget() instanceof NodeShapeNode)) ||

                                    (edge instanceof UniDirAssociationEdge && edge.getTarget() instanceof NodeShapeNode) ){

                                    return true;
                                }
                            }
                        }
                        return false;
                    }
                },
                sepConvertTo: "---------",
                convertTo: {
                    name: "Convert to..",
                        items: {
                        abstractClassNode: {
                            name: "..Abstract Class",
                                callback: function(){
                                var canvas = that.getCanvas(),
                                    appearance = that.getAppearance(),
                                    nodeId;

                                //noinspection JSAccessibilityCheck
                                nodeId = canvas.createNode(require('viewcanvas_widget/AbstractClassNode').TYPE,appearance.left,appearance.top,appearance.width,appearance.height,that.getZIndex(),that.toJSON());
                                var edges = that.getOutgoingEdges(),
                                    edge,
                                    edgeId;

                                for(edgeId in edges){
                                    if(edges.hasOwnProperty(edgeId)){
                                        edge = edges[edgeId];
                                        canvas.createEdge(edge.getType(),nodeId,edge.getTarget().getEntityId(),edge.toJSON(), null, $('#lblCurrentView').text());
                                    }
                                }

                                edges = that.getIngoingEdges();

                                for(edgeId in edges){
                                    if(edges.hasOwnProperty(edgeId)){
                                        edge = edges[edgeId];
                                        if(edge.getSource() !== edge.getTarget()){
                                            canvas.createEdge(edge.getType(),edge.getSource().getEntityId(),nodeId,edge.toJSON(), null, $('#lblCurrentView').text());
                                        }
                                    }
                                }

                                that.triggerDeletion();

                            }
                        },
                        relationshipNode: {
                            name: "..Relationship",
                                callback: function(){
                                var canvas = that.getCanvas(),
                                    appearance = that.getAppearance(),
                                    nodeId;

                                //noinspection JSAccessibilityCheck
                                nodeId = canvas.createNode(require('viewcanvas_widget/RelationshipNode').TYPE,appearance.left,appearance.top,appearance.width,appearance.height,that.getZIndex(),that.toJSON());
                                var edges = that.getOutgoingEdges(),
                                    edge,
                                    edgeId;

                                for(edgeId in edges){
                                    if(edges.hasOwnProperty(edgeId)){
                                        edge = edges[edgeId];
                                        canvas.createEdge(edge.getType(),nodeId,edge.getTarget().getEntityId(),edge.toJSON(), null, $('#lblCurrentView').text());
                                    }
                                }

                                edges = that.getIngoingEdges();

                                for(edgeId in edges){
                                    if(edges.hasOwnProperty(edgeId)){
                                        edge = edges[edgeId];
                                        if(edge.getSource() !== edge.getTarget()){
                                            canvas.createEdge(edge.getType(),edge.getSource().getEntityId(),nodeId,edge.toJSON(), null, $('#lblCurrentView').text());
                                        }
                                    }
                                }

                                that.triggerDeletion();

                            }
                        },
                        relationshipGroupNode: {
                            name: "..Relationship Group",
                            callback: function(){
                                var canvas = that.getCanvas(),
                                    appearance = that.getAppearance(),
                                    nodeId;

                                //noinspection JSAccessibilityCheck
                                nodeId = canvas.createNode(require('viewcanvas_widget/RelationshipGroupNode').TYPE,appearance.left,appearance.top,appearance.width,appearance.height,that.getZIndex(),that.toJSON());
                                var edges = that.getOutgoingEdges(),
                                    edge,
                                    edgeId;

                                for(edgeId in edges){
                                    if(edges.hasOwnProperty(edgeId)){
                                        edge = edges[edgeId];
                                        canvas.createEdge(edge.getType(),nodeId,edge.getTarget().getEntityId(),edge.toJSON(), null, $('#lblCurrentView').text());
                                    }
                                }

                                edges = that.getIngoingEdges();

                                for(edgeId in edges){
                                    if(edges.hasOwnProperty(edgeId)){
                                        edge = edges[edgeId];
                                        if(edge.getSource() !== edge.getTarget()){
                                            canvas.createEdge(edge.getType(),edge.getSource().getEntityId(),nodeId,edge.toJSON(), null, $('#lblCurrentView').text());
                                        }
                                    }
                                }

                                that.triggerDeletion();

                            }
                        }

                    }
                },
                sep: "---------"
            };
        });

    }

    return ObjectNode;

});