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
                if (objects[index].IsMovable())
                    this.movableObjects.push(objects[index]);
            }
        }
        this.root = new OctreeNode(undefined, bounds, objects, 0, maxObjPerNode, maxDepth, minNodeSize, this.debugVisualizer);
    }

    public static EnableLogs(warnings: boolean, errors: boolean)
    {
        Octree.displayWarnings = warnings;
        Octree.displayErrors = errors;
    }

    public Destroy()
    {
        this.movableObjects = [];
        this.root.Destroy();
    }

    public SetDebugVisualizer(debugVisualizer?: OctreeVisualizer)
    {
        if(debugVisualizer == undefined && this.debugVisualizer != undefined)
        {
            this.debugVisualizer.releaseAllCubes();
            this.root.ClearDebugDataNoRelease();
        }
        else if(debugVisualizer != undefined && this.debugVisualizer == undefined)
        {
            this.debugVisualizer = debugVisualizer;
            this.root.DrawDebugData(this.debugVisualizer);
        }
        this.debugVisualizer = debugVisualizer;
    }

    public AddObject(obj: OctreeObj)
    {
        if (!OctreeHelper.ContainsBounds(this.root.GetBounds(), obj.GetBounds()))
        {
            if(Octree.DisplayErrors)
                console.error("Cannot add objects outside the bounds!. Please create a bigger octree.");
            return;
        }
        if(obj.IsMovable())
            this.movableObjects.push(obj);
        this.root.AddObject(obj);
    }

    public RemoveObject(obj: Object3D): boolean
    {
        let objBounds = new Box3().setFromObject(obj);

        for(let index = 0; index < this.movableObjects.length; ++index)
        {
            if(this.movableObjects[index].GetObject3D() == obj)
            {
                this.movableObjects.splice(index, 1);
                break;
            }
        }

        if (!OctreeHelper.ContainsBounds(this.root.GetBounds(), objBounds))
        {
            if (Octree.DisplayErrors)
                console.error("Cannot remove objects outside the bounds!. Please create a bigger octree.");
            return false;
        }

        if(this.root.RemoveObject(obj, objBounds))
        {
            if (this.root.CanCollapseNode())
                this.root.Collapse();
            return true;
        }
        return false;
    }

    public SetMovingObjectFlag(obj: Object3D, canMove: boolean)
    {
        let objBounds = new Box3().setFromObject(obj);
        if (!OctreeHelper.ContainsBounds(this.root.GetBounds(), objBounds))
        {
            if (Octree.DisplayErrors)
                console.error("Object is outside of the octree bounds, this is not allowed.");
            return;
        }
        let foundObj: OctreeObj | undefined = this.root.SetMovingObjectFlag(obj, objBounds, canMove);
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

    public QueryPoint(point: Vector3, foundObjects: OctreeObj[], depthLimit: number = -1) //Returns all objects in the same node with this point
    {
        foundObjects = [];
        this.root.QueryPoint(point, foundObjects, depthLimit);
    }

    public QueryBounds(box: Box3, depthLimit: number = -1) //Returns all objects from all nodes that intersect this bounding box
    {
        let foundObjects: OctreeObj[] = [];
        this.root.QueryBounds(box, foundObjects, depthLimit);
        return foundObjects;
    }

    public UpdateBounds()
    {
        for(let index = 0; index < this.movableObjects.length; ++index)
        {
            this.movableObjects[index].UpdateBounds();
        }
    }

    public UpdateMovableObjects()
    {
        for(let index = 0; index < this.movableObjects.length; ++index)
        {
            let obj: OctreeObj = this.movableObjects[index];
            let parent: OctreeNode | undefined = obj.GetNode();
            if(parent == undefined)
                continue;

            let objBounds = obj.GetBounds();

            if (OctreeHelper.ContainsBounds(parent.GetBounds(), objBounds))
            {
                let smallerNode = parent.FindSmallestEncompasingNode(obj);
                if(smallerNode.res == true && smallerNode.node != parent)
                {
                    parent.RemoveObject(obj.GetObject3D(), objBounds, false);
                    smallerNode.node!.AddObject(obj);
                }
                continue;
            }

            parent.RemoveObject(obj.GetObject3D(), objBounds, false);

            let foundNewParent = false;
            parent = parent.GetParent();
            while(parent != undefined)
            {
                if(OctreeHelper.ContainsBounds(parent.GetBounds(), objBounds))
                {
                    parent.AddObject(obj);
                    foundNewParent = true;
                    break;
                }
                parent = parent.GetParent();
            }
            if(!foundNewParent)
            {
                if (Octree.DisplayErrors)
                    console.error("The following object is outside the bounds. Adding into root: ", obj, obj.GetObject3D().position);
                this.root.AddObject(obj);
                continue;
            }
        }
        this.root.TryCollapseRecursive();
    }

    public GetAllObjects()
    {
        let foundElements: OctreeObj[] = [];
        this.root.GetChildrenRecursive(foundElements);
        return foundElements;
    }
}