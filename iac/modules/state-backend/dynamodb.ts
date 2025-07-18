import { Construct }      from "constructs";
import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb-table";

export class StateLockTableModule extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    new DynamodbTable(this, "LockTable", {
      name:        "terraform-backend-lock",
      billingMode: "PAY_PER_REQUEST",
      hashKey:     "LockID",
      attribute:   [{ name: "LockID", type: "S" }]
    });
  }
}
