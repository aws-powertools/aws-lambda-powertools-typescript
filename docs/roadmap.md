## Overview

This is our public roadmap that outlines the high level direction we are working towards, namely [Themes](#themes). We update this document when our priorities change, however security and stability is always our top priority.

[See our latest list of activities »](https://github.com/orgs/aws-powertools/projects/7){target="_blank"}

## Themes

!!! info "Operational Excellence is priority number 1."

Themes are key activities maintainers are focusing on, besides bug reports. These are updated periodically and you can get an idea of the overall progress in the [Milestones section](https://github.com/aws-powertools/powertools-lambda-typescript/milestones){target="_blank"}.

### Feature Parity

We want to close the gap between this version of Powertools for AWS Lambda and the [Python version](). This means that in the fullness of time, we want to have the same or equivalent features in both versions.

In the first half of 2023 we have released the [Parameters utility](https://github.com/aws-powertools/powertools-lambda-typescript/milestone/10), and are working on Idempotency. We are currently running a private beta for Idempotency, and plan on releasing the [public beta around July 2023](https://github.com/aws-powertools/powertools-lambda-typescript/milestone/7) at the latest.

For the second half of 2023, we are considering implementing one or more of the following utilities:
- Batch Processing (Status: [RFC](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1082))
- Validation (Status: [RFC](https://github.com/aws-powertools/powertools-lambda-typescript/issues/508))
- Parser (Status: [RFC](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1334))

If any of these utilities are important to you, please let us know by upvoting or commenting on the RFCs.

### Version 2 release

Over the past year, we have gathered a number of feature requests and improvements that we want to implement but that are not backwards compatible with the current API surface. We are planning to release a new major version of the library by the end of 2023, which will include some of these changes.

The following are some of the changes we are considering:
- **ES Modules support ([#521](https://github.com/aws-powertools/powertools-lambda-typescript/issues/521))** - Thanks to the work of the community we have been able to validate the feasibility of dual support for CommonJS and ES Modules. We are currently working on a plan to implement this.
- **TypeScript 5.x support ([#1375](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1375))** - This new version of TypeScript brings breaking changes to the experimental decorators API, which we use in our core utilities. We need to investigate the impact of this change and how to best support it.
- **Correlation IDs ([#129](https://github.com/aws-powertools/powertools-lambda-typescript/issues/129))** - We are considering adding support for correlation IDs, which would allow you to correlate logs and traces across multiple microservices. At this stage it's not clear if this will require a breaking change, but it's likely it might due to the feature spanning multiple utilities.
- **Support for 3rd party observability providers ([#1500](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1500))** - Many of our customers would like to use Powertools for AWS to send logs, traces, and metrics to providers other than Amazon CloudWatch. At the moment we are investigating the feasibility of this for the Logger utility, while the Python version of Powertools for AWS Lambda is considering this also for Tracer and Metrics.

We have not yet decided on the final list of features that will be included in this release, if you have any suggestions please let us know by commenting on [this discussion](https://github.com/aws-powertools/powertools-lambda-typescript/discussions/1269) or upvoting existing suggestions.

### Improve operational excellence

We continue to work on increasing operational excellence to remove as much undifferentiated heavylifting for maintainers, so that we can focus on delivering features that help you.

This means improving our automation workflows, and project management, and test coverage.

## Roadmap status definition

<center>
```mermaid
graph LR
    Ideas --> Backlog --> Work["Working on it"] --> Merged["Coming soon"] --> Shipped
```
<i>Visual representation</i>
</center>

Within our [public board](https://github.com/orgs/aws-powertools/projects/7){target="_blank"}, you'll see the following values in the `Status` column:

* **Ideas**. Incoming and existing feature requests that are not being actively considered yet. These will be reviewed when bandwidth permits and based on demand.
* **Backlog**. Accepted feature requests or enhancements that we want to work on.
* **Working on it**. Features or enhancements we're currently either researching or implementing it.
* **Coming soon**. Any feature, enhancement, or bug fixes that have been merged and are coming in the next release.
* **Shipped**. Features or enhancements that are now available in the most recent release.
* **On hold**. Features or items that are currently blocked until further notice.
* **Pending review**. Features which implementation is mostly completed, but need review and some additional iterations.

> Tasks or issues with empty `Status` will be categorized in upcoming review cycles.

## Process

<center>
```mermaid
graph LR
    PFR[Feature request] --> Triage{Need RFC?}
    Triage --> |Complex/major change or new utility?| RFC[Ask or write RFC] --> Approval{Approved?}
    Triage --> |Minor feature or enhancement?| NoRFC[No RFC required] --> Approval
    Approval --> |Yes| Backlog
    Approval --> |No | Reject["Inform next steps"]
    Backlog --> |Prioritized| Implementation
    Backlog --> |Defer| WelcomeContributions["help-wanted label"]
```
<i>Visual representation</i>
</center>

Our end-to-end mechanism follows four major steps:

* **Feature Request**. Ideas start with a [feature request](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new?assignees=&labels=type/feature-request%2Ctriage&template=feature_request.yml&title=Feature+request%3A+TITLE){target="_blank"} to outline their use case at a high level. For complex use cases, maintainers might ask for/write a RFC.
    * Maintainers review requests based on [project tenets](index.md#tenets){target="_blank"}, customers reaction (👍), and use cases.
* **Request-for-comments (RFC)**. Design proposals use our [RFC issue template](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new?assignees=&labels=type/RFC%2Ctriage&template=rfc.yml&title=RFC%3A+TITLE){target="_blank"} to describe its implementation, challenges, developer experience, dependencies, and alternative solutions.
    * This helps refine the initial idea with community feedback before a decision is made.
* **Decision**. After carefully reviewing and discussing them, maintainers make a final decision on whether to start implementation, defer or reject it, and update everyone with the next steps.
* **Implementation**. For approved features, maintainers give priority to the original authors for implementation unless it is a sensitive task that is best handled by maintainers.

??? info "See [Maintainers](https://github.com/aws-powertools/powertools-lambda-typescript/blob/develop/MAINTAINERS.md) document to understand how we triage issues and pull requests, labels and governance."

## Disclaimer

The Powertools for AWS Lambda team values feedback and guidance from its community of users, although final decisions on inclusion into the project will be made by AWS.

We determine the high-level direction for our open roadmap based on customer feedback and popularity (👍🏽 and comments), security and operational impacts, and business value. Where features don’t meet our goals and longer-term strategy, we will communicate that clearly and openly as quickly as possible with an explanation of why the decision was made.

## FAQs

**Q: Why did you build this?**

A: We know that our customers are making decisions and plans based on what we are developing, and we want to provide our customers the insights they need to plan.

**Q: Why are there no dates on your roadmap?**

A: Because job zero is security and operational stability, we can't provide specific target dates for features. The roadmap is subject to change at any time, and roadmap issues in this repository do not guarantee a feature will be launched as proposed.

**Q: How can I provide feedback or ask for more information?**

A: For existing features, you can directly comment on issues. For anything else, please open an issue.