---
title: Homepage
description: AWS Lambda Powertools TypeScript
---

!!! warning  "Do not use this library in production"

    AWS Lambda Powertools for TypeScript is currently released as a beta developer preview and is intended strictly for feedback purposes only.  
    This version is not stable, and significant breaking changes might incur as part of the upcoming [production-ready release](https://github.com/awslabs/aws-lambda-powertools-typescript/milestone/2){target="_blank"}.

    **Do not use this library for production workloads.**




AWS Lambda Powertools TypeScript provides a suite of utilities for AWS Lambda functions running on the Node.js runtime, to ease the adoption of best practices such as tracing, structured logging, custom metrics, and more.

## Tenets

This project separates core utilities that will be available in other runtimes vs general utilities that might not be available across all runtimes.

* **AWS Lambda only**. We optimise for AWS Lambda function environments and supported runtimes only. Utilities might work with web frameworks and non-Lambda environments, though they are not officially supported.
* **Eases the adoption of best practices**. The main priority of the utilities is to facilitate best practices adoption, as defined in the AWS Well-Architected Serverless Lens; all other functionality is optional.
* **Keep it lean**. Additional dependencies are carefully considered for security and ease of maintenance, and prevent negatively impacting startup time.
* **We strive for backwards compatibility**. New features and changes should keep backwards compatibility. If a breaking change cannot be avoided, the deprecation and migration process should be clearly defined.
* **We work backwards from the community**. We aim to strike a balance of what would work best for 80% of customers. Emerging practices are considered and discussed via Requests for Comment (RFCs)
* **Progressive**. Utilities are designed to be incrementally adoptable for customers at any stage of their Serverless journey. They follow language idioms and their community’s common practices.

## Installation

The AWS Lambda Powertools TypeScript utilities follow a modular approach, similar to the official [AWS SDK v3 for JavaScript](https://github.com/aws/aws-sdk-js-v3).
Each TypeScript utility is installed as standalone NPM package.

[Installation guide for the **Tracer** utility](./core/tracer.md#getting-started)  

[Installation guide for the **Logger** utility](./core/logger.md#getting-started)  

[Installation guide for the **Metrics** utility](./core/metrics.md#getting-started)  

## Features

| Utility | Description
| ------------------------------------------------- | ---------------------------------------------------------------------------------
[Tracer](./core/tracer.md) | Utilities to trace Lambda function handlers, and both synchronous and asynchronous functions
[Logger](./core/logger.md) | Structured logging made easier, and a middleware to enrich structured logging with key details of the Lambda context
[Metrics](./core/metrics.md) | Custom Metrics created asynchronously via CloudWatch Embedded Metric Format (EMF)

## Environment variables

!!! info
    **Explicit parameters take precedence over environment variables.**

| Environment variable                      | Description | Utility                   | Default               |
|-------------------------------------------| --------------------------------------------------------------------------------- |---------------------------|-----------------------|
| **POWERTOOLS_SERVICE_NAME**               | Sets service name used for tracing namespace, metrics dimension and structured logging | All                       | `"service_undefined"` |
| **POWERTOOLS_METRICS_NAMESPACE**          | Sets namespace used for metrics | [Metrics](./core/metrics) | `None`                |
| **POWERTOOLS_TRACE_ENABLED**              | Explicitly disables tracing | [Tracer](./core/tracer)   | `true`                |
| **POWERTOOLS_TRACER_CAPTURE_RESPONSE**    | Captures Lambda or method return as metadata. | [Tracer](./core/tracer)   | `true`                |
| **POWERTOOLS_TRACER_CAPTURE_ERROR**       | Captures Lambda or method exception as metadata. | [Tracer](./core/tracer)   | `true`                |
| **POWERTOOLS_LOGGER_LOG_EVENT**           | Logs incoming event | [Logger](./core/logger)   | `false`               |
| **POWERTOOLS_LOGGER_SAMPLE_RATE**         | Debug log sampling | [Logger](./core/logger)  | `0`                   |
| **POWERTOOLS_LOG_DEDUPLICATION_DISABLED** | Disables log deduplication filter protection to use Pytest Live Log feature | [Logger](./core/logger)  | `false`               |
| **LOG_LEVEL**                             | Sets logging level | [Logger](./core/logger)  | `INFO`                |
