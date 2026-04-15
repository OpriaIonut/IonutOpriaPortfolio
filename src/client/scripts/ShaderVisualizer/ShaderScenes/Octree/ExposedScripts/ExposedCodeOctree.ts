export const exposedCodeOctree = `
import { Box3, Object3D, Vector3 } from "three";
import { OctreeNode } from "./OctreeNode";
import { OctreeObj } from "./OctreeObj";
import { OctreeHelper } from "./OctreeHelper";
import { OctreeVisualizer } from "./OctreeVisualizer";

//This is the main octree class. It provides function required to add & remove objects from the octree and also spatially query them
//General rules for the octree are:
//  - each node can be a leaf (doesn't have children) or has 8 children nodes of equal sizes that all together make up to the same size as the node
//  - when we add an object, it will get added into the smallest leaf node possible based on it's bounding box
//  - if an object cannot fully be contained in a node (ex: it's bounds intersects the line between 2 nodes), it will get added in the first parent that can fully contain it, even if it isn't a leaf node
//  - divide: a leaf node allocates children nodes if it stores too many objects inside of it, and objects will then be inserted into those child nodes
//  - collapse: if a node hierarchy (node + children) have just a few objects stored, it will delete it's children, will make the node a leaf again and reinsert all objects from the hierarchy into the new node
//  - for objects that can move, you need to call updateMovableObjectBounds() and then updateMovableObjects() in order to recalculate the octree based on their new position
export class Octree
{
    private root: OctreeNode;
    private movableObjects: OctreeObj[] = []; //List of all objects that can move in the scene. If you want more, you need to call setMovingObjectFlag()

    //References to the size and center of the entire octree. Is identic to the root size
    private boundsSize: Vector3 = new Vector3();
    private boundsCenter: Vector3 = new Vector3();

    //Utility vectors which get used for different calculations to reduce allocations
    private aux1: Vector3 = new Vector3();
    private aux2: Vector3 = new Vector3();
    private aux3: Vector3 = new Vector3();

    //Class which displays debug cubes. If set to undefined, nothing will be drawn
    private debugVisualizer?: OctreeVisualizer;

    //Static variables to control logging level
    protected static displayWarnings: boolean = true;
    protected static displayErrors: boolean = true;

    public static get DisplayWarnings(): boolean { return Octree.displayWarnings; }
    public static get DisplayErrors(): boolean { return Octree.displayErrors; }

    //bounds - size of the octree
    //objects - objects that will be inserted initially. Other objects can be inserted later on
    //maxObjPerNode - once a leaf node stores more objects that this count, it will divide into smaller nodes
    //maxDepth - how many levels we can have in our octree (maximum depth that we can go if we recursively go from parent to child)
    //minNodeSize - minimum size that a node can have. If we need to divide but the child nodes become smaller than this, then we won't divide
    //debugVisualize - used to draw debug data for the octree. If undefined, won't draw anything. Can be updated using setDebugVisualizer()
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

        //Go through all objects and store the movable ones
        if (objects != null && objects != undefined)
        {
            for (let index = 0; index < objects.length; ++index)
            {
                if (objects[index].isObjMovable())
                    this.movableObjects.push(objects[index]);
            }
        }
        //Create the root. This will automatically add all objects into the octree and create the tree structure
        this.root = new OctreeNode(undefined, bounds, objects, 0, maxObjPerNode, maxDepth, minNodeSize, this.debugVisualizer);
    }

    //Static class which can be used to enable/disable logs
    public static enableLogs(warnings: boolean, errors: boolean)
    {
        Octree.displayWarnings = warnings;
        Octree.displayErrors = errors;
    }

    //Delete all internal data from the octree
    public destroy()
    {
        this.movableObjects = [];
        this.root.destroy();
    }

    //Add an object into the octree. This will recursively go through the hierarchy and add it where needed based on it's bounding box
    //Can also cause Certain nodes to divide (if too many objects are inside a node, it will create a new level underneath of it and split the cube into 8 smaller cubes)
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

    //Remove an object from the octree. This will return true if it succeeds and false otherwise. Also removes from movable list.
    //Can cause certain nodes to collapse (if certain node hierarchies have too few objects, it will delete child nodes and reinsert all objects into the parent)
    public removeObject(obj: Object3D): boolean
    {
        let objBounds = new Box3().setFromObject(obj);

        //Remove the object from the movable list if it exists in there
        for(let index = 0; index < this.movableObjects.length; ++index)
        {
            if(this.movableObjects[index].getObject3D() == obj)
            {
                this.movableObjects.splice(index, 1);
                break;
            }
        }

        //Sanity check to make sure the object is inside the octree
        if (!OctreeHelper.containsBounds(this.root.getBounds(), objBounds))
        {
            if (Octree.DisplayErrors)
                console.error("Cannot remove objects outside the bounds!. Please create a bigger octree.");
            return false;
        }

        //Recursively go through the hierarchy and remove the node. Can cause collapse of lower nodes in the hierarchy
        if(this.root.removeObject(obj, objBounds))
        {
            //If we successfully removed the node, check if we can collapse the root
            if (this.root.canCollapseNode())
                this.root.collapse();
            return true;
        }
        return false;
    }

    //Find all objects that share the same space as the provided point
    //DepthLimit is how deep we will search. If it's -1 will search entire depth
    public queryPoint(point: Vector3, depthLimit: number = -1)
    {
        let foundObjects: OctreeObj[] = [];
        this.root.queryPoint(point, foundObjects, depthLimit);
        return foundObjects;
    }

    //Find all objects that share the same space as the provided bounding box (uses box intersection)
    //DepthLimit is how deep we will search. If it's -1 will search entire depth
    public queryBounds(box: Box3, depthLimit: number = -1)
    {
        let foundObjects: OctreeObj[] = [];
        this.root.queryBounds(box, foundObjects, depthLimit);
        return foundObjects;
    }

    //Change wether or not an object can move or not
    public setMovingObjectFlag(obj: Object3D, canMove: boolean)
    {
        //Sanity check to make sure we are in the octree
        let objBounds = new Box3().setFromObject(obj);
        if (!OctreeHelper.containsBounds(this.root.getBounds(), objBounds))
        {
            if (Octree.DisplayErrors)
                console.error("Object is outside of the octree bounds, this is not allowed.");
            return;
        }
        //Go through the hierarchy, find the object and update it's moving flag
        let foundObj: OctreeObj | undefined = this.root.setMovingObjectFlag(obj, objBounds, canMove);
        if(foundObj != undefined)
        {
            //If we found the object and it shouldn't move, remove from movable list
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
            //If we found the object but it should move, add into the list
            else if (!this.movableObjects.includes(foundObj))
                this.movableObjects.push(foundObj);
        }
    }

    //Update the bounds for all movable objects. In Three.js object bounds don't move together with the object and have to be recalculated whenever they move
    //Bounds calculations is performance heavy, especially for a lot of objects, so I separated into it's own function to make it easier to control this process.
    //Generally, before calling updateMovableObjects() call this function
    //You can also update the bounds for individual objects by calling OctreeObj.updateBounds()
    public updateMovableObjectBounds()
    {
        for(let index = 0; index < this.movableObjects.length; ++index)
        {
            this.movableObjects[index].updateBounds();
        }
    }

    //Update the octree based on how objects moved from the last time this was called.
    //Requires you to recompute the object's bounds by calling updateMovableObjectBounds() before calling this
    public updateMovableObjects()
    {
        //Go through all movable objects
        for(let index = 0; index < this.movableObjects.length; ++index)
        {
            //Find the current node they sit in
            let obj: OctreeObj = this.movableObjects[index];
            let parent: OctreeNode | undefined = obj.getNode();
            if(parent == undefined)
                continue;

            let objBounds = obj.getBounds();

            //If the objects still sits under the same parent
            if (OctreeHelper.containsBounds(parent.getBounds(), objBounds))
            {
                //Go through this node's hierarchy and check to see if there is any smaller node that can fully contain our object
                let smallerNode = parent.findSmallestEncompasingNode(obj);
                if(smallerNode.res == true && smallerNode.node != parent)
                {
                    //If there is, remove the object from parent and add into the smaller node
                    parent.removeObject(obj.getObject3D(), objBounds, false); //false to not collapse the hierarchy (if we collapse, then we can't add lower in the hierarchy)
                    smallerNode.node!.addObject(obj);
                }
                continue;
            }

            //Otherwise, if the node doesn't sit under the same parent, remove from the parent
            parent.removeObject(obj.getObject3D(), objBounds, false);

            //And go recursively upwards in the hierarchy to see if we find a parent that can fully contain this node
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
            //If we didn't find a new parent to add this object in, then add it into the root and display an error.
            //If you get a lot of these errors, you should increase the octree bounds to cover the entire space in which objects can move
            if(!foundNewParent)
            {
                if (Octree.DisplayErrors)
                    console.error("The following object is outside the bounds. Removing from the octree: ", obj, obj.getObject3D().position);
                this.movableObjects.splice(index, 1);
                index--;
                continue;
            }
        }
        //Finally, because we made modifications to the structure, check the entire hierarchy if we can make collapses anywhere
        this.root.tryCollapseRecursive();
    }

    //Get a list of all objects present in the octree
    public getAllObjects()
    {
        let foundElements: OctreeObj[] = [];
        this.root.getChildrenRecursive(foundElements);
        return foundElements;
    }

    //Change debug mode. If you pass undefined as parameter it will hide all debug data
    public setDebugVisualizer(debugVisualizer?: OctreeVisualizer)
    {
        //If previously we were displaying data and we don't want to anymore, hide it
        if(debugVisualizer == undefined && this.debugVisualizer != undefined)
        {
            this.debugVisualizer.releaseAllCubes();
            this.root.clearDebugDataNoRelease();
        }
        //If previously we were not displaying data and now we want to, draw it
        else if(debugVisualizer != undefined && this.debugVisualizer == undefined)
        {
            this.debugVisualizer = debugVisualizer;
            this.root.drawDebugData(this.debugVisualizer);
        }
        this.debugVisualizer = debugVisualizer;
    }
}
`;