function parseList(value: string | undefined, fallback: string[]): string[] {
    return value ? value.split(",").map((v) => v.trim()) : fallback;
  }
  
export const config = {
    awsRegion: process.env.AWS_REGION || "us-east-1",
    domainName: process.env.DOMAIN_NAME || "assessment.com",
    imageTag: process.env.IMAGE_TAG || "latest",
  
    backend: {
      bucket: process.env.BACKEND_BUCKET || "sravanthi-iac-state",
      key: process.env.BACKEND_KEY || "terraform.tfstate",
      region: process.env.BACKEND_REGION || "us-east-1",
      dynamodbTable: process.env.BACKEND_DYNAMODB_TABLE || "terraform-locks",
    },
  
    vpc: {
      cidr: process.env.VPC_CIDR || "10.0.0.0/16",
      publicSubnetCidrs: parseList(process.env.PUBLIC_SUBNET_CIDRS, ["10.0.0.0/24", "10.0.3.0/24"]),
      privateSubnetCidrs: parseList(process.env.PRIVATE_SUBNET_CIDRS, ["10.0.2.0/24"]),
      publicZones: parseList(process.env.PUBLIC_SUBNET_ZONES, ["us-east-1a", "us-east-1b"]),
      privateZones: parseList(process.env.PRIVATE_SUBNET_ZONES, ["us-east-1b"]),
    }
  };