import { Construct } from "constructs";
import { Route53Zone } from "@cdktf/provider-aws/lib/route53-zone";
import { Route53Record } from "@cdktf/provider-aws/lib/route53-record";

export interface Route53ModuleProps {
  domainName: string;
  albDnsName: string;
  albZoneId: string;
}

export class Route53Module extends Construct {
  public readonly zoneId: string;

  constructor(scope: Construct, id: string, props: Route53ModuleProps) {
    super(scope, id);

    const zone = new Route53Zone(this, "HostedZone", {
      name: props.domainName
    });

    this.zoneId = zone.zoneId;

    new Route53Record(this, "AppAliasRecord", {
      zoneId: zone.zoneId,
      name: `app.${props.domainName}`,
      type: "A",
      alias: {
        name: props.albDnsName,
        zoneId: props.albZoneId,
        evaluateTargetHealth: true
      }
    });
  }
}
