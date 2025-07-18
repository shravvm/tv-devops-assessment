import { Construct }     from "constructs";
import { Lb }            from "@cdktf/provider-aws/lib/lb";
import { LbTargetGroup } from "@cdktf/provider-aws/lib/lb-target-group";
import { LbListener }    from "@cdktf/provider-aws/lib/lb-listener";

export interface AlbProps {
  readonly vpcId:           string;
  readonly subnetIds:       string[];
  readonly securityGroupId: string;
}

export class AlbModule extends Construct {
  public readonly targetGroupArn:     string;
  public readonly loadBalancerDnsName: string;
  public readonly loadBalancerZoneId:  string;

  constructor(scope: Construct, id: string, props: AlbProps) {
    super(scope, id);

    // 1) Application Load Balancer
    const alb = new Lb(this, "ALB", {
      name:             "assessment-alb",
      internal:         false,
      loadBalancerType: "application",
      securityGroups:   [props.securityGroupId],
      subnets:          props.subnetIds,
      tags:             { Name: "assessment-alb" },
    });

    // expose for Route53 alias
    this.loadBalancerDnsName = alb.dnsName;
    this.loadBalancerZoneId  = alb.zoneId;

    // 2) Target Group
    const tg = new LbTargetGroup(this, "TargetGroup", {
      name:       "assessment-tg",
      port:       3000,               // match container’s port
      protocol:   "HTTP",
      targetType: "ip",
      vpcId:      props.vpcId,
      tags:       { Name: "assessment-tg" },
    });
    this.targetGroupArn = tg.arn;

    // 3) Listener
    new LbListener(this, "Listener", {
      loadBalancerArn: alb.arn,
      port:            80,
      protocol:        "HTTP",
      defaultAction:   [{ type: "forward", targetGroupArn: tg.arn }],
      tags:            { Name: "assessment-listener" },
    });
  }
}
