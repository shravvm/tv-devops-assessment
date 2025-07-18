import { Construct } from "constructs";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";

export class SecurityGroupModule extends Construct {
  public readonly albSecurityGroupId: string;
  public readonly ecsSecurityGroupId: string;

  constructor(scope: Construct, id: string, vpcId: string) {
    super(scope, id);

    // ALB Security Group: Allow HTTP/HTTPS from internet, all outbound
    const albSg = new SecurityGroup(this, "AlbSG", {
      vpcId,
      name: "assessment-alb-sg",
      description: "Allow HTTP/HTTPS inbound to ALB, all outbound",
      ingress: [
        { fromPort: 80, toPort: 80, protocol: "tcp", cidrBlocks: ["0.0.0.0/0"] },  
        { fromPort: 443, toPort: 443, protocol: "tcp", cidrBlocks: ["0.0.0.0/0"] } 
      ],
      egress: [{ fromPort: 0, toPort: 0, protocol: "-1", cidrBlocks: ["0.0.0.0/0"] }],
      tags: { Name: "assessment-alb-sg" }
    });
    this.albSecurityGroupId = albSg.id;

    // ECS Security Group: Allow inbound from ALB SG only on app port (e.g., 8080), all outbound
    const ecsSg = new SecurityGroup(this, "EcsSG", {
      vpcId,
      name: "assessment-ecs-sg",
      description: "Allow inbound from ALB on app port, all outbound",
      ingress: [
        { fromPort: 8080, toPort: 8080, protocol: "tcp", securityGroups: [albSg.id] }
      ],
      egress: [{ fromPort: 0, toPort: 0, protocol: "-1", cidrBlocks: ["0.0.0.0/0"] }],
      tags: { Name: "assessment-ecs-sg" }
    });
    this.ecsSecurityGroupId = ecsSg.id;
  }
}