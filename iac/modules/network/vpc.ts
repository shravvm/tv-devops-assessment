// modules/network/vpc.ts

import { Construct } from "constructs";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";

export interface VpcModuleProps {
  cidrBlock: string;
}

export class VpcModule extends Construct {
  public readonly vpcId: string;
  public readonly publicRouteTableId: string;
  public readonly privateRouteTableId: string;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    const vpc = new Vpc(this, "Vpc", {
      cidrBlock: props.cidrBlock,
      tags: { Name: "assessment-vpc" }
    });

    this.vpcId = vpc.id;

    const igw = new InternetGateway(this, "InternetGateway", {
      vpcId: vpc.id,
      tags: { Name: "assessment-igw" }
    });

    const publicRouteTable = new RouteTable(this, "PublicRouteTable", {
      vpcId: vpc.id,
      route: [{
        cidrBlock: "0.0.0.0/0",
        gatewayId: igw.id,
      }],
      tags: { Name: "assessment-public-route-table" }
    });

    this.publicRouteTableId = publicRouteTable.id;

    const privateRouteTable = new RouteTable(this, "PrivateRouteTable", {
      vpcId: vpc.id,
      tags: { Name: "assessment-private-route-table" }
    });

    this.privateRouteTableId = privateRouteTable.id;
  }
}