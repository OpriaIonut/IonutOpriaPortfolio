import { Box3, Object3D, Vector3 } from "three";
import { OctreeNode } from "./OctreeNode";
import { OctreeObj } from "./OctreeObj";
import { OctreeHelper } from "./OctreeHelper";
import { OctreeVisualizer } from "./OctreeVisualizer";

export class Octree
{
    private root: OctreeNode;
    private movableObjects: OctreeObj[] = [];

    private boundsSize: Vector3 = new Vector3();
    private boundsCenter: Vector3 = new Vector3();

    private aux1: Vector3 = new Vector3();
    private aux2: Vector3 = new Vector3();
    private aux3: Vector3 = new Vector3();

    private debugVisualizer?: OctreeVisualizer;

    protected static displayWarnings: boolean = true;
    protected static displayErrors: boolean = true;

    public static get DisplayWarnings(): boolean { return Octree.displayWarnings; }
    public static get DisplayErrors(): boolean { return Octree.displayErrors; }

    constructor(bounds: Box3, objects: OctreeObj[], maxObjPerNode: number, maxDepth: number, minNodeSize: number, debugVisualizer?: OctreeVisualizer)
    {
        bounds.getSize(this.boundsSize);
        bounds.getCenter(this.boundsCenter);

        this.debugVisualizer = debugVisualizer;

        //Scale the bounds to have same size in all directions (technically a cube)
        let sizeIncrement = Math.max(this.boundsSize.x, this.boundsSize.y, this.boundsSize.z) * 0.5;
        let size: Vector3 = this.aux1.set(1.0, 1.0, 1.0).multiplyScalar(sizeIncrement);
        this.aux2.copy(this.boundsCenter).sub(size); //min
        this.aux3.copy(this.boundsCenter).add(size); //max
        bounds.set(this.aux2, this.aux3);

        if (objects != null && objects != undefined)
        {
            for (let index = 0; index < objects.length; ++index)
            {
                if (objects[index].isObjMovable())
                    this.movableObjects.push(objects[index]);
            }
        }
        this.root = new OctreeNode(undefined, bounds, objects, 0, maxObjPerNode, maxDepth, minNodeSize, this.debugVisualizer);
    }

    public static enableLogs(warnings: boolean, errors: boolean)
    {
        Octree.displayWarnings = warnings;
        Octree.displayErrors = errors;
    }

    public destroy()
    {
        this.movableObjects = [];
        this.root.destroy();
    }

    public setDebugVisualizer(debugVisualizer?: OctreeVisualizer)
    {
        if(debugVisualizer == undefined && this.debugVisualizer != undefined)
        {
            this.debugVisualizer.releaseAllCubes();
            this.root.clearDebugDataNoRelease();
        }
        else if(debugVisualizer != undefined && this.debugVisualizer == undefined)
        {
            this.debugVisualizer = debugVisualizer;
            this.root.drawDebugData(this.debugVisualizer);
        }
        this.debugVisualizer = debugVisualizer;
    }

    public addObject(obj: OctreeObj)
    {
        if (!OctreeHelper.containsBounds(this.root.getBounds(), obj.getBounds()))
        {
            if(Octree.DisplayErrors)
                console.error("Cannot add objects outside the bounds!. Please create a bigger octree.");
            return;
        }
        if(obj.isObjMovable())
            this.movableObjects.push(obj);
        this.root.addObject(obj);
    }

    public removeObject(obj: Object3D): boolean
    {
        let objBounds = new Box3().setFromObject(obj);

        for(let index = 0; index < this.movableObjects.length; ++index)
        {
            if(this.movableObjects[index].getObject3D() == obj)
            {
                this.movableObjects.splice(index, 1);
                break;
            }
        }

        if (!OctreeHelper.containsBounds(this.root.getBounds(), objBounds))
        {
            if (Octree.DisplayErrors)
                console.error("Cannot remove objects outside the bounds!. Please create a bigger octree.");
            return false;
        }

        if(this.root.removeObject(obj, objBounds))
        {
            if (this.root.canCollapseNode())
                this.root.collapse();
            return true;
        }
        return false;
    }

    public setMovingObjectFlag(obj: Object3D, canMove: boolean)
    {
        let objBounds = new Box3().setFromObject(obj);
        if (!OctreeHelper.containsBounds(this.root.getBounds(), objBounds))
        {
            if (Octree.DisplayErrors)
                console.error("Object is outside of the octree bounds, this is not allowed.");
            return;
        }
        let foundObj: OctreeObj | undefined = this.root.setMovingObjectFlag(obj, objBounds, canMove);
        if(foundObj != undefined)
        {
            if (!canMove)
            {
                for(let index = 0; index < this.movableObjects.length; ++index)
                {
                    if(this.movableObjects[index] == foundObj)
                    {
                        this.movableObjects.splice(index, 1);
                        break;
                    }
                }
            }
            else if (!this.movableObjects.includes(foundObj))
                this.movableObjects.push(foundObj);
        }
    }

    public queryPoint(point: Vector3, foundObjects: OctreeObj[], depthLimit: number = -1) //Returns all objects in the same node with this point
    {
        foundObjects = [];
        this.root.queryPoint(point, foundObjects, depthLimit);
    }

    public queryBounds(box: Box3, depthLimit: number = -1) //Returns all objects from all nodes that intersect this bounding box
    {
        let foundObjects: OctreeObj[] = [];
        this.root.queryBounds(box, foundObjects, depthLimit);
        return foundObjects;
    }

    public updateBounds()
    {
        for(let index = 0; index < this.movableObjects.length; ++index)
        {
            this.movableObjects[index].updateBounds();
        }
    }

    public updateMovableObjects()
    {
        for(let index = 0; index < this.movableObjects.length; ++index)
        {
            let obj: OctreeObj = this.movableObjects[index];
            let parent: OctreeNode | undefined = obj.getNode();
            if(parent == undefined)
                continue;

            let objBounds = obj.getBounds();

            if (OctreeHelper.containsBounds(parent.getBounds(), objBounds))
            {
                let smallerNode = parent.findSmallestEncompasingNode(obj);
                if(smallerNode.res == true && smallerNode.node != parent)
                {
                    parent.removeObject(obj.getObject3D(), objBounds, false);
                    smallerNode.node!.addObject(obj);
                }
                continue;
            }

            parent.removeObject(obj.getObject3D(), objBounds, false);

            let foundNewParent = false;
            parent = parent.getParent();
            while(parent != undefined)
            {
                if(OctreeHelper.containsBounds(parent.getBounds(), objBounds))
                {
                    parent.addObject(obj);
                    foundNewParent = true;
                    break;
                }
                parent = parent.getParent();
            }
            if(!foundNewParent)
            {
                if (Octree.DisplayErrors)
                    console.error("The following object is outside the bounds. Adding into root: ", obj, obj.getObject3D().position);
                this.root.addObject(obj);
                continue;
            }
        }
        this.root.tryCollapseRecursive();
    }

    public getAllObjects()
    {
        let foundElements: OctreeObj[] = [];
        this.root.getChildrenRecursive(foundElements);
        return foundElements;
    }
}