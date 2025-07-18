import { Construct } from "constructs";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
export class VpcModule extends Construct {
  public readonly vpcId: string;
  public readonly publicRouteTableId: string;
  public readonly privateRouteTableId: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    const vpc = new Vpc(this, "Vpc", {
      cidrBlock: "10.0.0.0/16",
      tags: { Name: "assessment-vpc" }
    });
    this.vpcId = vpc.id;

    // Internet Gateway
    const igw = new InternetGateway(this, "InternetGateway", {
      vpcId: vpc.id,
      tags: { Name: "assessment-igw" }
    });

    // Public Route Table (with route to IGW for internet access)
    const publicRouteTable = new RouteTable(this, "PublicRouteTable", {
      vpcId: vpc.id,
      route: [{
        cidrBlock: "0.0.0.0/0",
        gatewayId: igw.id,
      }],
      tags: { Name: "assessment-public-route-table" }
    });
    this.publicRouteTableId = publicRouteTable.id;

    // Private Route Table (no default route; add NAT Gateway later if outbound internet is needed)
    const privateRouteTable = new RouteTable(this, "PrivateRouteTable", {
      vpcId: vpc.id,
      tags: { Name: "assessment-private-route-table" }
    });
    this.privateRouteTableId = privateRouteTable.id;
  }
}