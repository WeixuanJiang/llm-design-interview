import sources from "./awsCustomerSources.json";
import { missionCaseStudies } from "./missionCaseStudies";
import { missionSpecifications } from "./missionSpecifications";
import type { ArchitectureComponentSpec } from "../components/ArchitectureBuilder";

export type MissionArchetype = "agent" | "document" | "ml-platform" | "analytics" | "realtime";

export interface AwsCustomerMission {
  id: string;
  customer: string;
  title: string;
  sourceUrl: string;
  industry: string;
  archetype: MissionArchetype;
  description: string;
  actors: string[];
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  scaleAssumptions: string[];
  dataFlow: string[];
  risks: string[];
  metrics: string[];
  stressEvent: string;
  components: ArchitectureComponentSpec[];
}

function classify(title: string): { archetype: MissionArchetype; industry: string } {
  const value = title.toLowerCase();
  const industry = /clinical|health|patient|medical|genetic|trial|provider/.test(value) ? "Healthcare and life sciences"
    : /bank|finance|insurance|mortgage|loan|investment|accounting|payment|fraud/.test(value) ? "Financial services"
    : /energy|power|seismic|solar|manufactur|tyres|meter/.test(value) ? "Energy and industrial"
    : /media|music|video|creative|gaming|theater|vfx/.test(value) ? "Media and entertainment"
    : /telecom|network|iot|transport|fleet|shipping|vessel/.test(value) ? "Telecommunications and transport"
    : /property|home buying|ecommerce|marketplace|advertis|customer/.test(value) ? "Consumer and commerce"
    : "Enterprise software";
  const archetype: MissionArchetype = /document|email|contract|id extraction|classification|textract|translation/.test(value) ? "document"
    : /model training|mlops|machine learning model|inference|fine-tun|computer vision|forecast|inspection/.test(value) ? "ml-platform"
    : /real-time|low-latency|voice|iot|conversational contact/.test(value) ? "realtime"
    : /analytics|insight|report|search|data access|text-to-sql/.test(value) ? "analytics"
    : "agent";
  return { archetype, industry };
}

const component = (id: string, label: string, service: string, category: ArchitectureComponentSpec["category"], description: string): ArchitectureComponentSpec => ({ id, label, service, category, description });
const shared = [
  component("api-gateway", "Amazon API Gateway", "API Gateway", "entry", "Authenticated request entry, quotas, and routing"),
  component("bedrock", "Amazon Bedrock", "Bedrock", "ai", "Managed foundation-model inference and guardrails"),
  component("s3", "Amazon S3", "S3", "data", "Versioned source, training, and evaluation data"),
  component("lambda", "AWS Lambda", "Lambda", "compute", "Validation, event handling, and lightweight orchestration"),
  component("sqs", "Amazon SQS", "SQS", "queue", "Durable buffering, retries, and workload isolation"),
  component("cloudwatch", "Amazon CloudWatch", "CloudWatch", "compute", "Operational metrics, traces, alarms, and audit evidence"),
];
const archetypeComponents: Record<MissionArchetype, ArchitectureComponentSpec[]> = {
  agent: [...shared, component("agentcore", "Bedrock AgentCore", "Bedrock AgentCore", "ai", "Agent runtime, identity, memory, and observability"), component("dynamodb", "Amazon DynamoDB", "DynamoDB", "data", "Workflow state, permissions, and idempotency records"), component("step-functions", "AWS Step Functions", "Step Functions", "compute", "Auditable multi-step workflow orchestration")],
  document: [...shared, component("textract", "Amazon Textract", "Textract", "ai", "OCR, forms, and table extraction"), component("opensearch", "Amazon OpenSearch", "OpenSearch", "data", "Hybrid retrieval and document indexes"), component("step-functions", "AWS Step Functions", "Step Functions", "compute", "Human review and document workflow orchestration")],
  "ml-platform": [...shared, component("sagemaker", "Amazon SageMaker AI", "SageMaker AI", "ai", "Training, registry, evaluation, and managed inference"), component("kinesis", "Amazon Kinesis", "Kinesis Data Streams", "queue", "Streaming observations and prediction outcomes"), component("glue", "AWS Glue", "Glue", "compute", "Cataloged data preparation and feature pipelines")],
  analytics: [...shared, component("opensearch", "Amazon OpenSearch", "OpenSearch", "data", "Search, vectors, and permission-aware retrieval"), component("redshift", "Amazon Redshift", "Redshift", "data", "Governed analytical data and semantic models"), component("dynamodb", "Amazon DynamoDB", "DynamoDB", "data", "Session state and access-control context")],
  realtime: [...shared, component("kinesis", "Amazon Kinesis", "Kinesis Data Streams", "queue", "Continuous events, audio, or device telemetry"), component("sagemaker", "Amazon SageMaker AI", "SageMaker AI", "ai", "Low-latency model inference and monitoring"), component("elasticache", "Amazon ElastiCache", "ElastiCache", "data", "Hot state and latency-sensitive features")],
};

if (missionCaseStudies.length !== sources.length || missionSpecifications.length !== sources.length) {
  throw new Error(`Expected ${sources.length} explicit mission case studies and specifications, received ${missionCaseStudies.length} cases and ${missionSpecifications.length} specifications.`);
}

export const awsCustomerMissions: AwsCustomerMission[] = sources.map((source, index) => {
  const caseStudy = missionCaseStudies[index];
  const specification = missionSpecifications[index];
  const expectedIndex = index + 1;
  if (!caseStudy || caseStudy.sourceIndex !== expectedIndex || !specification || specification.sourceIndex !== expectedIndex) {
    throw new Error(`Missing explicit mission case study or specification ${String(expectedIndex).padStart(3, "0")}.`);
  }

  const { customer, title, description } = caseStudy;
  const { archetype, industry } = classify(title);
  return {
    id: `aws-customer-${String(index + 1).padStart(3, "0")}`,
    customer,
    title,
    sourceUrl: source.Url,
    industry,
    archetype,
    description,
    actors: ["End users", `${customer} product and operations teams`, "Data and ML platform engineers", "Security, risk, and compliance reviewers"],
    functionalRequirements: specification.functionalRequirements,
    nonFunctionalRequirements: specification.nonFunctionalRequirements,
    scaleAssumptions: specification.scaleAssumptions,
    dataFlow: specification.dataFlow,
    risks: ["Unauthorized or cross-tenant data reaches a model, index, log, or downstream tool.", "Stale data, schema drift, or training-serving skew silently reduces quality.", "A dependency slowdown combines with retries and creates cascading saturation.", "Aggregate metrics hide a severe regression for a high-impact cohort.", "Automation takes an irreversible action without sufficient evidence or approval."],
    metrics: ["Task success and severe-error rate on representative and difficult cohorts.", "Groundedness, calibration, human disagreement, or false-positive/false-negative cost as appropriate.", "p50, p95, and p99 latency, availability, saturation, queue age, and fallback rate.", "Freshness, drift, permission denials, policy violations, and audit completeness.", "Cost per successful outcome, rollback time, recovery time, and downstream business impact."],
    stressEvent: `Peak demand for ${customer} triples while the primary model or data dependency exceeds its latency budget. Quality falls for one important cohort and queued work begins aging. Contain impact, preserve evidence, degrade safely, identify the failing layer, and define recovery gates.`,
    components: archetypeComponents[archetype],
  };
});
