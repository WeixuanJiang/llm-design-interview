import { describe, expect, it } from "vitest";
import { AWS_SERVICE_GROUPS, awsServiceLibrary } from "./awsServiceLibrary";

describe("AWS architecture component library", () => {
  it("covers the major AI system-design service families", () => {
    expect(awsServiceLibrary.length).toBeGreaterThanOrEqual(85);
    expect(new Set(awsServiceLibrary.map(({ id }) => id)).size).toBe(awsServiceLibrary.length);

    for (const group of AWS_SERVICE_GROUPS) {
      expect(awsServiceLibrary.filter((component) => component.group === group).length, group).toBeGreaterThanOrEqual(5);
    }
  });

  it("includes the core services needed for production AI and ML architectures", () => {
    const ids = new Set(awsServiceLibrary.map(({ id }) => id));
    [
      "bedrock",
      "agentcore",
      "bedrock-knowledge-bases",
      "sagemaker",
      "sagemaker-feature-store",
      "sagemaker-model-monitor",
      "lambda",
      "ecs",
      "eks",
      "s3",
      "dynamodb",
      "opensearch",
      "sqs",
      "eventbridge",
      "step-functions",
      "api-gateway",
      "vpc",
      "iam",
      "kms",
      "cloudwatch",
      "cloudtrail",
      "ecr",
    ].forEach((id) => expect(ids, id).toContain(id));
  });
});
