export const exposedCodeOctreeObj = `
import { Box3, Color, Object3D } from "three";
import { OctreeNode } from "./OctreeNode";
import { OctreeVisualizer } from "./OctreeVisualizer";
import { OctreeHelper } from "./OctreeHelper";

//This script is used to keep track of relevant data for the objects that are inserted into the octree.
//Most octree operations work with this
export class OctreeObj
{
    private obj: Object3D;
    private bounds: Box3;
    private node?: OctreeNode;
    private isMovable: boolean; //We separate objects that can move from objects that can't move to not have to update all of them

    //Debug data that can be used to draw the bounding box of this object. If debugVisualizer is undefined, no debug data will be drawn
    private debugVisualizer?: OctreeVisualizer;
    private debugCubeId: number = -1;
    private debugColor: Color = new Color(0, 1, 1);

    constructor(obj: Object3D, isMovable: boolean, debugVisualizer?: OctreeVisualizer)
    {
        this.obj = obj;
        this.isMovable = isMovable;

        this.debugVisualizer = debugVisualizer;
        this.bounds = new Box3().setFromObject(obj);
        if(this.debugVisualizer)
        {
            //If we want to draw deebug data, reserve a cube to draw it.
            this.debugCubeId = this.debugVisualizer?.reserveCube(this.bounds, this.debugColor);
        }
    }

    //This function is called by Octree.updateBounds() for all movable objects stored in it
    //Call whenever an object moves and you need to use it's new position in the octree
    public updateBounds()
    {
        //Custom function to recalculate bounding box of the mesh. In Three.js Box3 doesn't update automatically and unfortunately has to be recalculated whenever needed.
        //Three.js has the function Box3.setFromObject() but that one is extremely slow, so I created my own version of it which is faster
        OctreeHelper.recomputeBoundsFast(this.bounds, this.obj);
    }

    public getBounds(): Box3
    {
        return this.bounds;
    }

    public getObject3D(): Object3D
    {
        return this.obj;
    }

    public getNode(): OctreeNode | undefined
    {
        return this.node;
    }

    public isObjMovable(): boolean
    {
        return this.isMovable;
    }

    public setCurrentNode(node: OctreeNode)
    {
        this.node = node;
    }

    public setMovingFlag(canMove: boolean)
    {
        this.isMovable = canMove;
    }

    //If debugVisualizer is undefined, it will hide all debug data
    public setDebugVisualizer(debugVisualizer?: OctreeVisualizer)
    {
        if(debugVisualizer == undefined && this.debugVisualizer != undefined) //Hide debug data if we displayed any previously and now we want to hide it
            this.debugVisualizer.releaseCube(this.debugCubeId);
        else if(debugVisualizer != undefined && this.debugVisualizer == undefined) //Display debug data if previously it was hidden and now we want to display
            this.debugCubeId = debugVisualizer.reserveCube(this.bounds, this.debugColor);
            
        this.debugVisualizer = debugVisualizer;
    }
}
`;