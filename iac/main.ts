import { App, TerraformStack, S3Backend, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { Route } from "@cdktf/provider-aws/lib/route";

import {
  StateBucketModule,
  StateLockTableModule,
} from "./modules/state-backend";

import {
  VpcModule,
  SubnetModule,
  SecurityGroupModule,
} from "./modules/network";

import {
  EcrModule,
  IamModule,
  EcsModule,
  AlbModule,
} from "./modules/compute";

import { Route53Module } from "./modules/route53";
import { config } from "./variables";

export class MyStack extends TerraformStack {
  constructor(scope: App, id: string) {
    super(scope, id);

    // Provider
    new AwsProvider(this, "aws", {
      region: config.awsRegion,
    });

    // Remote state infra
    new StateBucketModule(this, "state-bucket");
    new StateLockTableModule(this, "state-lock-table");

    // Network
    const vpc = new VpcModule(this, "vpc", {
      cidrBlock: config.vpc.cidr,
    });
    const subnets = new SubnetModule(this, "subnets", {
      vpcId: vpc.vpcId,
      publicRouteTableId: vpc.publicRouteTableId,
      privateRouteTableId: vpc.privateRouteTableId,
      publicCidrBlocks: config.vpc.publicSubnetCidrs,
      publicAvailabilityZones: config.vpc.publicZones,
      privateCidrBlocks: config.vpc.privateSubnetCidrs,
      privateAvailabilityZones: config.vpc.privateZones,
    });

    const eip = new Eip(this, "NatEip", {
      domain: "vpc",
      tags: { Name: "assessment-nat-eip" },
    });

    const nat = new NatGateway(this, "NatGateway", {
      allocationId: eip.id,
      subnetId: subnets.publicSubnetIds[0],
      tags: { Name: "assessment-nat-gateway" },
    });

    new Route(this, "PrivateInternetRoute", {
      routeTableId: vpc.privateRouteTableId,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: nat.id,
    });

    // Security groups
    const sg = new SecurityGroupModule(this, "security-group", vpc.vpcId);

    // Compute
    const ecr = new EcrModule(this, "ecr");
    const iam = new IamModule(this, "iam");
    const alb = new AlbModule(this, "alb", {
      vpcId: vpc.vpcId,
      subnetIds: subnets.publicSubnetIds,
      securityGroupId: sg.albSecurityGroupId,
    });

    new EcsModule(this, "ecs", {
      executionRoleArn: iam.executionRoleArn,
      repositoryUrl: ecr.repositoryUrl,
      vpcId: vpc.vpcId,
      subnetIds: subnets.privateSubnetIds,
      securityGroupId: sg.ecsSecurityGroupId,
      targetGroupArn: alb.targetGroupArn,
      awsRegion: config.awsRegion,
    });

    new Route53Module(this, "route53", {
      domainName: config.domainName,
      albDnsName: alb.loadBalancerDnsName,
      albZoneId: alb.loadBalancerZoneId,
    });

    // Outputs
    new TerraformOutput(this, "alb_dns_name", {
      value: alb.loadBalancerDnsName,
    });

  }
}

const app = new App();
const stack = new MyStack(app, "tv-devops-assessment");

new S3Backend(stack, {
  bucket: config.backend.bucket,
  key: config.backend.key,
  region: config.backend.region,
  dynamodbTable: config.backend.dynamodbTable,
  encrypt: true,
});

app.synth();