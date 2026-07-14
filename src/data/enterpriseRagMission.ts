import { missionSchema } from "../domain/missionSchema";

export const enterpriseRagMission = missionSchema.parse({
  id: "mission-enterprise-rag-v1",
  slug: "enterprise-rag",
  title: "Design an Enterprise RAG Platform",
  summary: "Build secure retrieval for 10,000 employees and 50 million document chunks.",
  duration: "45-60 min",
  skills: ["Requirements", "Capacity", "Retrieval", "Reliability", "Evaluation", "Security", "Communication"],
  requirements: [
    { id: "identity", label: "Enforce employee identity and document-level authorization" },
    { id: "latency", label: "Keep query-path P95 latency below three seconds" },
    { id: "freshness", label: "Make changed documents searchable within fifteen minutes" },
  ],
  components: [
    { id: "api-gateway", label: "API Gateway", service: "API Gateway", category: "entry", description: "Authentication, routing, and quotas" },
    { id: "ecs", label: "ECS retrieval service", service: "ECS Fargate", category: "compute", description: "Query orchestration and context assembly" },
    { id: "lambda", label: "Lambda", service: "AWS Lambda", category: "compute", description: "Event-driven document processing" },
    { id: "sqs", label: "SQS ingestion queue", service: "Amazon SQS", category: "queue", description: "Burst buffering and retry isolation" },
    { id: "opensearch", label: "OpenSearch", service: "Amazon OpenSearch", category: "data", description: "Hybrid vector and keyword retrieval" },
    { id: "s3", label: "Document store", service: "Amazon S3", category: "data", description: "Versioned source documents" },
    { id: "bedrock", label: "Amazon Bedrock", service: "Amazon Bedrock", category: "ai", description: "Managed model inference" },
  ],
});
