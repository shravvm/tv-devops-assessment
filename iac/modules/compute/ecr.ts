import { Construct } from "constructs";
import { EcrRepository } from "@cdktf/provider-aws/lib/ecr-repository";

export class EcrModule extends Construct {
  public readonly repositoryUrl: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    const repo = new EcrRepository(this, "Repo", {
      name: "assessment-ecr-repo",
      tags: { Name: "assessment-ecr-repo" }
    });
    this.repositoryUrl = repo.repositoryUrl;
  }
}