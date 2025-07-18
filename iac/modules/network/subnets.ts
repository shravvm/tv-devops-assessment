import { Construct } from "constructs";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";

export interface SubnetModuleProps {
  readonly vpcId: string;
  readonly publicCidrBlocks: string[]; // CIDRs for public subnets
  readonly publicAvailabilityZones: string[]; // AZs for public subnets
  readonly privateCidrBlocks: string[]; // CIDRs for private subnets
  readonly privateAvailabilityZones: string[]; // AZs for private subnets
  readonly publicRouteTableId: string; // ID of the public route table
  readonly privateRouteTableId: string; // ID of the private route table
}

export class SubnetModule extends Construct {
  public readonly publicSubnetIds: string[] = [];
  public readonly privateSubnetIds: string[] = [];

  constructor(scope: Construct, id: string, props: SubnetModuleProps) {
    super(scope, id);

    if (props.publicCidrBlocks.length !== props.publicAvailabilityZones.length) {
      throw new Error("publicCidrBlocks and publicAvailabilityZones must be the same length");
    }

    // Create public subnets and associations
    this.publicSubnetIds = props.publicAvailabilityZones.map((az, idx) => {
      const subnet = new Subnet(this, `PublicSubnet-${az}`, {
        vpcId: props.vpcId,
        cidrBlock: props.publicCidrBlocks[idx],
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: { Name: `assessment-public-subnet-${az}` }
      });

      // Associate with public route table
      new RouteTableAssociation(this, `PublicAssociation-${az}`, {
        subnetId: subnet.id,
        routeTableId: props.publicRouteTableId,
      });

      return subnet.id;
    });

    if (props.privateCidrBlocks.length !== props.privateAvailabilityZones.length) {
      throw new Error("privateCidrBlocks and privateAvailabilityZones must be the same length");
    }

    // Create private subnets and associations
    this.privateSubnetIds = props.privateAvailabilityZones.map((az, idx) => {
      const subnet = new Subnet(this, `PrivateSubnet-${az}`, {
        vpcId: props.vpcId,
        cidrBlock: props.privateCidrBlocks[idx],
        availabilityZone: az,
        mapPublicIpOnLaunch: false,
        tags: { Name: `assessment-private-subnet-${az}` }
      });

      // Associate with private route table
      new RouteTableAssociation(this, `PrivateAssociation-${az}`, {
        subnetId: subnet.id,
        routeTableId: props.privateRouteTableId,
      });

      return subnet.id;
    });
  }
}