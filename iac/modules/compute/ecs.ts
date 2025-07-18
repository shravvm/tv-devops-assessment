import { Construct }         from "constructs";
import { EcsCluster }        from "@cdktf/provider-aws/lib/ecs-cluster";
import { EcsTaskDefinition } from "@cdktf/provider-aws/lib/ecs-task-definition";
import { EcsService }        from "@cdktf/provider-aws/lib/ecs-service";

export interface EcsProps {
  readonly executionRoleArn: string;
  readonly repositoryUrl:    string;
  readonly vpcId:            string;
  readonly subnetIds:        string[];
  readonly securityGroupId:  string;
  readonly targetGroupArn:   string;  // For ALB integration
}

export class EcsModule extends Construct {
  constructor(scope: Construct, id: string, props: EcsProps) {
    super(scope, id);

    // Cluster
    const cluster = new EcsCluster(this, "Cluster", {
      name: "assessment-ecs-cluster",
      tags: { Name: "assessment-ecs-cluster" }
    });

    // Task Definition
    const taskDef = new EcsTaskDefinition(this, "TaskDef", {
      family:                  "assessment-app-task",
      networkMode:             "awsvpc",
      cpu:                     "256",
      memory:                  "512",
      requiresCompatibilities: ["FARGATE"],
      executionRoleArn:        props.executionRoleArn,
      containerDefinitions: JSON.stringify([{
        name:         "app",
        image:        `${props.repositoryUrl}:latest`,
        portMappings: [{ containerPort: 3000, hostPort: 3000, protocol: "tcp" }]
      }]),
      tags: { Name: "assessment-app-task" }
    });

    // Service (Fargate)
    new EcsService(this, "Service", {
      name:           "assessment-app-service",
      cluster:        cluster.arn,
      taskDefinition: taskDef.arn,
      launchType:     "FARGATE",
      desiredCount:   1,
      networkConfiguration: {
        subnets:        props.subnetIds,
        securityGroups: [props.securityGroupId],
        assignPublicIp: false
      },
      loadBalancer: [{  
        targetGroupArn: props.targetGroupArn,
        containerName:  "app",
        containerPort:  3000
      }],
      tags: { Name: "assessment-app-service" }
    });
  }
}