import { Construct } from "constructs";
import { S3Bucket }  from "@cdktf/provider-aws/lib/s3-bucket";

export class StateBucketModule extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    new S3Bucket(this, "StateBucket", {
      bucket: "sravanthi-iac-state",
      versioning: { enabled: true },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: { sseAlgorithm: "AES256" }
        }
      }
    });
  }
}
