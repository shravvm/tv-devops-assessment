import { Construct } from "constructs";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamRolePolicy } from "@cdktf/provider-aws/lib/iam-role-policy";

export class IamModule extends Construct {
  public readonly executionRoleArn: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const role = new IamRole(this, "ExecutionRole", {
      name: "assessment-ecs-execution-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: { Service: "ecs-tasks.amazonaws.com" },
          Action: "sts:AssumeRole"
        }]
      }),
      tags: { Name: "assessment-ecs-execution-role" }
    });

    // Attach AWS managed ECS execution policy
    new IamRolePolicyAttachment(this, "EcsExecutionPolicy", {
      role: role.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    });

    // Attach AWS managed ECR read-only access
    new IamRolePolicyAttachment(this, "EcrReadPolicy", {
      role: role.name,
      policyArn: "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
    });

    // Optional: Minimal CloudWatch logging access (if not covered by managed policy)
    new IamRolePolicy(this, "MinimalCloudWatchLogsPolicy", {
      name: "MinimalCloudWatchLogsPolicy",
      role: role.name,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Action: [
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          Resource: "*"
        }]
      })
    });

    this.executionRoleArn = role.arn;
  }
}