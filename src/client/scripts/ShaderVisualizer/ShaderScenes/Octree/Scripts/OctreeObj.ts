import { Box3, Color, Object3D } from "three";
import { OctreeNode } from "./OctreeNode";
import { OctreeVisualizer } from "./OctreeVisualizer";
import { OctreeHelper } from "./OctreeHelper";

export class OctreeObj
{
    private obj: Object3D;
    private bounds: Box3;
    private node?: OctreeNode;
    private isMovable: boolean;

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
            this.debugCubeId = this.debugVisualizer?.reserveCube(this.bounds, this.debugColor);
        }
    }

    public UpdateBounds()
    {
        OctreeHelper.RecomputeBoundsFast(this.bounds, this.obj);
    }

    public GetBounds(): Box3
    {
        return this.bounds;
    }

    public GetObject3D(): Object3D
    {
        return this.obj;
    }

    public GetNode(): OctreeNode | undefined
    {
        return this.node;
    }

    public IsMovable(): boolean
    {
        return this.isMovable;
    }

    public SetCurrentNode(node: OctreeNode)
    {
        this.node = node;
    }

    public SetMovingFlag(canMove: boolean)
    {
        this.isMovable = canMove;
    }

    public SetDebugVisualizer(debugVisualizer?: OctreeVisualizer)
    {
        if(debugVisualizer == undefined && this.debugVisualizer != undefined)
            this.debugVisualizer.releaseCube(this.debugCubeId);
        else if(debugVisualizer != undefined && this.debugVisualizer == undefined)
            this.debugCubeId = debugVisualizer.reserveCube(this.bounds, this.debugColor);
        this.debugVisualizer = debugVisualizer;
    }
}