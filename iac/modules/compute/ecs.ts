import { Construct } from "constructs";
import { EcsCluster } from "@cdktf/provider-aws/lib/ecs-cluster";
import { EcsTaskDefinition } from "@cdktf/provider-aws/lib/ecs-task-definition";
import { EcsService } from "@cdktf/provider-aws/lib/ecs-service";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";

export interface EcsProps {
  readonly executionRoleArn: string;
  readonly repositoryUrl:    string;
  readonly vpcId:            string;
  readonly subnetIds:        string[];
  readonly securityGroupId:  string;
  readonly targetGroupArn:   string;
  readonly awsRegion:        string;  //dynamic log region
  readonly imageTag?:        string;
}

export class EcsModule extends Construct {
  constructor(scope: Construct, id: string, props: EcsProps) {
    super(scope, id);

    const cluster = new EcsCluster(this, "Cluster", {
      name: "assessment-ecs-cluster",
      tags: { Name: "assessment-ecs-cluster" },
    });

    const logGroup = new CloudwatchLogGroup(this, "AppLogGroup", {
      name: "/ecs/assessment-app",
      retentionInDays: 7,
    });

    const taskDef = new EcsTaskDefinition(this, "TaskDef", {
      family: "assessment-app-task",
      networkMode: "awsvpc",
      cpu: "256",
      memory: "512",
      requiresCompatibilities: ["FARGATE"],
      executionRoleArn: props.executionRoleArn,
      containerDefinitions: JSON.stringify([
        {
          name: "app",
          image: `${props.repositoryUrl}:${props.imageTag ?? "latest"}`,
          portMappings: [
            { containerPort: 3000, hostPort: 3000, protocol: "tcp" },
          ],
          logConfiguration: {
            logDriver: "awslogs",
            options: {
              "awslogs-group": logGroup.name,
              "awslogs-region": props.awsRegion,
              "awslogs-stream-prefix": "ecs",
            },
          },
        },
      ]),
      tags: { Name: "assessment-app-task" },
    });

    new EcsService(this, "Service", {
      name: "assessment-app-service",
      cluster: cluster.arn,
      taskDefinition: taskDef.arn,
      launchType: "FARGATE",
      desiredCount: 1,
      healthCheckGracePeriodSeconds: 60,
      networkConfiguration: {
        subnets: props.subnetIds,
        securityGroups: [props.securityGroupId],
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn: props.targetGroupArn,
          containerName: "app",
          containerPort: 3000,
        },
      ],
      tags: { Name: "assessment-app-service" },
    });
  }
}