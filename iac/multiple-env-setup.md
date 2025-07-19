# Multi-Environment Setup Guide – CDK for Terraform (CDKTF)

## Current Design

In a production-ready setup, environments such as `dev`, `staging`, and `prod` are typically deployed to **separate AWS accounts** to ensure **isolation**, **security**, and **cost tracking**.

For the **purpose of this assessment**, I have deployed **only a single environment** using a single AWS account to keep the setup **simple and focused**.


## Deploying Multiple Environments with Separate Stacks

We can define and synthesize multiple CDKTF stacks for environments like dev, staging, and prod by extending main.ts

### Step 1: Define Environment-Aware Stack

```ts
import { App } from "cdktf";
import { MyStack } from "./stack";
import { config } from "./variables";

// Create CDKTF app
const app = new App();

// Define environments
const environments = ["dev", "staging", "prod"];

for (const env of environments) {
  const stack = new MyStack(app, `tv-${env}`, env);

  // Use a unique backend per environment
  stack.addOverride("terraform.backend.s3", {
    bucket: config.backend.bucket,
    key: `state-${env}/terraform.tfstate`,
    region: config.backend.region,
    dynamodb_table: config.backend.dynamodbTable,
    encrypt: true,
  });
}

app.synth();
```

This will generate three separate Terraform stacks named:

- `tv-dev`
- `tv-staging`
- `tv-prod`

Each with its own isolated state file.



### Step 2: Update MyStack to Accept env Parameter

```ts
export class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string, env: string) {
    super(scope, id);

    const environment = env || "dev";

    // Use environment name in resource names
    const clusterName = `assessment-ecs-cluster-${environment}`;
    const vpcName = `assessment-vpc-${environment}`;

    // Pass `environment` into resource modules as needed
  }
}
```

### Step 3: Deploy specific stack

cdktf deploy --stack tv-staging
```