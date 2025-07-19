import { App, TerraformStack, S3Backend } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { Route } from "@cdktf/provider-aws/lib/route";

//1) Remote‑state backend
import {
  StateBucketModule,
  StateLockTableModule
} from "./modules/state-backend";

// 2) Networking
import {
  VpcModule,
  SubnetModule,
  SecurityGroupModule
} from "./modules/network";

// 3) Compute (ECR, IAM, ECS, ALB)
import {
  EcrModule,
  IamModule,
  EcsModule,
  AlbModule
} from "./modules/compute";

// 4) Route53
import { Route53Module } from "./modules/route53";

export class MyStack extends TerraformStack {
  constructor(scope: App, id: string) {
    super(scope, id);

    //AWS PROVIDER
    new AwsProvider(this, "aws", { region: "us-east-1" });

    //STATE BACKEND
    new StateBucketModule(this, "state-bucket");
    new StateLockTableModule(this, "state-lock-table");

    //NETWORK
    const vpc = new VpcModule(this, "vpc");
    const subnets = new SubnetModule(this, "subnets", {
      vpcId: vpc.vpcId,
      publicRouteTableId: vpc.publicRouteTableId,
      privateRouteTableId: vpc.privateRouteTableId,
      publicCidrBlocks: ["10.0.0.0/24", "10.0.3.0/24"],
      publicAvailabilityZones: ["us-east-1a", "us-east-1b"],
      privateCidrBlocks: ["10.0.2.0/24"],
      privateAvailabilityZones: ["us-east-1b"],
    });

    //NAT & EIP
    const eip = new Eip(this, "NatEip", {
      domain: "vpc",
      tags: { Name: "assessment-nat-eip" }
    });
    const nat = new NatGateway(this, "NatGateway", {
      allocationId: eip.id,
      subnetId: subnets.publicSubnetIds[0],
      tags: { Name: "assessment-nat-gateway" }
    });
    new Route(this, "PrivateInternetRoute", {
      routeTableId: vpc.privateRouteTableId,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: nat.id
    });

    //SECURITY GROUP
    const sg = new SecurityGroupModule(this, "security-group", vpc.vpcId);

    //COMPUTE
    const ecr = new EcrModule(this, "ecr");
    const iam = new IamModule(this, "iam");
    const alb = new AlbModule(this, "alb", {
      vpcId: vpc.vpcId,
      subnetIds: subnets.publicSubnetIds,
      securityGroupId: sg.albSecurityGroupId
    });

    new EcsModule(this, "ecs", {
      executionRoleArn: iam.executionRoleArn,
      repositoryUrl: ecr.repositoryUrl,
      vpcId: vpc.vpcId,
      subnetIds: subnets.privateSubnetIds,
      securityGroupId: sg.ecsSecurityGroupId,
      targetGroupArn: alb.targetGroupArn
    });

    //ROUTE 53
    new Route53Module(this, "route53", {
      domainName: "assessment.com",
      albDnsName: alb.loadBalancerDnsName,
      albZoneId: alb.loadBalancerZoneId
    });
  }
}

const app = new App();
const stack = new MyStack(app, "tv-devops-assessment");
new S3Backend(stack, {
     bucket:        "sravanthi-iac-state",
     key:           "terraform.tfstate",
     region:        "us-east-1",
     dynamodbTable: "terraform-locks",
     encrypt:       true,
   });
app.synth();
