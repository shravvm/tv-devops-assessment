import { Construct } from "constructs";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";

export class IamModule extends Construct {
  public readonly executionRoleArn: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const role = new IamRole(this, "ExecutionRole", {
      name: "assessment-ecs-execution-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{ Effect: "Allow", Principal: { Service: "ecs-tasks.amazonaws.com" }, Action: "sts:AssumeRole" }]
      }),
      tags: { Name: "assessment-ecs-execution-role" }
    });

    // AWS managed policy for ECS task execution
    new IamRolePolicyAttachment(this, "ExecutionPolicy", {
      role: role.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    });

    this.executionRoleArn = role.arn;
  }
}