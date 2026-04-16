export const exposedCodeBoidSettings = `
//Those are settings that control how boids work
export declare type BoidSettings = {
    //Boids can move between min & max speed depending on the forces that need to be applied to them
    minSpeed: number,
    maxSpeed: number,
    maxForce: number, //Is used to clamp forces applied to the boid

    //Main boid rules which control how they interact with other boids
    separationFactor: number,       //Separation forces boids to not collide to one another
    alignmentFactor: number,        //Alignment forces close boids to follow the same movement direction
    cohesionFactor: number,         //Cohesion forces boids to move towards the center of mass of boids that they can detect (creates interesting movement patterns)

    //Other boid rules that control how they interact with the environment
    boundsSteerFactor: number,      //Forces boids avoid going out of bounds
    collisionAvoidFactor: number,   //Forces boids to avoid obstacles
    pullTargetFactor: number,       //Forces boids to move towards a "pullTarget" which can be set up individually for each boid

    //General parameters
    boundsDetectDist: number,       //How close to the bounds we should be to start moving away from it
    viewRadius: number,             //How far a boid can detect other boids
    separationRadius: number,       //How close a boid has to be to another one to start applying the separation force (should be smaller than the viewRadius)
    viewAngle: number,              //Creates a view cone/hemisphere based on this, which is used to detect nearby boids and for collision detection
    viewRadiusSegmentSize: number   //Controls how many rays we will end up generating for collision detection
}
`;