export declare type BoidSettings = {
    minSpeed: number,
    maxSpeed: number,
    maxForce: number,

    separationFactor: number,
    alignmentFactor: number,
    cohesionFactor: number,
    boundsSteerFactor: number,
    collisionAvoidFactor: number,
    pullTargetFactor: number,

    boundsDetectDist: number,
    viewRadius: number,
    separationRadius: number,
    viewAngle: number,
    viewRadiusSegmentSize: number
}