# TurboVets DevOps Assessment

This repo contains my solution for the TurboVets DevOps Assessment. It includes:

- `app/`: A containerized Express.js + TypeScript app with CI/CD pipeline
- `iac/`: CDKTF (TypeScript) code to deploy the app on AWS ECS (Fargate)

##  Repo Structure

├── app/ # Express.js app with Docker, Compose & GitHub Actions
└── iac/ # Infrastructure as Code using CDK for Terraform


## 📽 Walkthrough Video



## ✅ Features

🐳 Dockerized Node.js application
⚙️ GitHub Actions CI/CD: Build → Push to ECR → Deploy to ECS
☁️ Infrastructure provisioned manually using cdktf deploy
🚀 ECS (Fargate) deployment behind an Application Load Balancer
🛡️ Secure networking with VPC, subnets, and security groups
📦 Remote Terraform backend (S3 + DynamoDB)
✅ Public /health endpoint for liveness checks

## 💡 Deployment Strategy

This project follows a hybrid deployment approach that separates infrastructure provisioning from application deployment:

  - **Initial Infra Setup**: The initial provisioning of core AWS infrastructure — including:

VPC and subnets, Security groups,ECR repository, ECS cluster and service,Load balancer, IAM roles is handled manually using cdktf deploy. Refer to README.md in iac/ folder

      - This is done once during the initial setup, or any time infrastructure-level changes are required.
      - This ensures clean separation between infrastructure lifecycle and app delivery.

  - **CI/CD Updates**: GitHub Actions automatically builds and deploys app changes by pushing a new Docker image to ECR and updating the ECS service. Refer to README.md in app/folder

      - This separation ensures fast, reliable deployments without unnecessary infrastructure churn.

## Why This Approach?

  - Faster CI/CD: Infrastructure doesn't get redeployed on every code push.
  - More secure and controlled: Infra changes go through an explicit review and deploy process. 
  - A separate GitHub Actions workflow can be created later to automate infra deployments as needed.

## 🧪 Health Check


`curl http://assessment-alb-1828551753.us-east-1.elb.amazonaws.com/health` → should return `OK`

## Submission Summary

✅ All required infrastructure is provisioned using CDKTF (TypeScript) in the iac/ directory

✅ App deployment is separate and handled via GitHub Actions in the app/ directory

✅ The infrastructure setup is portable, configurable via environment variables, and follows best practices