export const exposedCodeOctreeNode = `
import { Box3, Color, Object3D, Vector3 } from "three";
import { OctreeObj } from "./OctreeObj";
import { OctreeHelper } from "./OctreeHelper";
import { Octree } from "./Octree";
import { OctreeVisualizer } from "./OctreeVisualizer";

//This class represents a cube in the octree's hierarchy. It stores objects and can either be a leaf node (no child nodes) or has exactly 8 equally-sized children
export class OctreeNode
{
    //Bounds and sizes of this octree
    private bounds: Box3;
    private boundsSize: Vector3 = new Vector3();
    private boundsCenter: Vector3 = new Vector3();

    private parent?: OctreeNode;                //Parent node. If undefined, means the node is the root or it got removed from the hierarchy
    private storedObjects: OctreeObj[] = [];    //Objects that are stored under this node
    private childNodes: OctreeNode[] = [];      //List of the childre. Get's allocated only when we divide the node, and when we collapse, it gets deleted
    private isLeaf: boolean = true;             //Flag to know if the node has children or not
    private currentDepth: number;               //Current depth in the octree. Is between [0-maxDepth]

    //Variables that control divide & collapse logic
    private maxObjPerNode: number;
    private maxDepth: number;
    private minNodeSize: number;

    //Debug data used to display the nodes on the screen. If debugVisualizer is undefined nothing will be drawn
    private debugVisualizer?: OctreeVisualizer;
    private debugCubeId: number = -1;
    private debugColor: Color;

    //Utility vectors to reduce allocations
    private aux1: Vector3 = new Vector3();
    private aux2: Vector3 = new Vector3();
    private aux3: Vector3 = new Vector3();

    //bounds - size of this node
    //objects - objects that will be inserted into this node it this node's children
    //depth - how deep in the hierarchy this node is
    //maxObjPerNode - once a leaf node stores more objects that this count, it will divide into smaller nodes
    //maxDepth - how many levels we can have in our octree (maximum depth that we can go if we recursively go from parent to child)
    //minNodeSize - minimum size that a node can have. If we need to divide but the child nodes become smaller than this, then we won't divide
    //debugVisualize - used to draw debug data for the octree. If undefined, won't draw anything. Can be updated using setDebugVisualizer()
    constructor(parent: OctreeNode | undefined, bounds: Box3, objects: OctreeObj[], depth: number, maxObjPerNode: number, maxDepth: number, minNodeSize: number, debugVisualizer?: OctreeVisualizer)
    {
        this.parent = parent;
        this.bounds = bounds;
        this.currentDepth = depth;
        this.maxObjPerNode = maxObjPerNode;
        this.maxDepth = maxDepth;
        this.minNodeSize = minNodeSize;

        this.bounds.getSize(this.boundsSize);
        this.bounds.getCenter(this.boundsCenter);

        //Debug data
        this.debugVisualizer = debugVisualizer;
        this.debugColor = new Color(
            Math.random(),
            Math.random(),
            Math.random()
        );

        //Add objects to this node
        for (let index = 0; index < objects.length; ++index)
        {
            objects[index].setCurrentNode(this);
            this.storedObjects.push(objects[index]);
        }

        //Check to see if we can divide this node (split into 8 children)
        if (this.shouldDivide())
            this.divide();

        if (this.storedObjects.length > maxObjPerNode)
        {
            if (Octree.DisplayWarnings)
                console.warn("Too many objects stored in a single node. Consider increasing number of objects per node or max tree depth");
        }

        if(this.debugVisualizer != undefined)
        {
            this.debugCubeId = this.debugVisualizer.reserveCube(this.bounds, this.debugColor);
            this.debugVisualizer.setCubeVisible(this.debugCubeId, this.hasObjects() || this.parent == undefined);
        }
    }

    public isLeafNode(): boolean { return this.isLeaf; }
    public getObjects(): OctreeObj[] { return this.storedObjects; }
    public getBounds(): Box3 { return this.bounds; }
    public getParent(): OctreeNode | undefined { return this.parent; }
    public getDebugColor(): Color { return this.debugColor; }

    //Release stored data in this node
    public destroy()
    {
        this.isLeaf = true;
        this.childNodes = [];
        this.storedObjects = [];
    }

    //Add an object in the smallest node that can fully contain the object
    public addObject(obj: OctreeObj)
    {
        //If we are not a leaf node, check all children to see if the object fits in any of the children
        if (!this.isLeaf)
        {
            let bounds = obj.getBounds();
            for (let side = 0; side < this.childNodes.length; ++side)
            {
                //If a bounds contains the object fully, add it to the list
                //If it doesn't contain fully and just intersects 2 children, the obj will remain in the parent.
                if (OctreeHelper.containsBounds(this.childNodes[side].bounds, bounds))
                {
                    this.childNodes[side].addObject(obj);
                    return;
                }
            }
        }

        //Otherwise, if we are a leaf node or we didn't find a child that can contain the object, add it to this node
        obj.setCurrentNode(this);
        this.storedObjects.push(obj);

        //Check to see if we can divide
        if (this.isLeaf && this.shouldDivide())
            this.divide();

        if (this.storedObjects.length > this.maxObjPerNode)
        {
            if (Octree.DisplayWarnings)
                console.warn("Too many objects stored in a single node. Consider increasing number of objects per node or max tree depth");
        }
        
        //Display debug data if we want to
        if(this.debugVisualizer != undefined)
        {
            this.debugVisualizer.setCubeVisible(this.debugCubeId, this.hasObjects() || this.parent == undefined);
        }
    }

    //Remove an object from the hierarchy of this node
    //allowCollapse can be used to not collapse nodes when removing (mainly used when updating the octree based on movable objects)
    public removeObject(obj: Object3D, objBounds: Box3, allowCollapse: boolean = true): boolean
    {
        //Go through all objects stored in this node, and if we found our object, remove it
        for (let index = 0; index < this.storedObjects.length; ++index)
        {
            if (this.storedObjects[index].getObject3D() == obj)
            {
                this.storedObjects.splice(index, 1);
                if (allowCollapse && this.canCollapseNode())
                    this.collapse();
                if(this.debugVisualizer != undefined)
                    this.debugVisualizer.setCubeVisible(this.debugCubeId, this.hasObjects() || this.parent == undefined);
                return true;
            }
        }
        
        //If we have children, go through all children and see if any of them contains this object
        if (!this.isLeaf)
        {
            let removedChild = false;
            for (let index = 0; index < this.childNodes.length; ++index)
            {
                if (this.childNodes[index].bounds.intersectsBox(objBounds))
                {
                    removedChild = this.childNodes[index].removeObject(obj, objBounds, allowCollapse);
                    if(removedChild)
                        break;
                }
            }

            //If we removed the object from a child, check to see if we can collapse this node
            if (removedChild)
            {
                if (allowCollapse && this.canCollapseNode())
                    this.collapse();
                return true;
            }
        }

        return false;
    }

    //Go through the entire hierarchy and collapse them recursively if possible
    public tryCollapseRecursive()
    {
        if(!this.isLeaf)
        {
            //First check the child nodes, to start the collapse from the deepest nodes (basically depth-first search)
            for(let index = 0; index < this.childNodes.length; ++index)
            {
                if(this.childNodes[index].isLeaf == false)
                    this.childNodes[index].tryCollapseRecursive();
            }
            //If the current node can be collapsed, do so
            if(this.canCollapseNode())
                this.collapse();
        }
    }

    //Update the moving flag for the object
    public setMovingObjectFlag(obj: Object3D, objBounds: Box3, canMove: boolean): OctreeObj | undefined
    {
        //Go through all objects stored in this node and we found our object, update it's flag
        for (let index = 0; index < this.storedObjects.length; ++index)
        {
            if (this.storedObjects[index].getObject3D() == obj)
            {
                this.storedObjects[index].setMovingFlag(canMove);
                return this.storedObjects[index];
            }
        }

        //Otherwise, if we have children, go through all of them and try to find our object
        if (!this.isLeaf)
        {
            for (let index = 0; index < this.childNodes.length; ++index)
            {
                if (OctreeHelper.containsBounds(this.childNodes[index].bounds, objBounds))
                {
                    return this.childNodes[index].setMovingObjectFlag(obj, objBounds, canMove);
                }
            }
        }
        return undefined;
    }

    //Recursively try to find the smallest node that can fully contain this object
    //Mainly used when objects move across the octree
    public findSmallestEncompasingNode(obj: OctreeObj): { res: boolean, node: OctreeNode | undefined }
    {
        //If the object is outside our bounds, return false
        let bounds = obj.getBounds();
        if (!OctreeHelper.containsBounds(this.bounds, bounds))
            return { res: false, node: undefined };

        //If the object is inside the bounds and we reached a leaf, return this node
        if (this.isLeaf)
            return { res: true, node: this };

        //Otherwise, if the node has children, go through each of them and recursively call the function
        for (let index = 0; index < this.childNodes.length; ++index)
        {
            if (OctreeHelper.containsBounds(this.childNodes[index].bounds, bounds))
            {
                let result = this.childNodes[index].findSmallestEncompasingNode(obj);
                if (result.res == true)
                    return result;
            }
        }
        //In case none of the checks succeeded, for sanity check returns the current node
        return { res: true, node: this };
    }

    //Goes recursively through each level in the tree and returns all objects that share the same space as this point on all levels
    public queryPoint(point: Vector3, foundObj: OctreeObj[], depthLimit: number = -1)
    {
        //Go through all objects in this node and add them to the list
        for (let index = 0; index < this.storedObjects.length; index++)
        {
            foundObj.push(this.storedObjects[index]);
        }
        if (this.isLeaf)
            return;

        //If we aren't a leaf and we have a valid depth, go under the child that best fits our node
        if (depthLimit < 0 || this.currentDepth + 1 <= depthLimit)
        {
            let index = 0;

            //Bit-wise magic to find out in which of the 8 children our object is
            if (point.x > this.boundsCenter.x) index |= 1;
            if (point.y > this.boundsCenter.y) index |= 2;
            if (point.z > this.boundsCenter.z) index |= 4;

            this.childNodes[index].queryPoint(point, foundObj, depthLimit);
        }
    }

    //Goes recursively through each level in the tree and returns all objects that share the same space as this box on all levels
    public queryBounds(box: Box3, foundObj: OctreeObj[], depthLimit: number = -1)
    {
        //Go through all objects in this node and add them to the list
        for (let index = 0; index < this.storedObjects.length; index++)
        {
            foundObj.push(this.storedObjects[index]);
        }
        if (this.isLeaf)
            return;

        //If we aren't a leaf and we have a valid depth, go under the child that best fits our node
        if (depthLimit < 0 || this.currentDepth + 1 <= depthLimit)
        {
            for (let index = 0; index < this.childNodes.length; ++index)
            {
                if (this.childNodes[index].bounds.intersectsBox(box)) //Use box intersection because it may go across multiple nodes
                {
                    this.childNodes[index].queryBounds(box, foundObj, depthLimit);
                }
            }
        }
    }

    //Find out how many children are stored underneath this node
    public getNumOfChildrenRecursive(): number
    {
        let count = this.storedObjects.length;
        if (!this.isLeaf)
        {
            for (let index = 0; index < this.childNodes.length; ++index)
            {
                count += this.childNodes[index].getNumOfChildrenRecursive();
            }
        }
        return count;
    }

    //Receive a list of all nodes that sit underneath this node
    public getChildrenRecursive(foundElements: OctreeObj[])
    {
        for (let index = 0; index < this.storedObjects.length; ++index)
        {
            foundElements.push(this.storedObjects[index]);
        }

        if (!this.isLeaf)
        {
            for (let index = 0; index < this.childNodes.length; ++index)
            {
                this.childNodes[index].getChildrenRecursive(foundElements);
            }
        }
    }

    //Check to see if we can collapse this node
    public canCollapseNode(): boolean
    {
        let childObjects = this.getNumOfChildrenRecursive();
        return !this.isLeaf && childObjects <= this.maxObjPerNode;
    }

    //Discard children, make the node a leaf and add all objects stored in it's children to this node
    public collapse()
    {
        //Go through all children
        for (let index = 0; index < this.childNodes.length; ++index)
        {
            //Move the stored objects from children to our current node
            var list = this.childNodes[index].getObjects();
            for (let index2 = 0; index2 < list.length; ++index2)
            {
                list[index2].setCurrentNode(this);
                this.storedObjects.push(list[index2]);
            }
            this.childNodes[index].storedObjects = []; //Reset children list for safety
            if(this.debugVisualizer != undefined)
                this.childNodes[index].clearDebugData();
        }
        //Make the node a leaf
        this.childNodes = [];
        this.isLeaf = true;
    }

    public drawDebugData(debugVisualizer: OctreeVisualizer)
    {
        this.debugVisualizer = debugVisualizer;
        this.debugCubeId = this.debugVisualizer.reserveCube(this.bounds, this.debugColor);
        this.debugVisualizer.setCubeVisible(this.debugCubeId, this.hasObjects() || this.parent == undefined);
        for(let index = 0; index < this.childNodes.length; ++index)
        {
            this.childNodes[index].drawDebugData(debugVisualizer);
        }
    }

    public clearDebugData()
    {
        if(this.debugVisualizer != undefined)
            this.debugVisualizer.releaseCube(this.debugCubeId);
        for(let index = 0; index < this.childNodes.length; ++index)
        {
            this.childNodes[index].clearDebugData();
        }
        this.debugVisualizer = undefined;
        this.debugCubeId = -1;
    }

    //Hides cubes but doesn't try to release them. Generally called after OctreeVisualizer.releaseAllCubes() was called
    public clearDebugDataNoRelease()
    {
        this.debugVisualizer = undefined;
        this.debugCubeId = -1;
        for(let index = 0; index < this.childNodes.length; ++index)
        {
            this.childNodes[index].clearDebugDataNoRelease();
        }
    }

    //Does this node and only this node have objects stored?
    public hasObjects(): boolean
    {
        return this.storedObjects.length > 0;
    }

    //Should we divide based on the 3 rules that we have (num of objects, depth and node size)
    protected shouldDivide()
    {
        return this.storedObjects.length > this.maxObjPerNode && this.currentDepth < this.maxDepth && this.boundsSize.x > this.minNodeSize;
    }

    //Allocate 8 children to this node and reinsert objects where possible into these new children
    protected divide()
    {
        //Calculate the 8 bounding boxes
        let childBounds: Box3[] = this.calculateChildBounds();

        //Stores which objects go in which children and how many children will actually have objects in them
        //(if all objects end up under the same child, we won't divide
        let objPerChild: OctreeObj[][] = [];
        for (let index = 0; index < childBounds.length; ++index)
        {
            objPerChild[index] = [];
        }

        //Check which object should go under which child
        for (let index = 0; index < this.storedObjects.length; ++index)
        {
            for (let side = 0; side < childBounds.length; ++side)
            {
                //If a bounds contains the object fully, add it to the list
                //If it doesn't contain fully and just intersects 2 children, the obj will remain in the parent.
                if (OctreeHelper.containsBounds(childBounds[side], this.storedObjects[index].getBounds()))
                {
                    objPerChild[side].push(this.storedObjects[index]);
                    this.storedObjects.splice(index, 1);
                    index--;
                    break;
                }
            }
        }

        //Create the actual nodes based on the data that we prepared
        this.childNodes = [];
        this.isLeaf = false;
        for (let index = 0; index < childBounds.length; ++index)
        {
            this.childNodes[index] = new OctreeNode(this, childBounds[index], objPerChild[index], this.currentDepth + 1, this.maxObjPerNode, this.maxDepth, this.minNodeSize, this.debugVisualizer);
        }
    }

    //Returns 8 bounding boxes for the 8 children that this node will have
    private calculateChildBounds(): Box3[]
    {
        let size = this.aux1;
        let center = this.aux2;
        let centerOffset = this.aux3;

        this.bounds.getSize(size);
        this.bounds.getCenter(center);

        let childBounds: Box3[] = [];
        let quarterSize = size.x / 4.0;
        centerOffset.copy(size).multiplyScalar(0.25);

        for (let index = 0; index < 8; ++index)
        {
            let childCenter: Vector3 = center.clone();
            childCenter.x += centerOffset.x * ((index & 1) == 0 ? -1.0 : 1.0);
            childCenter.y += centerOffset.y * ((index & 2) == 0 ? -1.0 : 1.0);
            childCenter.z += centerOffset.z * ((index & 4) == 0 ? -1.0 : 1.0);

            let min = childCenter.clone().subScalar(quarterSize);
            let max = childCenter.clone().addScalar(quarterSize);

            childBounds.push(new Box3(min, max));
        }

        return childBounds;
    }
}
`;