import { Box3, Color, Object3D, Vector3 } from "three";
import { OctreeObj } from "./OctreeObj";
import { OctreeHelper } from "./OctreeHelper";
import { Octree } from "./Octree";
import { OctreeVisualizer } from "./OctreeVisualizer";

export class OctreeNode
{
    private bounds: Box3;
    private boundsSize: Vector3 = new Vector3();
    private boundsCenter: Vector3 = new Vector3();

    private parent?: OctreeNode;
    private storedObjects: OctreeObj[] = [];
    private childNodes: OctreeNode[] = [];
    private isLeaf: boolean = true;
    private currentDepth: number;

    private maxObjPerNode: number;
    private maxDepth: number;
    private minNodeSize: number;

    private debugVisualizer: OctreeVisualizer | undefined;
    private debugCubeId: number = -1;
    private debugColor: Color;

    private aux1: Vector3 = new Vector3();
    private aux2: Vector3 = new Vector3();
    private aux3: Vector3 = new Vector3();

    constructor(parent: OctreeNode | undefined, bounds: Box3, objects: OctreeObj[], depth: number, maxObjPerNode: number, maxDepth: number, minNodeSize: number, debugVisualizer: OctreeVisualizer | undefined)
    {
        this.parent = parent;
        this.bounds = bounds;
        this.currentDepth = depth;
        this.maxObjPerNode = maxObjPerNode;
        this.maxDepth = maxDepth;
        this.minNodeSize = minNodeSize;

        this.bounds.getSize(this.boundsSize);
        this.bounds.getCenter(this.boundsCenter);

        this.debugVisualizer = debugVisualizer;
        this.debugColor = new Color(
            Math.random(),
            Math.random(),
            Math.random()
        );

        for (let index = 0; index < objects.length; ++index)
        {
            objects[index].setCurrentNode(this);
            this.storedObjects.push(objects[index]);
        }

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

    public destroy()
    {
        this.isLeaf = true;
        this.childNodes = [];
        this.storedObjects = [];
    }

    public addObject(obj: OctreeObj)
    {
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

        obj.setCurrentNode(this);
        this.storedObjects.push(obj);

        if (this.isLeaf && this.shouldDivide())
            this.divide();

        if (this.storedObjects.length > this.maxObjPerNode)
        {
            if (Octree.DisplayWarnings)
                console.warn("Too many objects stored in a single node. Consider increasing number of objects per node or max tree depth");
        }
        
        if(this.debugVisualizer != undefined)
        {
            this.debugVisualizer.setCubeVisible(this.debugCubeId, this.hasObjects() || this.parent == undefined);
        }
    }

    public removeObject(obj: Object3D, objBounds: Box3, allowCollapse: boolean = true): boolean
    {
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

            if (removedChild)
            {
                if (allowCollapse && this.canCollapseNode())
                    this.collapse();
                return true;
            }
        }

        return false;
    }

    public tryCollapseRecursive()
    {
        if(!this.isLeaf)
        {
            for(let index = 0; index < this.childNodes.length; ++index)
            {
                if(this.childNodes[index].isLeaf == false)
                    this.childNodes[index].tryCollapseRecursive();
            }
            if(this.canCollapseNode())
                this.collapse();
        }
    }

    public setMovingObjectFlag(obj: Object3D, objBounds: Box3, canMove: boolean): OctreeObj | undefined
    {
        for (let index = 0; index < this.storedObjects.length; ++index)
        {
            if (this.storedObjects[index].getObject3D() == obj)
            {
                this.storedObjects[index].setMovingFlag(canMove);
                return this.storedObjects[index];
            }
        }

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

    public findSmallestEncompasingNode(obj: OctreeObj): { res: boolean, node: OctreeNode | undefined }
    {
        let bounds = obj.getBounds();
        if (!OctreeHelper.containsBounds(this.bounds, bounds))
            return { res: false, node: undefined };

        if (this.isLeaf)
            return { res: true, node: this };

        for (let index = 0; index < this.childNodes.length; ++index)
        {
            if (OctreeHelper.containsBounds(this.childNodes[index].bounds, bounds))
            {
                let result = this.childNodes[index].findSmallestEncompasingNode(obj);
                if (result.res == true)
                    return result;
            }
        }
        return { res: true, node: this };
    }

    //Goes recursively through each level in the tree and returns all objects that share the same space as this point on all levels
    public queryPoint(point: Vector3, foundObj: OctreeObj[], depthLimit: number = -1)
    {
        for (let index = 0; index < this.storedObjects.length; index++)
        {
            foundObj.push(this.storedObjects[index]);
        }
        if (this.isLeaf)
            return;

        if (depthLimit < 0 || this.currentDepth + 1 <= depthLimit)
        {
            let index = 0;

            if (point.x > this.boundsCenter.x) index |= 1;
            if (point.y > this.boundsCenter.y) index |= 2;
            if (point.z > this.boundsCenter.z) index |= 4;

            this.childNodes[index].queryPoint(point, foundObj, depthLimit);
        }
    }

    public queryBounds(box: Box3, foundObj: OctreeObj[], depthLimit: number = -1)
    {
        for (let index = 0; index < this.storedObjects.length; index++)
        {
            foundObj.push(this.storedObjects[index]);
        }
        if (this.isLeaf)
            return;

        if (depthLimit < 0 || this.currentDepth + 1 <= depthLimit)
        {
            for (let index = 0; index < this.childNodes.length; ++index)
            {
                if (this.childNodes[index].bounds.intersectsBox(box))
                {
                    this.childNodes[index].queryBounds(box, foundObj, depthLimit);
                }
            }
        }
    }

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

    public canCollapseNode(): boolean
    {
        let childObjects = this.getNumOfChildrenRecursive();
        return !this.isLeaf && childObjects <= this.maxObjPerNode;
    }

    public collapse()
    {
        for (let index = 0; index < this.childNodes.length; ++index)
        {
            var list = this.childNodes[index].getObjects();
            for (let index2 = 0; index2 < list.length; ++index2)
            {
                list[index2].setCurrentNode(this);
                this.storedObjects.push(list[index2]);
            }
            this.childNodes[index].storedObjects = [];
            if(this.debugVisualizer != undefined)
                this.childNodes[index].clearDebugData();
        }
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

    public clearDebugDataNoRelease()
    {
        this.debugVisualizer = undefined;
        this.debugCubeId = -1;
        for(let index = 0; index < this.childNodes.length; ++index)
        {
            this.childNodes[index].clearDebugDataNoRelease();
        }
    }

    public hasObjects(): boolean
    {
        return this.storedObjects.length > 0;
    }

    protected shouldDivide()
    {
        return this.storedObjects.length > this.maxObjPerNode && this.currentDepth < this.maxDepth && this.boundsSize.x > this.minNodeSize;
    }

    protected divide()
    {
        let childBounds: Box3[] = this.calculateChildBounds();

        //Store which objects go in which children and how many children will actually have objects in them
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

        //Otherwise, subdivide the node
        this.childNodes = [];
        this.isLeaf = false;
        for (let index = 0; index < childBounds.length; ++index)
        {
            this.childNodes[index] = new OctreeNode(this, childBounds[index], objPerChild[index], this.currentDepth + 1, this.maxObjPerNode, this.maxDepth, this.minNodeSize, this.debugVisualizer);
        }
    }

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