import type { LearningModule, LessonCourseContent } from "../learningContent";
import type { CatalogPracticeUnit } from "../pdfCatalog";

export const chapter20Module: LearningModule = {
  id: "chapter-20-ml-platform-design",
  title: "ML Platform Design",
  description:
    "Design the internal platform that lets many teams build, train, deploy, and monitor models safely and repeatably. The focus is how feature and embedding stores, experiment tracking, a model registry, training and serving infrastructure, and governance compose into one coherent product for engineers.",
  duration: "5 lessons",
  lessons: [
    {
      id: "ch20-feature-embedding-stores",
      title: "Feature and Embedding Stores",
      prompt: "Make feature computation consistent between training and serving",
      question:
        "A click-through model looks strong in offline evaluation but disappoints in production. Investigation shows the seven-day purchase count is computed by a nightly pandas job for training but recomputed with different missing-value defaults in the streaming serving path. What platform change most directly prevents this class of bug?",
      options: [
        "Define each feature once in a feature store and serve training and inference from the same transformation definitions, with point-in-time-correct joins for training data",
        "Retrain the model more frequently so the offline pipeline's view of the world catches up with production",
        "Push all feature computation into the model artifact itself so there is no separate serving-time path to maintain",
      ],
      correct: 0,
      feedback:
        "Strong choice. A single feature definition feeding both the offline and online stores removes the duplicate computation where skew is born.",
      explanation:
        "Train/serve skew appears when a feature is computed one way in the offline training pipeline and another way at online inference, so the model meets a different input distribution in production while offline metrics stay deceptively healthy. A feature store defines each feature once and materializes it to a columnar offline store for training and a low-latency key-value online store for serving, with point-in-time-correct joins so training never leaks future data. An embedding store applies the same discipline to vector features, versioning embeddings with the model that produced them.",
      takeaways: [
        "Train/serve skew is a platform bug — inconsistent feature computation — not a modeling bug.",
        "One feature definition must feed both the offline training store and the low-latency online store.",
        "Point-in-time-correct joins keep training sets free of future information.",
      ],
      model: ["Define features once", "Serve both stores from shared logic", "Join point-in-time correctly"],
      source: { chapter: 20, sections: ["20.1.1"], pages: "132" },
    },
    {
      id: "ch20-experiment-tracking-reproducibility",
      title: "Experiment Tracking and Reproducibility",
      prompt: "Make every training run reproducible and auditable",
      question:
        "A deployed model regresses after a data pipeline incident, and leadership asks exactly which dataset produced it. The team logged metrics and hyperparameters but cannot reconstruct the training data. What should the platform have captured for every run?",
      options: [
        "The final metrics and the serialized model artifact, since those two define what actually shipped",
        "The (code, data, config) triple plus environment, metrics, and artifacts, with lineage linking the deployed model back to the exact run",
        "The hyperparameters and code commit, because full data snapshots are too expensive to retain for every experiment",
      ],
      correct: 1,
      feedback:
        "Strong choice. Without a pinned data version the run cannot be reproduced or audited, so the (code, data, config) triple is the non-negotiable core.",
      explanation:
        "Reproducibility requires tracking the code version, a data snapshot or manifest, hyperparameters, the environment, metrics, and artifacts for every training run — tools such as MLflow or Weights & Biases exist for exactly this. The non-negotiable is the (code, data, config) triple: without a pinned data version a model cannot be reproduced or audited. Lineage then links each deployed model back to the exact run, data, and commit that produced it.",
      takeaways: [
        "Pin the (code, data, config) triple for every run — an unpinned dataset makes a model irreproducible.",
        "Track environment, metrics, and artifacts alongside hyperparameters.",
        "Lineage connects a deployed model to the exact run, data, and commit behind it.",
      ],
      model: ["Pin code, data, and config", "Track metrics, environment, artifacts", "Link lineage to the deployed model"],
      source: { chapter: 20, sections: ["20.1.2"], pages: "132" },
    },
    {
      id: "ch20-model-registry-deployment",
      title: "Model Registry and Deployment",
      prompt: "Make the registry the system of record and control point for the model lifecycle",
      question:
        "A company keeps model files in blob storage under a naming convention. During an incident, the on-call cannot tell which file is the approved production model or roll back quickly. What does a model registry add that artifact storage cannot?",
      options: [
        "Cheaper redundant storage for large checkpoints and faster uploads from training jobs",
        "A searchable catalog of past experiments so data scientists can rediscover old runs",
        "Versioned models with stage transitions, approval gates, and metadata, with deployment reading from the registry so rollback is a stage change",
      ],
      correct: 2,
      feedback:
        "Strong choice. The registry is the lifecycle control point: staged promotion, approval gates, lineage, and deployment that reads from it make rollback a stage change rather than a rebuild.",
      explanation:
        "Artifact storage holds files; a registry is the system of record for trained models. Each version carries the artifact, lineage to the run, code commit, and data snapshot, evaluation metrics, an owner, and a stage — staging, production, archived — moved through controlled transitions with approval gates. Because deployment reads from the registry, production always runs a known, traceable version, and the registry is where governance (who approved this?) and operations (which version is live?) meet.",
      takeaways: [
        "A registry is the system of record for the model lifecycle, not a file store.",
        "Track artifact, lineage, metrics, owner, and stage per version with approval-gated transitions.",
        "Deployment reads the registry, so rollback is repointing a stage, not rebuilding a model.",
      ],
      model: ["Register versioned artifacts", "Gate stage transitions", "Deploy and roll back from the registry"],
      source: { chapter: 20, sections: ["20.1.3"], pages: "132" },
    },
    {
      id: "ch20-training-serving-infrastructure",
      title: "Training and Serving Infrastructure",
      prompt: "Provide shared compute with self-service guardrails",
      question:
        "Dozens of teams share one GPU cluster. One team's hyperparameter sweep regularly starves everyone else, and each team hand-builds its own serving stack with inconsistent safety checks. What platform design addresses both problems?",
      options: [
        "GPU scheduling with quota management plus orchestrated training pipelines and standardized serving with autoscaling and canary/shadow deploys, delivered as a paved road",
        "Give every team a dedicated GPU pool and let each own its serving stack end to end so nobody interferes with anyone else",
        "Centralize all training and deployment in one platform team so scheduling and safety review happen in a single place",
      ],
      correct: 0,
      feedback:
        "Strong choice. Quotas stop resource starvation, orchestrated DAGs make training repeatable, and standardized paved-road serving bakes in safety instead of relying on each team.",
      explanation:
        "The platform provides shared, scheduled compute: GPU scheduling and quota management so one team cannot starve others, and orchestrated pipelines such as Kubeflow, Airflow, or Flyte for repeatable training DAGs. Serving is standardized too — autoscaling inference, canary and shadow deploys, and batching. The goal is self-service with guardrails: a team ships through paved-road pipelines without reinventing infrastructure or bypassing safety checks.",
      takeaways: [
        "GPU quotas and scheduling keep one team from starving the rest of the fleet.",
        "Orchestrated pipelines make training a repeatable DAG rather than a manual ritual.",
        "Standardized serving with canary/shadow deploys makes the easy path the safe path.",
      ],
      model: ["Schedule and quota shared GPUs", "Orchestrate training pipelines", "Standardize guarded serving"],
      source: { chapter: 20, sections: ["20.1.4"], pages: "132" },
    },
    {
      id: "ch20-monitoring-governance",
      title: "Monitoring and Governance",
      prompt: "Detect drift, wire monitoring to action, and enforce governance as code",
      question:
        "After launch, a model's input feature distribution slowly drifts from its training distribution while no one owns the alert. Weeks later, a compliance review asks who approved the model and how it handles PII. What should the platform provide?",
      options: [
        "A model card template teams may fill in voluntarily, plus a shared dashboard of fleet-wide latency metrics",
        "Data- and prediction-drift detection with thresholds and owners, an audit trail of who deployed what and when, and platform-enforced governance for access control, PII, and model cards",
        "A quarterly manual review board that re-validates every deployed model against its original training data",
      ],
      correct: 1,
      feedback:
        "Strong choice. Monitoring with owners and thresholds catches decay early, and governance enforced by the platform answers audit questions without heroics.",
      explanation:
        "Production models need data-drift and prediction-drift detection, performance monitoring tied to business metrics, and an audit trail of who deployed what and when. Governance covers access control on data and models, PII handling, model cards documenting intended use and limitations, and compliance retention — requirements that regulated industries and emerging AI regulation increasingly demand. Enforcing these through the platform rather than review meetings keeps them uniform.",
      takeaways: [
        "Monitor data drift and prediction drift, and tie performance signals to business metrics.",
        "Keep an audit trail of who deployed what and when.",
        "Enforce access control, PII handling, model cards, and retention through the platform, not through meetings.",
      ],
      model: ["Detect data and prediction drift", "Alert with thresholds and owners", "Enforce governance as code"],
      source: { chapter: 20, sections: ["20.1.5"], pages: "132" },
    },
  ],
};

export const chapter20CourseContent: Record<string, LessonCourseContent> = {
  "ch20-feature-embedding-stores": {
    objectives: [
      "Explain train/serve skew and why offline metrics stay healthy while production degrades.",
      "Design a feature store with offline and online stores fed by one transformation definition.",
      "Extend the same consistency guarantees to versioned embedding stores.",
    ],
    sections: [
      {
        heading: "The train/serve skew mechanism",
        paragraphs: [
          "Train/serve skew is the bug where a feature is computed one way in the offline training pipeline and another way at online inference. The classic shape is an aggregate built by a nightly pandas job for training, but recomputed at serving time by a streaming job with a different default for missing values or a stale value. The model then sees a different input distribution in production than it trained on.",
          "What makes skew dangerous is that offline metrics look fine — they were computed with the offline version of the feature. Production suffers silently because nothing in the training loop ever saw the serving-time computation. Recognizing this as a platform bug rather than a modeling bug is the first step; more data or stronger regularization cannot fix an inconsistent feature path.",
        ],
      },
      {
        heading: "Feature store architecture",
        paragraphs: [
          "A feature store provides consistent features for training and serving by defining each feature once and materializing it to two purpose-built stores. The offline store is columnar and optimized for bulk scans when building training sets; the online store is a low-latency key-value system optimized for point lookups at inference time. Crucially, both are fed by the same transformation definitions, so there is only one implementation of each feature to debug, test, and evolve.",
          "The second pillar is point-in-time correctness. When a training set is assembled, feature values must be joined as of the event time of each label, so training never leaks future information into the model. A store that gets consistency right but joins carelessly still ships a model that will behave differently once it is live.",
        ],
      },
      {
        heading: "Embedding stores",
        paragraphs: [
          "An embedding store extends the same discipline to vector features. Embeddings are versioned and tied to the model that produced them, then served for retrieval and personalization workloads with the same train/serve-consistency guarantees as scalar features.",
          "The version tie matters operationally: when the embedding model changes, the served vectors change meaning, so the store must know which model version produced which vectors. Treating embeddings as anonymous floats invites the same silent skew as hand-rolled features, just in higher dimensions.",
        ],
      },
      {
        heading: "Make the consistent path the only path",
        paragraphs: [
          "The systemic fix is organizational as much as technical: teams get features through the store rather than hand-rolling computation, so skew cannot be introduced by accident. If bypassing the store is easy, someone under deadline pressure will bypass it, and the inconsistency returns.",
          "A mature platform also checks the neighboring failure modes: data drift, where the production distribution has genuinely moved away from training; leakage, where a feature is available at training time but not at serving time; and staleness, where the online store lags behind reality. Skew prevention, drift detection, and freshness monitoring are complementary layers of the same defense.",
        ],
      },
    ],
    example: {
      title: "Worked example: the offline-strong, production-weak model",
      scenario:
        "A recommendations team ships a model whose offline metrics beat the incumbent, but production click-through drops. The offline pipeline computes user purchase aggregates in a daily pandas job; the serving path computes the same aggregate in a streaming job with a different missing-value default and occasionally serves stale values.",
      analysis:
        "Offline evaluation used the offline computation, so it never observed the distribution the model actually faces in production. This is textbook train/serve skew created by two divergent implementations of one feature — a platform bug, not overfitting. The team should also rule out data drift, leakage, and online-store staleness, because they produce similar symptoms.",
      decision:
        "Move the feature into the feature store with a single transformation definition feeding both the columnar offline store and the low-latency online store, rebuild the training set with point-in-time-correct joins, and route all feature access through the store so hand-rolled duplicates cannot reappear.",
    },
    productionChecklist: [
      "Define each feature once and register it in the feature store.",
      "Verify the offline and online stores are materialized from the same transformation definitions.",
      "Assemble training sets with point-in-time-correct joins to prevent future leakage.",
      "Monitor online-store freshness so stale features are detected before they degrade the model.",
      "Version embeddings with the model that produced them and serve them through the store.",
    ],
    commonMistakes: [
      "Computing features separately in the training and serving pipelines with subtly different logic.",
      "Using different missing-value defaults or stale values in the online path.",
      "Building training sets without point-in-time correctness and leaking future data.",
      "Serving embeddings without tying them to the producing model version.",
    ],
    knowledgeChecks: [
      {
        id: "ch20-feature-embedding-stores-kc-1",
        prompt:
          "A fraud team trains on features built by a nightly batch job but serves a separate hand-written streaming implementation of the same features, and production quality lags offline results. Which platform change most directly prevents this?",
        options: [
          "Increase retraining frequency so the nightly training distribution drifts closer to whatever the streaming path computes",
          "Add a model-level calibration layer that rescales predictions to compensate for the streaming path's different feature values",
          "Move both features into a feature store where one transformation definition feeds the offline training store and the low-latency online store",
        ],
        correct: 2,
        feedback:
          "Correct. Each feature is defined once, and both training and inference are served from the same transformation logic, eliminating the duplicate computation that creates train/serve skew.",
      },
      {
        id: "ch20-feature-embedding-stores-kc-2",
        prompt:
          "In this lesson's worked example, the recommendations team consolidated its divergent purchase-aggregate feature into the store. When they rebuild the training set afterward, what additional guarantee must the assembly process provide?",
        options: [
          "Point-in-time-correct joins, so each labeled row only sees feature values available at that moment and training never leaks future data",
          "A larger training window, so the consolidated feature has more history to average over and variance between runs decreases",
          "A separate shadow copy of the online store, so the team can compare serving values against training values after deployment",
        ],
        correct: 0,
        feedback:
          "Correct. Point-in-time-correct joins are required alongside the shared definitions, because consistent features joined carelessly still leak future information into training.",
      },
      {
        id: "ch20-feature-embedding-stores-kc-3",
        prompt:
          "A model's offline metrics are excellent yet production degrades silently; the serving path uses a different missing-value default than the training pipeline. A teammate blames overfitting. What is the most accurate diagnosis?",
        options: [
          "The teammate is right: the model memorized the training set, and the missing-value difference is too small to matter",
          "Train/serve skew — a platform bug where the feature is computed inconsistently offline and online, so the model meets a different input distribution while offline metrics stay healthy",
          "Pure data drift: the production population itself has moved away from the training population, so retraining on fresher data will fix it",
        ],
        correct: 1,
        feedback:
          "Correct. This lesson's skew section names this exact mechanism: inconsistent offline/online feature computation is a platform bug, not a modeling bug, and offline metrics stay fine because they used the offline computation.",
      },
      {
        id: "ch20-feature-embedding-stores-kc-4",
        prompt:
          "An engineer argues that teams should keep the freedom to hand-roll serving features for flexibility and latency tuning, rather than being forced through the feature store. How should a platform lead defend the store-only policy?",
        options: [
          "Concede the point: hand-rolled features are always faster, so the store should remain optional for latency-sensitive teams",
          "Compromise by allowing hand-rolled features as long as each team documents its own computation in a shared wiki page",
          "Argue that the systemic fix is making the consistent path the only path — if bypassing the store is easy, deadline pressure reintroduces skew, and the store's online key-value serving already targets low latency",
        ],
        correct: 2,
        feedback:
          "Correct. This lesson prescribes making the consistent path the only path so skew cannot be introduced by accident, and its architecture section specifies the online store as low-latency key-value serving, so the trade-off favors the store.",
      },
      {
        id: "ch20-feature-embedding-stores-kc-5",
        prompt:
          "Before a personalization launch, the team wants evidence that its feature and embedding store integration is sound. Which pre-launch verification set best matches the platform guarantees described in this lesson?",
        options: [
          "Verify offline and online stores are materialized from the same transformation definitions, test point-in-time-correct joins on the training set, monitor online-store freshness, and confirm embeddings are versioned with the producing model",
          "Run a load test proving the online key-value store meets its latency SLO at peak traffic, then sign off on the integration",
          "Compare the new model's offline metrics against the previous model's, since offline gains are the best predictor of production behavior",
        ],
        correct: 0,
        feedback:
          "Correct. This lesson's guarantees are definitional consistency, point-in-time correctness, freshness, and embedding-to-model versioning; latency load tests and offline metric comparisons alone cannot detect skew, leakage, or staleness.",
      },
    ],
  },
  "ch20-experiment-tracking-reproducibility": {
    objectives: [
      "Enumerate what must be tracked to make a training run reproducible.",
      "Explain why the (code, data, config) triple is non-negotiable for audit and reproduction.",
      "Use lineage to connect a deployed model back to the run, data, and commit that produced it.",
    ],
    sections: [
      {
        heading: "What a reproducible run records",
        paragraphs: [
          "Every training run must be reproducible, which means tracking far more than a final score. The record includes the code version, a data snapshot or manifest, hyperparameters, the environment the run executed in, the metrics it produced, and the artifacts it emitted. Experiment-tracking systems such as MLflow or Weights & Biases exist to capture exactly this bundle.",
          "Each element answers a different future question. The code version says what logic ran; the environment says under what dependencies; hyperparameters say with what settings; metrics and artifacts say what came out. Remove any one of them and the run becomes a story you tell rather than an experiment you can repeat.",
        ],
      },
      {
        heading: "The non-negotiable triple",
        paragraphs: [
          "The non-negotiable core is the (code, data, config) triple. Of the three, the pinned data version is the piece teams skip most often — snapshots feel expensive, and manifests feel like bureaucracy. But without a pinned data version you cannot reproduce or audit a model, full stop.",
          "This becomes painfully concrete during incidents and audits. If a deployed model misbehaves and the training data cannot be reconstructed, the team cannot determine whether the cause was the data, the code, or the configuration — and cannot prove to a reviewer what the model learned from.",
        ],
      },
      {
        heading: "Lineage from deployment back to the run",
        paragraphs: [
          "Lineage is the link from a deployed model back to the exact run, data, and commit that produced it. It turns 'which experiment is this?' from archaeology into a lookup, and it is what makes the registry's audit story credible.",
          "Lineage only works if it is captured at run time, not reconstructed afterward. The platform should record it as a byproduct of running the standard pipeline, so the link exists even for experiments that seemed unimportant at the time — because the unimportant experiment is sometimes the one that gets deployed.",
        ],
      },
      {
        heading: "Tracking as a platform default",
        paragraphs: [
          "Tracking works when it is automatic. If each team wires its own logging, coverage will be uneven and the teams that skip it will be the ones whose models later need investigation. The paved-road pipeline should emit the full run record with no extra effort from the model author.",
          "Uniform tracking also compounds in value: with every run recorded the same way, teams can compare experiments across the fleet, reproduce each other's results, and hand off models without an oral history of how they were made.",
        ],
      },
    ],
    example: {
      title: "Worked example: the unreproducible production model",
      scenario:
        "A demand-forecasting model degrades after a data-pipeline change. The team has the model artifact and a dashboard of its original metrics, but no record of which dataset version or feature definitions produced it, and the engineer who trained it has left.",
      analysis:
        "Metrics and artifacts without the (code, data, config) triple cannot answer the incident's core question: did the model change, or did the world? Because the data version was never pinned, the run is not reproducible and the audit trail ends at tribal knowledge — exactly the failure the platform exists to prevent.",
      decision:
        "Re-establish control by retraining under a tracked pipeline that pins the code commit, data snapshot, and full config, records environment, metrics, and artifacts, and writes lineage from the new deployment back to the run — then require that no model reaches production without that triple.",
    },
    productionChecklist: [
      "Pin the code commit, data snapshot or manifest, and full configuration for every run.",
      "Record the execution environment alongside hyperparameters.",
      "Store metrics and artifacts on the run record, not in scattered dashboards.",
      "Write lineage from every deployed model back to its producing run, data, and commit.",
      "Emit the complete run record automatically from the paved-road training pipeline.",
    ],
    commonMistakes: [
      "Logging metrics and hyperparameters but never pinning the data version.",
      "Treating experiment tracking as a per-team convention instead of a platform default.",
      "Recording configuration without the environment that executed it.",
      "Keeping artifacts with no lineage connecting them to a deployed model.",
    ],
    knowledgeChecks: [
      {
        id: "ch20-experiment-tracking-reproducibility-kc-1",
        prompt:
          "A platform team is scoping what its training pipeline must record per run, and a cost-conscious manager proposes trimming tracking to the final metrics and the serialized artifact. Which minimal record keeps every run reproducible and auditable?",
        options: [
          "The manager's proposal is sufficient, because metrics plus the artifact define exactly what was shipped to production",
          "The (code, data, config) triple plus environment, metrics, and artifacts — without a pinned data version the run cannot be reproduced or audited",
          "The code commit and hyperparameters alone, since datasets are too large to version for every experiment",
        ],
        correct: 1,
        feedback:
          "Correct. The (code, data, config) triple is the non-negotiable: metrics and artifacts without a pinned data version leave a model irreproducible and unauditable.",
      },
      {
        id: "ch20-experiment-tracking-reproducibility-kc-2",
        prompt:
          "In this lesson's worked example, the demand-forecasting team could not reconstruct which dataset produced a degraded production model. What does the lesson's remediation require beyond retraining the model once?",
        options: [
          "Nothing further — a fresh model trained on current data resolves the degradation and closes the incident",
          "A quarterly audit in which senior engineers manually reconstruct the training data of every deployed model",
          "Retraining under a tracked pipeline that pins code, data snapshot, and config, records environment, metrics, and artifacts, writes lineage to the deployment, and gates production on that triple",
        ],
        correct: 2,
        feedback:
          "Correct. The worked example's decision is to rebuild the run record itself: pin the triple, capture environment and artifacts, link lineage, and require the triple before any model reaches production.",
      },
      {
        id: "ch20-experiment-tracking-reproducibility-kc-3",
        prompt:
          "During a regulatory audit, a company cannot prove what data a deployed model learned from, even though every team has its own experiment-tracking habits. What is the underlying platform failure?",
        options: [
          "Tracking was treated as a per-team convention rather than a platform default, so data versions went unpinned and lineage to the deployed model was never recorded",
          "The auditors are asking an unreasonable question, since training data retention is never expected of ML teams",
          "The model artifact was stored in the wrong bucket, so the metrics dashboard cannot locate it",
        ],
        correct: 0,
        feedback:
          "Correct. The pinned data version is non-negotiable and lineage is the link from deployment to run; uneven per-team tracking is exactly the gap that fails an audit.",
      },
      {
        id: "ch20-experiment-tracking-reproducibility-kc-4",
        prompt:
          "A data scientist objects that pinning a data snapshot or manifest for every experiment is expensive bureaucracy that slows iteration. How should the platform team defend the requirement?",
        options: [
          "Agree and pin data only for runs the scientist considers important, keeping iteration fast everywhere else",
          "Defend it as non-negotiable: without a pinned data version a model cannot be reproduced or audited, and pipeline-emitted tracking makes the cost near zero at authoring time",
          "Drop data pinning and compensate by keeping longer hyperparameter logs, which are cheaper to store",
        ],
        correct: 1,
        feedback:
          "Correct. The (code, data, config) triple is non-negotiable precisely because unpinned data blocks reproduction and audit; making the paved pipeline emit the record removes the friction argument.",
      },
      {
        id: "ch20-experiment-tracking-reproducibility-kc-5",
        prompt:
          "A release manager wants a hard gate that stops unreproducible models from reaching production. Which gate check best implements this lesson's guidance?",
        options: [
          "Confirm the model's metrics beat the incumbent's on the team's latest evaluation dashboard before allowing promotion",
          "Require the deploying engineer to attest in a ticket that they remember which dataset and code produced the model",
          "Require a complete run record — pinned code, data snapshot, config, environment, metrics, artifacts — plus lineage linking the candidate deployment back to its exact run",
        ],
        correct: 2,
        feedback:
          "Correct. Reproducibility is defined as the full run record with lineage to run, data, and commit; dashboard comparisons and memory-based attestations are exactly what fails incidents and audits.",
      },
    ],
  },
  "ch20-model-registry-deployment": {
    objectives: [
      "Distinguish a model registry from simple artifact storage.",
      "Specify what the registry tracks per model version, including stages and approval gates.",
      "Explain how deployment reading from the registry gives instant rollback and auditability.",
    ],
    sections: [
      {
        heading: "Registry versus artifact storage",
        paragraphs: [
          "Artifact storage just holds files. A model registry is the system of record and the control point for the model lifecycle: it knows which versions exist, which stage each is in, who approved it, and what evidence backed that approval. A bucket with a naming convention can imitate storage but not this control.",
          "The difference shows up under pressure. With artifact storage, 'what is live and can we roll back?' is answered by tribal knowledge and grep. With a registry, it is a query — and the answer is the same for the on-call engineer and for an auditor.",
        ],
      },
      {
        heading: "What the registry tracks",
        paragraphs: [
          "Per model version, the registry tracks the artifact itself, the lineage to the exact run, code commit, and data snapshot that produced it, evaluation metrics, the owner, and a stage. Stages follow controlled transitions — staging to production to archived — gated by approvals so promotion is a deliberate, recorded act.",
          "This metadata is what turns a file into a governed model. Metrics say why the version deserves production; lineage says how to rebuild or investigate it; the owner says who is accountable; the stage says what is allowed to serve traffic.",
        ],
      },
      {
        heading: "Deployment reads from the registry",
        paragraphs: [
          "The critical integration is that deployment reads from the registry. What runs in production is therefore always a known, traceable version — never a file someone copied to a server. Rollback becomes a registry stage change: repoint production to the previous version instead of rebuilding or hunting for the old artifact.",
          "This design makes rollback fast enough to be a real incident response rather than a hope. Because the previous production version is still registered with its stage history, reverting is a controlled transition with the same audit trail as the original promotion.",
        ],
      },
      {
        heading: "Where governance meets operations",
        paragraphs: [
          "The registry is the point where governance and operations meet: governance asks who approved this model and on what evidence, operations asks which version is live and how to roll it back. One system answers both, which is why it matters for regulated deployments where promotion evidence is required.",
          "It also supports reproducibility and audit after an incident: lineage lets the team reconstruct or investigate any deployed model. Without a registry, those questions depend on memory and log spelunking, which fails audits and slows incident response.",
        ],
      },
    ],
    example: {
      title: "Worked example: rollback during a bad release",
      scenario:
        "A fraud model promoted last night begins blocking legitimate transactions. The serving team needs to revert within minutes, and the compliance team will later ask who approved the release and what evaluation supported it.",
      analysis:
        "Because deployment reads the registry, the currently live version is unambiguous and the previous production version is still registered with its lineage and metrics. Rollback is a stage transition, not a rebuild. The approval gate on the promotion already recorded who approved the model and the metrics they saw, answering the compliance question without a separate investigation.",
      decision:
        "Transition the new version out of production in the registry and repoint deployment to the prior version, then use the recorded lineage and approval metadata for the post-incident review and the regulator-facing audit trail.",
    },
    productionChecklist: [
      "Register every trained model version with artifact, lineage, metrics, and owner.",
      "Enforce stage transitions — staging, production, archived — through approval gates.",
      "Configure deployment to read from the registry so only known versions can serve.",
      "Verify rollback is a stage change and practice it before an incident forces you to.",
      "Retain promotion evidence so regulated deployments can show who approved what.",
    ],
    commonMistakes: [
      "Treating blob storage with naming conventions as if it were a registry.",
      "Allowing deployments to run artifacts that were never registered.",
      "Planning rollback as a rebuild rather than a registry stage change.",
      "Recording approvals in meeting notes instead of on the version itself.",
    ],
    knowledgeChecks: [
      {
        id: "ch20-model-registry-deployment-kc-1",
        prompt:
          "A company stores model files in object storage with a careful naming convention, yet during incidents nobody can say which file is approved for production. What capability should the platform introduce?",
        options: [
          "A model registry: versioned models with staged transitions and approval gates, per-version lineage, metrics, and owner metadata, with deployment reading from it",
          "A stricter naming convention with timestamps and approver initials encoded into every uploaded artifact's filename",
          "A second, redundant bucket so model files survive storage outages and can be diffed when versions are unclear",
        ],
        correct: 0,
        feedback:
          "Correct. This lesson's opening section distinguishes a registry from artifact storage: staged promotion, approval gates, lineage, and deployment integration are lifecycle controls a bucket cannot imitate, whatever the naming scheme.",
      },
      {
        id: "ch20-model-registry-deployment-kc-2",
        prompt:
          "In this lesson's worked example, a fraud model promoted last night starts blocking legitimate transactions and must be reverted within minutes. How does the registry-based design make that response possible?",
        options: [
          "The on-call retrains the previous model from its archived notebook and redeploys it once training completes",
          "The on-call searches object storage for the newest file whose name suggests it was previously approved",
          "Deployment reads the registry, so rollback is a stage change: repoint production to the prior registered version, which still carries its lineage and metrics",
        ],
        correct: 2,
        feedback:
          "Correct. This lesson's deployment section defines rollback as a registry stage change rather than a rebuild, because deployment reads the registry and the previous production version remains registered.",
      },
      {
        id: "ch20-model-registry-deployment-kc-3",
        prompt:
          "After a model incident, an auditor asks who approved the deployment and on what evidence. The team digs through chat logs and meeting notes for days. Which platform gap does this reveal?",
        options: [
          "The team chose the wrong chat tool, making approval history unnecessarily hard to search",
          "Promotions were never gated in a registry, so approval evidence lives in tribal knowledge instead of on the model version where governance and operations meet",
          "The incident was caused by a serving bug, so approval records would not have helped anyway",
        ],
        correct: 1,
        feedback:
          "Correct. This lesson's governance section says approval gates must record who approved a model and on what evidence; without the registry as control point, those answers come from tribal knowledge and grep, which fails audits.",
      },
      {
        id: "ch20-model-registry-deployment-kc-4",
        prompt:
          "A team asks to deploy model artifacts directly from its training jobs to serving, arguing that routing every deployment through the registry adds friction. What is the strongest defense of the registry requirement?",
        options: [
          "Direct deploys break the control point: production would no longer always run a known, traceable version, instant rollback would vanish, and regulated deployments would lose recorded promotion evidence",
          "The registry exists mainly to reduce storage costs through deduplication, so the team should route through it to save money",
          "The friction is intentional punishment for fast-moving teams, and slowing them down is the governance goal",
        ],
        correct: 0,
        feedback:
          "Correct. This lesson ties deployment-reads-registry to traceability, instant rollback, and recorded approvals for regulated deployments; the friction is the price of those controls, not a punishment.",
      },
      {
        id: "ch20-model-registry-deployment-kc-5",
        prompt:
          "A platform team is validating its registry rollout before mandating it fleet-wide. Which verification set best confirms the registry is functioning as the lifecycle control point this lesson describes?",
        options: [
          "Confirm artifacts upload quickly and that storage costs dropped compared with the previous bucket layout",
          "Spot-check that a few teams have started using the registry's search page to browse old experiments",
          "Prove that only registered versions can serve, that stage transitions require approvals and record evidence, that each version carries lineage and metrics, and that a practiced rollback completes as a stage change",
        ],
        correct: 2,
        feedback:
          "Correct. This lesson's registry definition is staged promotion with approval gates, per-version lineage and metrics, deployment reading from it, and rollback as a stage change; upload speed and search browsing prove none of these.",
      },
    ],
  },
  "ch20-training-serving-infrastructure": {
    objectives: [
      "Design shared GPU scheduling with quotas that protect multi-tenant fairness.",
      "Use orchestrated pipelines to make training a repeatable DAG.",
      "Standardize serving with autoscaling, batching, and canary/shadow deploys behind a paved road.",
    ],
    sections: [
      {
        heading: "Shared, scheduled compute",
        paragraphs: [
          "The platform provides shared, scheduled compute rather than per-team infrastructure. GPU scheduling and quota management are the core fairness mechanisms: without them, one team's sweep can starve every other team's training jobs, and the platform's most expensive resource becomes a source of conflict.",
          "Quotas are also a planning tool. They make consumption visible per team, which enables cost allocation and capacity conversations grounded in data rather than in whoever shouted loudest in the cluster queue.",
        ],
      },
      {
        heading: "Orchestrated training pipelines",
        paragraphs: [
          "Repeatable training needs orchestration, not cron and hope. Pipelines built with systems such as Kubeflow, Airflow, or Flyte express training as a DAG of versioned steps, so rerunning a pipeline produces the same stages in the same order with visible dependencies and retries.",
          "Orchestration is what makes the rest of the platform connect: the pipeline is where experiment tracking records the run, where the registry receives the resulting version, and where evaluation gates execute before promotion. A team that hand-runs notebooks steps outside every one of those controls.",
        ],
      },
      {
        heading: "Standardized serving",
        paragraphs: [
          "On the serving side, the platform standardizes inference: autoscaling to match traffic, batching for efficiency, and canary and shadow deploys so a new version proves itself on limited or mirrored traffic before full exposure.",
          "Standardization is a safety mechanism as much as a convenience. When every team hand-builds serving, each reinvents autoscaling and release safety with uneven quality; when serving is a platform capability, the guardrails are built once, reviewed once, and inherited by every model.",
        ],
      },
      {
        heading: "Self-service with guardrails",
        paragraphs: [
          "The design goal is self-service with guardrails: a team ships a model through paved-road pipelines without reinventing infrastructure and without bypassing safety checks. The easy path must be the safe path — CI evaluation gates, drift monitoring, and rollback come free when you use the platform's pipelines, which is precisely why teams keep using them.",
          "This framing treats the platform as a product whose users are engineers. Success is measured by adoption and time-to-production, because a platform nobody uses is a failure regardless of how elegant its architecture looks on a diagram.",
        ],
      },
    ],
    example: {
      title: "Worked example: one cluster, many teams",
      scenario:
        "Thirty teams share a GPU cluster. Training jobs from one team's architecture search routinely monopolize devices, and each team's bespoke serving setup has its own scaling quirks; two recent launches went straight to full traffic without any staged exposure.",
      analysis:
        "Both symptoms are platform gaps, not team misbehavior. There is no quota management enforcing fairness on the training side, and no standardized serving path providing canary or shadow deploys on the inference side — so teams rationally build their own. Adding more GPUs would raise cost without fixing either failure mode.",
      decision:
        "Introduce GPU scheduling with per-team quotas, move training onto orchestrated pipelines (Kubeflow, Flyte, or Airflow), and provide standardized serving with autoscaling, batching, and canary/shadow deploys — packaged as the paved road so the safe path is also the easiest one to take.",
    },
    productionChecklist: [
      "Enforce GPU quotas and scheduling so no team can starve the shared fleet.",
      "Express training as orchestrated, versioned DAGs instead of manual job sequences.",
      "Ship serving with autoscaling, batching, and canary/shadow deploys built in.",
      "Wire pipelines to tracking, registry, and evaluation gates so guardrails are automatic.",
      "Measure adoption and time-to-production as the platform's success metrics.",
    ],
    commonMistakes: [
      "Sharing GPUs without quota management and letting sweeps starve other teams.",
      "Letting every team hand-build serving with inconsistent release safety.",
      "Sending new model versions straight to full traffic with no canary or shadow stage.",
      "Judging the platform by its architecture diagram instead of adoption and time-to-production.",
    ],
    knowledgeChecks: [
      {
        id: "ch20-training-serving-infrastructure-kc-1",
        prompt:
          "On a shared GPU cluster, one team's architecture search regularly monopolizes devices while other teams' training jobs wait for days. What should the platform introduce first to restore multi-tenant fairness?",
        options: [
          "More GPUs, since scarcity is the root cause and additional capacity removes the contention by definition",
          "GPU scheduling with quota management, so one team cannot starve the others and consumption becomes visible per team",
          "A booking spreadsheet where teams reserve devices in advance and resolve conflicts in a weekly meeting",
        ],
        correct: 1,
        feedback:
          "Correct. GPU scheduling and quota management are the mechanism that keeps one team from starving others; adding hardware without quotas raises cost without fixing fairness.",
      },
      {
        id: "ch20-training-serving-infrastructure-kc-2",
        prompt:
          "In this lesson's worked example, thirty teams share a cluster, one team's search monopolizes devices, and two launches went straight to full traffic. Which combined remediation matches the lesson's platform design?",
        options: [
          "Per-team GPU quotas, orchestrated training pipelines, and standardized serving with autoscaling plus canary and shadow deploys, packaged as the paved road",
          "A dedicated GPU pool per team and full per-team ownership of bespoke serving stacks, so no two teams ever interact",
          "A central platform team that takes over all training and deployment work so every launch passes through one review",
        ],
        correct: 0,
        feedback:
          "Correct. The prescription is quota-managed shared compute, orchestrated DAGs, and standardized guarded serving delivered as a paved road; dedicated pools and centralization abandon self-service with guardrails.",
      },
      {
        id: "ch20-training-serving-infrastructure-kc-3",
        prompt:
          "Two recent launches skipped any staged exposure and went directly to full traffic, and each team's hand-built serving stack scales differently under load. What is the most accurate diagnosis of this situation?",
        options: [
          "The teams are reckless; the fix is stricter discipline and a written policy forbidding direct-to-production launches",
          "The cluster needs bigger instances, since proper autoscaling is impossible on undersized hardware",
          "A platform gap: with no standardized serving providing canary and shadow deploys, teams rationally build their own uneven stacks and launches inherit that missing guardrail",
        ],
        correct: 2,
        feedback:
          "Correct. The worked example's analysis treats both symptoms as platform gaps, not team misbehavior: absent standardized serving with canary/shadow stages, every hand-built stack reinvents release safety unevenly.",
      },
      {
        id: "ch20-training-serving-infrastructure-kc-4",
        prompt:
          "A director proposes centralizing all model training and deployment in one platform team to guarantee safety review, instead of building self-service paved-road pipelines. How should the platform lead argue against this?",
        options: [
          "Agree — centralization is the only way to guarantee that safety checks are never bypassed by product teams",
          "Argue that a central bottleneck does not scale to dozens of teams; self-service with guardrails makes the easy path the safe path, so teams get gates and rollback without bypassing them",
          "Propose instead that each team hire its own infrastructure engineers to guarantee both speed and safety",
        ],
        correct: 1,
        feedback:
          "Correct. The goal is self-service with guardrails: paved-road pipelines ship models without reinventing infrastructure or bypassing safety checks, which a central team cannot deliver at fleet scale.",
      },
      {
        id: "ch20-training-serving-infrastructure-kc-5",
        prompt:
          "The platform team has shipped quotas, orchestrated pipelines, and standardized serving, and leadership asks how success will be judged over the next two quarters. Which metrics best match this lesson's guidance?",
        options: [
          "Adoption and time-to-production, because a platform nobody uses is a failure regardless of its architecture",
          "The number of platform components shipped per quarter, since shipping volume demonstrates platform momentum",
          "Aggregate GPU utilization alone, because keeping devices busy proves the scheduling investment paid off",
        ],
        correct: 0,
        feedback:
          "Correct. This lesson's self-service section measures platform success by adoption and time-to-production, since a platform nobody uses is a failure regardless of architecture; component counts and utilization ignore that test.",
      },
    ],
  },
  "ch20-monitoring-governance": {
    objectives: [
      "Monitor data drift, prediction drift, and business-tied performance for deployed models.",
      "Maintain an audit trail of who deployed what and when.",
      "Enforce access control, PII handling, model cards, and retention as platform-level governance.",
    ],
    sections: [
      {
        heading: "Drift and performance monitoring",
        paragraphs: [
          "Production models need data-drift and prediction-drift detection. Input feature drift — the production distribution moving away from the training distribution — predicts quality decay before outcomes arrive, and prediction drift shows the model's output distribution shifting. Alongside these, performance monitoring should be tied to business metrics, not just model-internal scores.",
          "Signals without owners are noise. Each monitored signal needs an alert threshold and a named owner, so a drift alert starts an investigation rather than decorating a dashboard nobody watches.",
        ],
      },
      {
        heading: "The audit trail",
        paragraphs: [
          "The platform keeps an audit trail of who deployed what and when. This sounds mundane until an incident or a regulator asks the question; then it is the difference between a lookup and a forensic project spanning chat logs and deploy scripts.",
          "The audit trail also closes the loop with the registry: promotion approvals, stage changes, and rollbacks are all recorded acts, so the history of a production model reads as a governed sequence rather than a series of anonymous events.",
        ],
      },
      {
        heading: "Governance scope",
        paragraphs: [
          "Governance covers access control on data and models, PII handling, model cards documenting intended use and limitations, and compliance retention. These are not optional polish — they are increasingly required for regulated industries and by emerging AI regulation.",
          "Model cards deserve emphasis: documenting intended use and limitations is how a platform communicates what a model is for and where it should not be applied, which protects both downstream users and the organization when a model is tempting to stretch beyond its evidence.",
        ],
      },
      {
        heading: "Governance as code",
        paragraphs: [
          "The platform enforces governance as code: access control, PII policy, and model-card requirements are applied by the platform itself rather than by review meetings. Enforcement that depends on calendar-driven human review will be skipped under deadline pressure, unevenly across teams.",
          "Uniform enforcement through the paved road changes the economics of compliance. Teams inherit monitoring, audit trails, and policy checks by default, so the governed path is also the path of least resistance — and the organization can demonstrate its controls to external reviewers with platform evidence instead of meeting minutes.",
        ],
      },
    ],
    example: {
      title: "Worked example: the quiet drift and the compliance review",
      scenario:
        "A credit-decisioning model's input features drift slowly for two months; the drift dashboard exists but no one owns its alerts, so quality decay is discovered by the business first. In the same quarter, a compliance review asks who approved the model, what PII it touches, and what its documented limitations are.",
      analysis:
        "Two platform gaps compound here: monitoring signals without thresholds and owners, and governance artifacts that were never enforced at promotion time. Neither can be fixed retroactively with a meeting — the audit trail, model card, and PII handling needed to exist as part of the deployment path.",
      decision:
        "Wire data- and prediction-drift detection to owned alert thresholds and a retraining path, keep the deployment audit trail queryable, and enforce access control, PII policy, and model cards as platform gates so every model — not just the diligent teams' — carries them.",
    },
    productionChecklist: [
      "Detect input data drift and prediction drift for every deployed model.",
      "Tie model performance monitoring to business metrics, not only model scores.",
      "Assign an alert threshold and a named owner to every monitored signal.",
      "Keep a queryable audit trail of who deployed what and when.",
      "Enforce access control, PII handling, model cards, and retention through the platform.",
    ],
    commonMistakes: [
      "Collecting drift metrics with no thresholds or owners, so alerts never fire into action.",
      "Monitoring only system health while ignoring data and prediction distributions.",
      "Treating model cards and PII policy as voluntary documentation.",
      "Enforcing governance through review meetings instead of platform controls.",
    ],
    knowledgeChecks: [
      {
        id: "ch20-monitoring-governance-kc-1",
        prompt:
          "A deployed model's input feature distribution is slowly moving away from its training distribution, and leadership wants to know which signal would have warned the team before business outcomes suffered. What should the platform surface?",
        options: [
          "Business revenue metrics, since they are the ultimate measure of model quality in production",
          "Serving latency percentiles, because slow responses are the earliest symptom of any model degradation",
          "Data-drift detection on input features, which predicts quality decay before outcomes arrive, plus prediction-drift detection on the model's output distribution",
        ],
        correct: 2,
        feedback:
          "Correct. Data-drift and prediction-drift detection are required precisely because input drift predicts quality decay before business outcomes and latency do.",
      },
      {
        id: "ch20-monitoring-governance-kc-2",
        prompt:
          "In this lesson's worked example, a credit-decisioning model drifted for two months while its dashboard alerts had no owner, and compliance later asked who approved it and what PII it touches. Which remediation matches the lesson?",
        options: [
          "Give every monitored signal a threshold and named owner, keep a queryable audit trail of who deployed what and when, and enforce access control, PII policy, and model cards as platform gates",
          "Hire an analyst to watch the drift dashboard full-time and write a monthly summary for the compliance team",
          "Schedule a yearly governance summit where teams present their models and answer compliance questions in person",
        ],
        correct: 0,
        feedback:
          "Correct. The worked example's decision wires drift signals to thresholds and owners and enforces audit trail, PII handling, and model cards through the platform, matching the full monitoring and governance scope.",
      },
      {
        id: "ch20-monitoring-governance-kc-3",
        prompt:
          "A platform collects drift metrics for every model, yet degradations keep being discovered by the business rather than by the team. The dashboards look comprehensive. What is the most likely failure?",
        options: [
          "The drift metrics are mathematically unable to detect real degradation and should be replaced with accuracy tracking",
          "Signals exist without thresholds and owners, so alerts never fire into action and monitoring decorates dashboards instead of triggering investigation",
          "The business is interfering in engineering matters and should be kept away from model quality discussions",
        ],
        correct: 1,
        feedback:
          "Correct. This is the lesson's common-mistake pattern: collecting drift metrics with no thresholds or owners means alerts never fire into action; signals without owners are noise.",
      },
      {
        id: "ch20-monitoring-governance-kc-4",
        prompt:
          "A compliance officer proposes quarterly review meetings where each team explains its models' data access, PII handling, and intended use, instead of building those checks into the platform. How should the platform team respond?",
        options: [
          "Accept the proposal, since human judgment in a meeting is always more reliable than automated policy checks",
          "Counter with documentation: ask every team to keep a voluntary model card template updated between reviews instead",
          "Argue for governance as code: meeting-driven enforcement is skipped under deadline pressure and applied unevenly, while platform-enforced access control, PII policy, and model cards make the governed path the default",
        ],
        correct: 2,
        feedback:
          "Correct. This lesson's governance-as-code section prescribes enforcement by the platform rather than review meetings; voluntary templates and calendar reviews are the uneven enforcement the lesson warns against.",
      },
      {
        id: "ch20-monitoring-governance-kc-5",
        prompt:
          "A team claims its new model is production-ready from a monitoring and governance standpoint. Which evidence should the platform require before accepting that claim?",
        options: [
          "A screenshot of a monitoring dashboard and a verbal confirmation that the team will watch it after launch",
          "Data- and prediction-drift detection live with thresholds and owners, performance tied to business metrics, an audit-trail entry for the deployment, and enforced access control, PII handling, and a model card",
          "A passing load test and a signed email from the team's manager accepting all future compliance risk",
        ],
        correct: 1,
        feedback:
          "Correct. The bar is drift detection, business-tied performance monitoring, a deployment audit trail, and platform-enforced access control, PII handling, and model cards; screenshots and attestation emails are not evidence.",
      },
    ],
  },
};

export const chapter20Practice: CatalogPracticeUnit[] = [
  {
    id: "ch20-20-2-1",
    chapter: 20,
    chapterTitle: "ML Platform Design",
    title: "What is train/serve skew and how does a platform prevent it?",
    pages: "133",
    route: "/practice/ml-platform-design/what-is-train-serve-skew-and-how-does-a-platform-prevent-it",
    competencies: ["feature stores", "experiment tracking", "registry", "platform governance"],
    question:
      "Your model performs well offline but poorly in production. How could the platform be causing this, and how do you prevent it?",
    options: [
      {
        text: "Conclude the model overfit the training data, then respond with stronger regularization and a larger training set until offline and online metrics agree.",
        correct: false,
        feedback:
          "This is the junior diagnosis the question warns about: it reaches for a modeling fix and never checks whether the offline and online feature computations are even the same.",
      },
      {
        text: "Name train/serve skew: the feature is computed one way in the offline pipeline and another at serving time, so production sees a different input distribution while offline metrics stay healthy. Prevent it with a feature store that defines each feature once and serves training and inference from the same transformation logic with point-in-time-correct joins, and also check data drift, leakage, and stale features — then make the store the only path.",
        correct: true,
        feedback:
          "Correct. This names the mechanism (offline/online inconsistency), prescribes the single-definition feature store with point-in-time joins, adds the drift/leakage/staleness checks, and makes the consistent path the only path — the full senior answer.",
      },
      {
        text: "Average the outputs of the offline and online feature computations at serving time so neither pipeline's quirks can dominate the model's input distribution.",
        correct: false,
        feedback:
          "Blending two inconsistent computations produces a third, equally unvalidated distribution; the fix is one shared feature definition, not a compromise between two divergent ones.",
      },
    ],
  },
  {
    id: "ch20-20-2-2",
    chapter: 20,
    chapterTitle: "ML Platform Design",
    title: "Design an ML platform for many teams",
    pages: "133",
    route: "/practice/ml-platform-design/design-an-ml-platform-for-many-teams",
    competencies: ["feature stores", "experiment tracking", "registry", "platform governance"],
    question:
      "Design an internal ML platform that lets dozens of teams train and deploy models safely. What are the core components and principles?",
    options: [
      {
        text: "Walk through the standard tools — MLflow for tracking, Kubeflow for pipelines, a feature store for features — describing what each does and letting teams adopt whichever combination fits their preferences.",
        correct: false,
        feedback:
          "Listing tools is the junior answer: without principles like the paved road and governance as code, optional adoption means uneven reproducibility and teams bypassing every guardrail.",
      },
      {
        text: "Centralize all model training and deployment in a single platform team so safety review happens in one place and no team can schedule jobs or ship models independently.",
        correct: false,
        feedback:
          "This sacrifices the self-service goal entirely; a central bottleneck does not scale to dozens of teams and contradicts the platform-as-a-product framing the question is testing.",
      },
      {
        text: "Frame the platform as a product for engineers: a feature/embedding store, experiment tracking of the (code, data, config) triple, a model registry with staged promotion and approval gates, orchestrated pipelines on quota-managed GPUs, and standardized serving — led by the principles of reproducibility, paved road, multi-tenant isolation, and governance as code, rolled out registry-and-tracking first, and measured by adoption and time-to-production.",
        correct: true,
        feedback:
          "Correct. This leads with platform-as-product principles rather than a tool list, phases the rollout by leverage, and measures success by adoption and time-to-production — exactly the staff-level framing.",
      },
    ],
  },
  {
    id: "ch20-20-2-3",
    chapter: 20,
    chapterTitle: "ML Platform Design",
    title: "What belongs in a model registry and why?",
    pages: "134",
    route: "/practice/ml-platform-design/what-belongs-in-a-model-registry-and-why",
    competencies: ["feature stores", "experiment tracking", "registry", "platform governance"],
    question:
      "What does a model registry do that simple artifact storage doesn't, and what must it track?",
    options: [
      {
        text: "Artifact storage just holds files; the registry is the system of record and control point for the lifecycle. Per version it tracks the artifact, lineage to the exact run, code commit, and data snapshot, evaluation metrics, the owner, and a stage moved through approval-gated transitions — and deployment reads from it, so production always runs a known version and rollback is a stage change. This serves operations (instant rollback), governance (recorded approvals), and audit (reconstructing any deployed model).",
        correct: true,
        feedback:
          "Correct. It distinguishes the registry from blob storage, enumerates lineage/metrics/owner/stage with approval gates, and ties each capability to operations, governance, and audit — the three reasons the question is after.",
      },
      {
        text: "A registry is mainly a durability and cost layer: it keeps checkpoints in redundant, cheaper storage and adds search so teams can find old artifacts by name when they need them.",
        correct: false,
        feedback:
          "This describes artifact storage with an index, not a lifecycle control point — it omits staged promotion, approval gates, lineage, and deployment integration entirely.",
      },
      {
        text: "The registry's core job is to compress and encrypt model weights for secure storage, since approval and rollback questions can be answered from experiment-tracking logs and deployment history.",
        correct: false,
        feedback:
          "Security features miss the point: without the registry as the system of record, approval and rollback answers come from tribal knowledge and grep, which fails audits and slows incident response.",
      },
    ],
  },
  {
    id: "ch20-20-2-4",
    chapter: 20,
    chapterTitle: "ML Platform Design",
    title: "How do you monitor models in production on a platform?",
    pages: "134",
    route: "/practice/ml-platform-design/how-do-you-monitor-models-in-production-on-a-platform",
    competencies: ["feature stores", "experiment tracking", "registry", "platform governance"],
    question:
      "What does the platform need to monitor for deployed models, and how do you act on it?",
    options: [
      {
        text: "Track accuracy and latency on a shared dashboard and page the on-call engineer whenever either metric crosses a global threshold.",
        correct: false,
        feedback:
          "This is the junior answer: two metrics without data/prediction drift, owners, or any connection to retraining or rollback — and ground-truth accuracy often arrives too late to protect users.",
      },
      {
        text: "Monitor three layers — data (feature drift, schema violations, missing or stale features), model (prediction drift, accuracy and calibration as ground truth arrives, plus LLM proxy signals like refusal rate), and system (latency, throughput, error rate, cost per prediction) — each with a threshold and an owner. Wire confirmed drift to a retrain through the standard pipeline, route quality regressions to registry rollback, feed production failures back into the eval set, and deliver all of it by default through the platform.",
        correct: true,
        feedback:
          "Correct. It covers the data/model/system layers with owners and thresholds, connects monitoring to action (retrain, rollback, eval-set feedback), and makes the loop automatic and uniform through the paved road.",
      },
      {
        text: "Sample a fixed percentage of production predictions for a quarterly human quality review, and retrain every model on a fixed calendar schedule regardless of what the signals say.",
        correct: false,
        feedback:
          "Calendar-driven review and retraining are disconnected from the actual signals; drift can do months of damage between quarters, and unneeded retrains waste the very pipeline capacity the platform manages.",
      },
    ],
  },
];
